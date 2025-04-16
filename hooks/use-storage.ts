import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useStorage() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    file: File,
    bucket: string,
    onProgress?: (progress: number) => void,
    fileName?: string
  ): Promise<string> => {
    try {
      setIsUploading(true);
      console.log(`Début de l'upload vers le bucket ${bucket}`, { file, fileName });

      // Générer un nom de fichier unique si non fourni
      const finalFileName = fileName || `${Date.now()}_${file.name}`;
      console.log("Nom du fichier final:", finalFileName);

      // Vérification de la taille du fichier
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`Le fichier est trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`);
      }

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, file, {
          cacheControl: "3600",
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`Progression de l'upload: ${percent}%`);
            onProgress?.(percent);
          },
        });

      if (error) {
        console.error("Erreur détaillée lors de l'upload:", {
          message: error.message,
          statusCode: error.statusCode,
          name: error.name,
          details: error.details,
        });
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      console.log("Upload réussi:", data);

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(finalFileName);

      console.log("URL publique générée:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Erreur dans uploadFile:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (url: string): Promise<void> => {
    try {
      console.log("Tentative de suppression du fichier:", url);
      
      // Extraire le nom du fichier de l'URL
      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const bucket = urlParts[urlParts.length - 2];
      
      console.log("Informations extraites:", { fileName, bucket });

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error("Erreur lors de la suppression:", error);
        throw error;
      }

      console.log("Fichier supprimé avec succès");
    } catch (error) {
      console.error("Erreur dans deleteFile:", error);
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
  };
} 