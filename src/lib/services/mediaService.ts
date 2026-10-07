import { createClient } from '@/lib/supabase/client';
import { removeStorageImages, uploadImageFile } from '@/lib/services/imageUploadService';

export type MediaCategory = 'homepage' | 'portfolio' | 'services' | 'locations' | 'avatar' | 'other';
export interface MediaRecord { id: string; bucket: string; storage_path: string; public_url?: string; filename: string; mime_type?: string; size_bytes?: number; category: MediaCategory; created_at: string }
export interface MediaUploadProgress { file: File; index: number; status: 'uploading' | 'success' | 'error'; progress: number; error?: string }

export async function listMedia(search = '') {
  let query = createClient().from('media').select('id,bucket,storage_path,public_url,filename,mime_type,size_bytes,category,created_at').order('created_at', { ascending: false }).limit(100);
  if (search) query = query.ilike('filename', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MediaRecord[];
}

export async function uploadMedia(files: File[], category: MediaCategory, onProgress?: (progress: MediaUploadProgress) => void) {
  const supabase = createClient();
  const results: Array<MediaRecord | undefined> = Array(files.length);
  const errors: string[] = [];
  let cursor = 0;
  const bucket = category === 'portfolio' ? 'portfolio' : category === 'services' ? 'services' : category === 'locations' ? 'locations' : category === 'avatar' ? 'avatars' : 'site-assets';

  const worker = async () => {
    while (cursor < files.length) {
      const index = cursor++;
      const file = files[index];
      onProgress?.({ file, index, status: 'uploading', progress: 10 });
      try {
        const uploaded = await uploadImageFile(file, { bucket, folder: `media/${category}` });
        onProgress?.({ file, index, status: 'uploading', progress: 75 });
        const { data, error } = await supabase.from('media').insert({
          bucket, storage_path: uploaded.path, public_url: uploaded.url,
          filename: file.name, mime_type: uploaded.mimeType, size_bytes: uploaded.sizeBytes, category,
          metadata: { source_type: file.type, source_size: file.size, encoding: 'storage-webp', width: uploaded.width, height: uploaded.height },
        }).select('id,bucket,storage_path,public_url,filename,mime_type,size_bytes,category,created_at').single();
        if (error) { await removeStorageImages(bucket, [uploaded.path]); throw new Error(`Không thể lưu thông tin ảnh: ${error.message}`); }
        results[index] = data as MediaRecord;
        onProgress?.({ file, index, status: 'success', progress: 100 });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload ảnh thất bại.';
        errors.push(`${file.name}: ${message}`);
        onProgress?.({ file, index, status: 'error', progress: 100, error: message });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker));
  if (errors.length && !results.some(Boolean)) throw new Error(errors.join('\n'));
  return results.filter((item): item is MediaRecord => Boolean(item));
}

export async function deleteMedia(item: MediaRecord) {
  const supabase = createClient();
  if (item.bucket !== 'database') {
    const used = await Promise.all([
      supabase.from('homepage_sections').select('id').eq('image_url', item.public_url).limit(1),
      supabase.from('services').select('id').eq('cover_image', item.public_url).limit(1),
      supabase.from('portfolio_albums').select('id').eq('cover_image', item.public_url).limit(1),
      supabase.from('portfolio_images').select('id').eq('image_url', item.public_url).limit(1),
      supabase.from('locations').select('id').eq('cover_image', item.public_url).limit(1),
    ]);
    if (used.some((result) => (result.data?.length ?? 0) > 0)) throw new Error('Ảnh đang được sử dụng. Hãy thay ảnh tại nội dung liên quan trước khi xóa.');
    const { error: storageError } = await supabase.storage.from(item.bucket).remove([item.storage_path]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from('media').delete().eq('id', item.id);
  if (error) throw error;
}
