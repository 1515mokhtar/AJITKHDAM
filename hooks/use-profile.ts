import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Profil, ProfilChercheur, ProfilEntreprise } from '@/types/profile';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useStorage } from './use-storage';

export function useProfile() {
  const { user } = useAuth();
  const { uploadFile, deleteFile, isUploading, error: storageError } = useStorage();
  const [profile, setProfile] = useState<Profil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching profile...', user.uid);
      fetchProfile();
    } else {
      console.log('No user authenticated, resetting profile state');
      setProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        console.log('No user found, skipping profile fetch');
        return;
      }

      console.log('Fetching profile for user:', user.uid);
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as Profil;
        console.log('Profile found:', profileData);
        setProfile(profileData);
      } else {
        console.log('No profile found for user:', user.uid);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    data: Partial<ProfilChercheur | ProfilEntreprise>,
    files?: { [key: string]: File }
  ) => {
    try {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      console.log('Updating profile for user:', user.uid);
      console.log('Update data:', data);
      console.log('Files to upload:', files);

      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      // Gérer les fichiers si présents
      const fileUrls: { [key: string]: string } = {};
      if (files) {
        for (const [key, file] of Object.entries(files)) {
          console.log(`Uploading file for ${key}:`, file);
          const url = await uploadFile(file, key as any);
          fileUrls[key] = url;
        }
      }

      // Préparer les données du profil
      const profileData = {
        ...data,
        ...fileUrls,
        updatedAt: new Date().toISOString(),
      };

      if (profileSnap.exists()) {
        console.log('Updating existing profile');
        await updateDoc(profileRef, profileData);
      } else {
        console.log('Creating new profile');
        // S'assurer que le rôle est défini
        const userRole = user.role || 'chercheur';
        console.log('User role:', userRole);
        
        await setDoc(profileRef, {
          ...profileData,
          userId: user.uid,
          role: userRole,
          createdAt: new Date().toISOString(),
        });
      }

      // Rafraîchir les données du profil
      await fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    isUploading,
    updateProfile,
    refreshProfile: fetchProfile,
  };
} 