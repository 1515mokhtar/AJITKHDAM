"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { toast } from "sonner";
import { Profil, Formation } from "@/types/profile";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface Liens {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

interface PersonalInfo {
  telephone: string;
  ville: string;
  pays: string;
  adresse: string;
  liens: Liens;
}

interface Education {
  formations: Formation[];
}

interface Documents {
  cv: File | null;
  photoProfil: File | null;
  cvUrl: string;
  photoProfilUrl: string;
}

interface ProfileFormData {
  personal: PersonalInfo;
  education: Education;
  documents: Documents;
}

interface ProfileFormContextType {
  formData: ProfileFormData;
  updateFormData: (section: keyof ProfileFormData, data: any) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  resetFormData: () => void;
  lastSaved: number | null;
}

const defaultFormData: ProfileFormData = {
  personal: {
    telephone: "",
    ville: "",
    pays: "",
    adresse: "",
    liens: {},
  },
  education: {
    formations: [],
  },
  documents: {
    cv: null,
    photoProfil: null,
    cvUrl: "",
    photoProfilUrl: "",
  },
};

const ProfileFormContext = createContext<ProfileFormContextType | undefined>(undefined);

export function useProfileForm() {
  const context = useContext(ProfileFormContext);
  if (context === undefined) {
    throw new Error("useProfileForm must be used within a ProfileFormProvider");
  }
  return context;
}

export function ProfileFormProvider({ children, initialProfile }: { children: React.ReactNode; initialProfile?: Profil }) {
  const { user } = useAuth();
  const [formData, setFormData] = useLocalStorage<ProfileFormData>("profile-form-data", defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  // Utiliser des refs pour suivre les valeurs sans déclencher de re-rendus
  const isInitialized = useRef(false);
  const formDataRef = useRef(formData);
  const initialProfileRef = useRef(initialProfile);
  const userIdRef = useRef<string | null>(null);
  const lastSavedRef = useRef<number | null>(null);
  const userRef = useRef(user);

  // Mettre à jour les refs lorsque les valeurs changent
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    initialProfileRef.current = initialProfile;
  }, [initialProfile]);

  useEffect(() => {
    lastSavedRef.current = lastSaved;
  }, [lastSaved]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Fonction pour réinitialiser les données du formulaire
  const resetFormDataInternal = useCallback(() => {
    // Réinitialiser les données du formulaire à leur état par défaut
    setFormData(defaultFormData);
    
    // Supprimer les données du localStorage
    localStorage.removeItem("profile-form-data");
    
    // Réinitialiser le timestamp de dernière sauvegarde
    setLastSaved(null);
    
    // Réinitialiser l'état d'initialisation
    isInitialized.current = false;
    
    // Réinitialiser les références
    formDataRef.current = defaultFormData;
    
    console.log("Données du formulaire réinitialisées avec succès");
  }, [setFormData, setLastSaved]);

  // Fonction pour initialiser les données à partir du profil
  const initializeFromProfile = useCallback(() => {
    if (initialProfileRef.current?.chercheur && userRef.current) {
      setFormData({
        personal: {
          telephone: initialProfileRef.current.chercheur.telephone || "",
          ville: initialProfileRef.current.chercheur.ville || "",
          pays: initialProfileRef.current.chercheur.pays || "",
          adresse: initialProfileRef.current.chercheur.adresse || "",
          liens: initialProfileRef.current.chercheur.liens || {},
        },
        education: {
          formations: initialProfileRef.current.chercheur.formations || [],
        },
        documents: {
          cv: null,
          photoProfil: null,
          cvUrl: initialProfileRef.current.chercheur.cv || "",
          photoProfilUrl: initialProfileRef.current.chercheur.photoProfil || "",
        },
      });
    }
  }, [setFormData]);

  // Fonction pour sauvegarder les données dans le localStorage
  const saveToLocalStorage = useCallback(() => {
    if (isInitialized.current && userRef.current) {
      localStorage.setItem("profile-form-data", JSON.stringify(formDataRef.current));
      setLastSaved(Date.now());
    }
  }, []);

  // Fonction pour charger les données du localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (!isInitialized.current && userRef.current) {
      const savedData = localStorage.getItem("profile-form-data");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(parsedData);
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error);
        }
      }
      isInitialized.current = true;
    }
  }, [setFormData]);

  // Fonction pour gérer le changement d'utilisateur
  const handleUserChange = useCallback(() => {
    if (userRef.current) {
      // Si l'utilisateur a changé, réinitialiser les données du formulaire
      if (userIdRef.current !== userRef.current.uid) {
        console.log("Nouvel utilisateur détecté, réinitialisation des données du formulaire");
        resetFormDataInternal();
        userIdRef.current = userRef.current.uid;
      }
    } else {
      // Si l'utilisateur se déconnecte, réinitialiser les données
      console.log("Utilisateur déconnecté, réinitialisation des données du formulaire");
      resetFormDataInternal();
      userIdRef.current = null;
    }
  }, [resetFormDataInternal]);

  // Effet pour gérer le changement d'utilisateur
  useEffect(() => {
    handleUserChange();
  }, [handleUserChange]);

  // Effet pour charger les données du localStorage au montage
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Effet pour sauvegarder les données dans le localStorage lorsque formData change
  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  // Effet pour initialiser les données à partir du profil
  useEffect(() => {
    initializeFromProfile();
  }, [initializeFromProfile]);

  // Utiliser useCallback pour éviter les recréations inutiles de fonctions
  const updateFormData = useCallback((section: keyof ProfileFormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  }, [setFormData]);

  const resetFormData = useCallback(() => {
    resetFormDataInternal();
  }, [resetFormDataInternal]);

  const value = {
    formData,
    updateFormData,
    isSubmitting,
    setIsSubmitting,
    resetFormData,
    lastSaved,
  };

  return (
    <ProfileFormContext.Provider value={value}>
      {children}
    </ProfileFormContext.Provider>
  );
} 