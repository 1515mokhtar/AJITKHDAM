"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { EducationForm } from "./EducationForm";
import { DocumentsForm } from "./DocumentsForm";
import { Profil } from "@/types/profile";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createClient } from "@supabase/supabase-js";

// Initialiser le client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface ProfileFormProps {
  profile: Profil | null;
  onUpdate: (data: Partial<Profil>) => Promise<void>;
}

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Stockage local pour les données des formulaires
  const [personalData, setPersonalData] = useLocalStorage("personal-form", {
    telephone: "",
    ville: "",
    pays: "",
    adresse: "",
    liens: {},
  });

  const [educationData, setEducationData] = useLocalStorage("education-form", {
    formations: [],
  });

  const [documentsData, setDocumentsData] = useLocalStorage("documents-form", {
    cv: null,
    photoProfil: null,
  });

  // Fonction pour valider les données du formulaire
  const validateFormData = () => {
    const errors: string[] = [];

    // Validation des informations personnelles
    if (!personalData.telephone) errors.push("Le numéro de téléphone est requis");
    if (!personalData.ville) errors.push("La ville est requise");
    if (!personalData.pays) errors.push("Le pays est requis");
    if (!personalData.adresse) errors.push("L'adresse est requise");

    // Validation de la formation (au moins une formation)
    if (educationData.formations.length === 0) {
      errors.push("Au moins une formation est requise");
    } else {
      // Vérifier que chaque formation a tous les champs requis
      educationData.formations.forEach((formation, index) => {
        if (!formation.titre) errors.push(`Le titre de la formation ${index + 1} est requis`);
        if (!formation.etablissement) errors.push(`L'établissement de la formation ${index + 1} est requis`);
        if (!formation.dateDebut) errors.push(`La date de début de la formation ${index + 1} est requise`);
        if (!formation.ville) errors.push(`La ville de la formation ${index + 1} est requise`);
        if (!formation.pays) errors.push(`Le pays de la formation ${index + 1} est requis`);
      });
    }

    // Validation des documents
    if (!documentsData.cv) errors.push("Le CV est requis");
    if (!documentsData.photoProfil) errors.push("La photo de profil est requise");

    return errors;
  };

  // Fonction pour télécharger un fichier sur Supabase
  const uploadFile = async (file: File, bucket: string, path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier:", error);
      throw error;
    }
  };

  // Fonction pour enregistrer toutes les données
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Valider les données
      const errors = validateFormData();
      if (errors.length > 0) {
        toast({
          title: "Erreur de validation",
          description: (
            <ul className="list-disc pl-5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          ),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Télécharger les fichiers sur Supabase
      let cvUrl = "";
      let photoProfilUrl = "";

      if (documentsData.cv instanceof File) {
        cvUrl = await uploadFile(
          documentsData.cv,
          "cv",
          `${profile?.userId || "temp"}/${documentsData.cv.name}`
        );
      }

      if (documentsData.photoProfil instanceof File) {
        photoProfilUrl = await uploadFile(
          documentsData.photoProfil,
          "avatars",
          `${profile?.userId || "temp"}/${documentsData.photoProfil.name}`
        );
      }

      // Préparer les données pour Firebase
      const updatedProfile: Partial<Profil> = {
        chercheur: {
          telephone: personalData.telephone,
          ville: personalData.ville,
          pays: personalData.pays,
          adresse: personalData.adresse,
          liens: personalData.liens,
          formations: educationData.formations.map(formation => ({
            ...formation,
            dateDebut: formation.dateDebut.toISOString(),
            dateFin: formation.dateFin ? formation.dateFin.toISOString() : "",
          })),
          cv: cvUrl || profile?.chercheur?.cv || "",
          photoProfil: photoProfilUrl || profile?.chercheur?.photoProfil || "",
        },
      };

      // Mettre à jour le profil dans Firebase
      await onUpdate(updatedProfile);

      toast({
        title: "Profil mis à jour",
        description: "Votre profil a été enregistré avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre profil.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Informations personnelles</TabsTrigger>
          <TabsTrigger value="education">Formation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PersonalInfoForm
            profile={profile}
            onUpdate={(data) => {
              if (data.chercheur) {
                setPersonalData({
                  telephone: data.chercheur.telephone || "",
                  ville: data.chercheur.ville || "",
                  pays: data.chercheur.pays || "",
                  adresse: data.chercheur.adresse || "",
                  liens: data.chercheur.liens || {},
                });
              }
            }}
            initialData={personalData}
          />
        </TabsContent>
        <TabsContent value="education">
          <EducationForm
            profile={profile}
            onUpdate={(data) => {
              if (data.chercheur?.formations) {
                setEducationData({
                  formations: data.chercheur.formations.map(formation => ({
                    ...formation,
                    dateDebut: new Date(formation.dateDebut),
                    dateFin: formation.dateFin ? new Date(formation.dateFin) : undefined,
                  })),
                });
              }
            }}
            initialData={educationData}
          />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsForm
            profile={profile}
            onUpdate={(data) => {
              if (data.chercheur) {
                setDocumentsData({
                  cv: documentsData.cv,
                  photoProfil: documentsData.photoProfil,
                });
              }
            }}
            initialData={documentsData}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer le profil"}
        </Button>
      </div>
    </div>
  );
} 