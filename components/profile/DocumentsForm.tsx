"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfileForm } from "@/context/profile-context";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const formSchema = z.object({
  cv: z.any().optional(),
  photoProfil: z.any().optional(),
});

export function DocumentsForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { formData, updateFormData, isSubmitting, setIsSubmitting } = useProfileForm();
  const [cvPreview, setCvPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cv: null,
      photoProfil: null,
    },
  });

  // Initialiser les aperçus uniquement au montage du composant
  useEffect(() => {
    if (!isInitialized.current) {
      if (formData.documents.cvUrl) {
        setCvPreview(formData.documents.cvUrl);
      }
      if (formData.documents.photoProfilUrl) {
        setPhotoPreview(formData.documents.photoProfilUrl);
      }
      isInitialized.current = true;
    }
  }, []);

  // Fonction pour gérer le téléchargement de fichiers
  const handleFileUpload = async (file: File, type: "cv" | "photo") => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.uid}/${Date.now()}.${fileExt}`;
      const bucket = type === "cv" ? "cv" : "avatars";

      // Mise à jour de l'aperçu
      if (type === "photo") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Téléchargement vers Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Mise à jour du contexte avec l'URL du fichier
      const updatedDocuments = {
        ...formData.documents,
        [type === "cv" ? "cvUrl" : "photoProfilUrl"]: publicUrl,
        [type]: file,
      };
      
      updateFormData("documents", updatedDocuments);

      // Mise à jour de l'aperçu
      if (type === "cv") {
        setCvPreview(publicUrl);
      }

      toast.success(`${type === "cv" ? "CV" : "Photo de profil"} téléchargé avec succès`);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error(`Erreur lors du téléchargement du ${type === "cv" ? "CV" : "photo de profil"}`);
    }
  };

  // Fonction pour gérer la soumission du formulaire
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Vérification des fichiers requis
      if (!formData.documents.cvUrl || !formData.documents.photoProfilUrl) {
        toast.error("Veuillez télécharger tous les documents requis");
        return;
      }

      if (!user) {
        toast.error("Vous devez être connecté pour enregistrer votre profil");
        return;
      }

      // Préparation des données pour Firebase
      const db = getFirestore();
      const profileRef = doc(db, "profiles", user.uid);

      // Création de l'objet profil complet avec des valeurs par défaut
      const profileData = {
        userId: user.uid,
        role: "chercheur",
        chercheur: {
          telephone: formData.personal.telephone || "",
          ville: formData.personal.ville || "",
          pays: formData.personal.pays || "",
          adresse: formData.personal.adresse || "",
          liens: {
            github: formData.personal.liens?.github || "",
            linkedin: formData.personal.liens?.linkedin || "",
            portfolio: formData.personal.liens?.portfolio || "",
          },
          formations: formData.education.formations || [],
          cv: formData.documents.cvUrl,
          photoProfil: formData.documents.photoProfilUrl,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Enregistrement dans Firebase
      await setDoc(profileRef, profileData, { merge: true });

      // Nettoyage des formulaires et du localStorage
      form.reset({
        cv: null,
        photoProfil: null,
      });
      
      // Nettoyage du localStorage
      localStorage.removeItem("profile-form-data");
      
      // Nettoyage du contexte
      updateFormData("personal", {
        telephone: "",
        ville: "",
        pays: "",
        adresse: "",
        liens: {},
      });
      updateFormData("education", {
        formations: [],
      });
      updateFormData("documents", {
        cv: null,
        photoProfil: null,
        cvUrl: "",
        photoProfilUrl: "",
      });
      setCvPreview(null);
      setPhotoPreview(null);
      isInitialized.current = false;

      // Message de succès
      toast.success("Votre profil est complet !", {
        description: "Toutes vos informations ont été enregistrées avec succès.",
      });
      
      // Redirection vers la page de profil
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      // Message d'erreur détaillé
      toast.error("Erreur lors de la sauvegarde du profil", {
        description: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Téléchargez votre CV et votre photo de profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section CV */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="cv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CV (PDF)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                              handleFileUpload(file, "cv");
                            }
                          }}
                          className="flex-1"
                        />
                        {cvPreview && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span>CV téléchargé</span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section Photo de profil */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="photoProfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo de profil</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                                handleFileUpload(file, "photo");
                              }
                            }}
                            className="flex-1"
                          />
                          {photoPreview && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-5 w-5" />
                              <span>Photo téléchargée</span>
                            </div>
                          )}
                        </div>
                        {photoPreview && (
                          <div className="relative w-32 h-32 rounded-full overflow-hidden">
                            <Image
                              src={photoPreview}
                              alt="Photo de profil"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !formData.documents.cvUrl || !formData.documents.photoProfilUrl}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer le profil"
          )}
        </Button>
      </form>
    </Form>
  );
} 