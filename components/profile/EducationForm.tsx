"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Profil } from "@/types/profile";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit } from "lucide-react";
import { useProfileForm } from "@/context/profile-context";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

const formationSchema = z.object({
  diplome: z.string().min(1, "Le diplôme est requis"),
  etablissement: z.string().min(1, "L'établissement est requis"),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().optional(),
  description: z.string().optional(),
});

const formSchema = z.object({
  formations: z.array(formationSchema),
});

interface EducationFormProps {
  profile: Profil;
  onUpdate: (data: Partial<Profil>) => Promise<void>;
}

export function EducationForm({ profile, onUpdate }: EducationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formData, updateFormData } = useProfileForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  // Désactiver complètement la redirection automatique
  // Nous ne vérifions plus la complétion du profil ici
  // La redirection sera gérée uniquement par le bouton "Modifier le profil"

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formations: formData.education.formations || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "formations",
  });

  // Fonction pour activer le mode édition
  const enableEditing = async () => {
    if (!user) return;
    
    try {
      setIsEditing(true);
      setHasRedirected(false);
      
      // Vider le localStorage pour éviter la redirection
      localStorage.removeItem("profile-form-data");
      
      // Mettre à jour le statut de complétion dans Firebase
      const db = getFirestore();
      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        profileCompleted: 'no'
      }, { merge: true });
      
      toast({
        title: "Mode édition activé",
        description: "Vous pouvez maintenant modifier votre profil sans être redirigé.",
      });
    } catch (error) {
      console.error("Erreur lors de l'activation du mode édition:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer le mode édition.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Récupérer les données actuelles du profil
      const db = getFirestore();
      const profileRef = doc(db, "profiles", user.uid);
      const profileDoc = await getDoc(profileRef);
      const currentProfile = profileDoc.data();

      // Préparer les données à sauvegarder
      const profileData = {
        chercheur: {
          ...currentProfile?.chercheur,
          formations: values.formations,
          updatedAt: new Date().toISOString(),
        },
      };

      // Sauvegarder dans Firebase
      await setDoc(profileRef, profileData, { merge: true });

      // Mettre à jour le contexte local
      updateFormData("education", { formations: values.formations });

      // Vérifier si le profil est complet
      const isProfileComplete = checkProfileCompletion(currentProfile, values.formations);
      
      // Mettre à jour le statut de complétion
      await setDoc(profileRef, {
        profileCompleted: isProfileComplete ? 'yes' : 'no'
      }, { merge: true });

      // Désactiver le mode édition après l'enregistrement
      setIsEditing(false);

      toast({
        title: "Succès",
        description: "Vos formations ont été mises à jour.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast({
        title: "Erreur",
        description: `Erreur lors de la mise à jour: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour vérifier si le profil est complet
  const checkProfileCompletion = (currentProfile: any, formations: any[]): boolean => {
    if (!currentProfile?.chercheur) return false;

    const chercheur = currentProfile.chercheur;
    
    // Vérifier les champs obligatoires
    if (!chercheur.telephone || !chercheur.ville || !chercheur.pays) {
      return false;
    }

    // Vérifier si au moins une formation est présente
    if (!formations || formations.length === 0) {
      return false;
    }

    // Vérifier si tous les champs de la formation sont remplis
    const hasValidFormation = formations.some(formation => 
      formation.diplome && 
      formation.etablissement && 
      formation.dateDebut
    );

    if (!hasValidFormation) {
      return false;
    }

    return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Formation</CardTitle>
            <CardDescription>
              Ajoutez vos formations et diplômes.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={enableEditing}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifier le profil
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Formation {index + 1}</h3>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`formations.${index}.diplome`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diplôme *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`formations.${index}.etablissement`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Établissement *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`formations.${index}.dateDebut`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de début *</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`formations.${index}.dateFin`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de fin</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`formations.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ diplome: "", etablissement: "", dateDebut: "", dateFin: "", description: "" })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une formation
                </Button>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}