"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Linkedin, Globe } from "lucide-react";
import { toast } from "sonner";
import { ProfilChercheur, Formation } from "@/types/profile";
import { getFirestore } from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";

const formSchema = z.object({
  telephone: z.string().min(1, "Le numéro de téléphone est requis"),
  ville: z.string().min(1, "La ville est requise"),
  pays: z.string().min(1, "Le pays est requis"),
  adresse: z.string().min(1, "L'adresse est requise"),
  liens: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    portfolio: z.string().optional(),
  }).optional(),
  formations: z.array(z.object({
    titre: z.string().min(1, "Le titre est requis"),
    etablissement: z.string().min(1, "L'établissement est requis"),
    ville: z.string().min(1, "La ville est requise"),
    pays: z.string().min(1, "Le pays est requis"),
    dateDebut: z.string().min(1, "La date de début est requise"),
    dateFin: z.string().min(1, "La date de fin est requise"),
  })).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface PersonalInfoFormProps {
  initialData?: Partial<ProfilChercheur>;
}

export function PersonalInfoForm({ initialData }: PersonalInfoFormProps) {
  const { user, updateProfileCompletion } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telephone: initialData?.telephone || "",
      ville: initialData?.ville || "",
      pays: initialData?.pays || "",
      adresse: initialData?.adresse || "",
      liens: {
        github: initialData?.liens?.github || "",
        linkedin: initialData?.liens?.linkedin || "",
        portfolio: initialData?.liens?.portfolio || "",
      },
      formations: initialData?.formations || [],
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Vérifier si tous les champs requis sont remplis
      const isProfileComplete = checkProfileCompletion(data);
      
      // Préparer les données à sauvegarder
      const profileData = {
        telephone: data.telephone,
        ville: data.ville,
        pays: data.pays,
        adresse: data.adresse,
        liens: data.liens,
        formations: data.formations,
        updatedAt: new Date().toISOString(),
        profileCompleted: isProfileComplete ? 'yes' : 'no'
      };

      // Sauvegarder dans Firebase
      const db = getFirestore();
      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        chercheur: profileData
      }, { merge: true });

      // Mettre à jour le statut de complétion du profil
      await updateProfileCompletion(user.uid, isProfileComplete);

      // Afficher un message approprié
      if (isProfileComplete) {
        toast.success("Profil complété avec succès");
      } else {
        toast.info("Profil mis à jour, mais certains champs sont encore requis");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour des informations personnelles");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour vérifier si le profil est complet
  const checkProfileCompletion = (data: FormData): boolean => {
    // Vérifier les champs obligatoires
    if (!data.telephone || !data.ville || !data.pays || !data.adresse) {
      return false;
    }

    // Vérifier si au moins une formation est présente
    if (!data.formations || data.formations.length === 0) {
      return false;
    }

    // Vérifier si tous les champs de la formation sont remplis
    const hasValidFormation = data.formations.some(formation => 
      formation.titre && 
      formation.etablissement && 
      formation.ville && 
      formation.pays && 
      formation.dateDebut && 
      formation.dateFin
    );

    if (!hasValidFormation) {
      return false;
    }

    return true;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Remplissez vos informations personnelles pour compléter votre profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                {...form.register("telephone")}
                placeholder="Votre numéro de téléphone"
              />
              {form.formState.errors.telephone && (
                <p className="text-sm text-red-500">{form.formState.errors.telephone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville *</Label>
              <Input
                id="ville"
                {...form.register("ville")}
                placeholder="Votre ville"
              />
              {form.formState.errors.ville && (
                <p className="text-sm text-red-500">{form.formState.errors.ville.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pays">Pays *</Label>
              <Input
                id="pays"
                {...form.register("pays")}
                placeholder="Votre pays"
              />
              {form.formState.errors.pays && (
                <p className="text-sm text-red-500">{form.formState.errors.pays.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse *</Label>
              <Input
                id="adresse"
                {...form.register("adresse")}
                placeholder="Votre adresse"
              />
              {form.formState.errors.adresse && (
                <p className="text-sm text-red-500">{form.formState.errors.adresse.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liens professionnels (optionnels)</CardTitle>
          <CardDescription>
            Ajoutez vos liens professionnels pour améliorer votre visibilité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github">
              <Github className="inline-block w-4 h-4 mr-2" />
              GitHub
            </Label>
            <Input
              id="github"
              {...form.register("liens.github")}
              placeholder="Votre profil GitHub"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">
              <Linkedin className="inline-block w-4 h-4 mr-2" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              {...form.register("liens.linkedin")}
              placeholder="Votre profil LinkedIn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">
              <Globe className="inline-block w-4 h-4 mr-2" />
              Portfolio
            </Label>
            <Input
              id="portfolio"
              {...form.register("liens.portfolio")}
              placeholder="Votre site portfolio"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
} 