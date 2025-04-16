import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFile(
  file: File,
  bucket: 'cv' | 'avatars',
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${bucket}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteFile(
  url: string,
  bucket: 'cv' | 'avatars'
): Promise<void> {
  const filePath = url.split('/').pop();
  if (!filePath) return;

  const { error: deleteError } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (deleteError) {
    throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
  }
} 