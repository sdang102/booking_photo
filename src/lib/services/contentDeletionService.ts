import { createClient } from '@/lib/supabase/client';
import { removeStorageImages } from '@/lib/services/imageUploadService';

export interface DeletionResult {
  cleanupWarning?: string;
}

export async function deletePortfolioAlbum(albumId: string): Promise<DeletionResult> {
  const supabase = createClient();
  const [albumResult, imageResult] = await Promise.all([
    supabase
      .from('portfolio_albums')
      .select('cover_image_path,cover_image_mobile_path')
      .eq('id', albumId)
      .maybeSingle(),
    supabase
      .from('portfolio_images')
      .select('storage_path,thumb_path')
      .eq('album_id', albumId),
  ]);

  if (albumResult.error) throw new Error('Không thể đọc đường dẫn ảnh bìa trước khi xóa album.');
  if (imageResult.error) throw new Error('Không thể đọc danh sách ảnh trước khi xóa album.');

  const paths = [
    albumResult.data?.cover_image_path,
    albumResult.data?.cover_image_mobile_path,
    ...(imageResult.data ?? []).flatMap((image) => [image.storage_path, image.thumb_path]),
  ];
  const { error } = await supabase.from('portfolio_albums').delete().eq('id', albumId);
  if (error) throw new Error(error.message || 'Không thể xóa album.');

  try {
    await removeStorageImages('portfolio', paths);
    return {};
  } catch (cleanupError) {
    console.error('[album-cleanup] Database row was deleted but Storage cleanup failed.', cleanupError);
    return { cleanupWarning: 'Album đã xóa, nhưng một số file Storage chưa dọn được. Lỗi đã được ghi nhận.' };
  }
}
