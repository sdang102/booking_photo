import { createClient } from '@/lib/supabase/client';

const MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.84;

export interface ProcessedImageVariant {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface PreparedImage {
  full: ProcessedImageVariant;
  thumbnail?: ProcessedImageVariant;
}

export interface UploadedImage {
  url: string;
  path: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: 'image/webp';
  thumbnailUrl?: string;
  thumbnailPath?: string;
}

interface PrepareOptions {
  maxDimension?: number;
  thumbnailDimension?: number;
  quality?: number;
}

interface UploadOptions extends PrepareOptions {
  bucket: string;
  folder: string;
}

export async function prepareImage(file: File, options: PrepareOptions = {}): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn đúng file ảnh.');
  if (file.size > MAX_SOURCE_SIZE) throw new Error('Ảnh gốc không được vượt quá 20MB.');

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const full = await renderWebp(image, options.maxDimension ?? DEFAULT_MAX_DIMENSION, options.quality ?? DEFAULT_QUALITY);
    const thumbnail = options.thumbnailDimension
      ? await renderWebp(image, options.thumbnailDimension, Math.min(options.quality ?? DEFAULT_QUALITY, 0.8))
      : undefined;
    return { full, thumbnail };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function uploadImageFile(file: File, options: UploadOptions): Promise<UploadedImage> {
  const prepared = await prepareImage(file, options);
  return uploadPreparedImage(prepared, file.name, options);
}

export async function uploadPreparedImage(
  prepared: PreparedImage,
  originalName: string,
  { bucket, folder }: Pick<UploadOptions, 'bucket' | 'folder'>,
): Promise<UploadedImage> {
  const supabase = createClient();
  const token = crypto.randomUUID();
  const baseName = safeFileName(originalName.replace(/\.[^.]+$/, ''));
  const fullPath = `${folder}/${token}-${baseName}.webp`;
  const thumbnailPath = prepared.thumbnail ? `${folder}/${token}-${baseName}-thumb.webp` : undefined;
  const uploadedPaths: string[] = [];

  try {
    const { error: fullError } = await supabase.storage.from(bucket).upload(fullPath, prepared.full.blob, {
      contentType: 'image/webp', cacheControl: '31536000', upsert: false,
    });
    if (fullError) throw fullError;
    uploadedPaths.push(fullPath);

    if (prepared.thumbnail && thumbnailPath) {
      const { error: thumbnailError } = await supabase.storage.from(bucket).upload(thumbnailPath, prepared.thumbnail.blob, {
        contentType: 'image/webp', cacheControl: '31536000', upsert: false,
      });
      if (thumbnailError) throw thumbnailError;
      uploadedPaths.push(thumbnailPath);
    }

    const url = supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
    const thumbnailUrl = thumbnailPath ? supabase.storage.from(bucket).getPublicUrl(thumbnailPath).data.publicUrl : undefined;
    return {
      url, path: fullPath,
      width: prepared.full.width, height: prepared.full.height,
      sizeBytes: prepared.full.sizeBytes, mimeType: 'image/webp',
      thumbnailUrl, thumbnailPath,
    };
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from(bucket).remove(uploadedPaths);
    throw new Error(storageErrorMessage(error, bucket));
  }
}

export async function removeStorageImages(bucket: string, paths: Array<string | null | undefined>) {
  const targets = paths.filter((path): path is string => Boolean(path));
  if (!targets.length) return;
  const { error } = await createClient().storage.from(bucket).remove(targets);
  if (error) throw new Error(storageErrorMessage(error, bucket));
}

function renderWebp(image: HTMLImageElement, maxDimension: number, quality: number) {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không thể xử lý ảnh này.');
  context.drawImage(image, 0, 0, width, height);
  return new Promise<ProcessedImageVariant>((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob) return reject(new Error('Không thể nén ảnh sang WebP.'));
    resolve({ blob, width, height, sizeBytes: blob.size });
  }, 'image/webp', quality));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('File ảnh không hợp lệ hoặc trình duyệt không thể đọc file.'));
    image.src = source;
  });
}

function safeFileName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image';
}

function storageErrorMessage(error: unknown, bucket: string) {
  const value = error && typeof error === 'object' ? error as { message?: string; code?: string; statusCode?: string | number } : {};
  if (value.code === 'NoSuchBucket' || Number(value.statusCode) === 404) return `Kho ảnh “${bucket}” chưa được cấu hình trên Supabase Storage.`;
  if (Number(value.statusCode) === 413 || /too large|maximum/i.test(value.message ?? '')) return 'Ảnh sau khi nén vẫn vượt quá giới hạn của kho lưu trữ.';
  if (Number(value.statusCode) === 403 || /policy|permission|not authorized/i.test(value.message ?? '')) {
    if (bucket === 'avatars' || bucket === 'review-media') return 'Không thể tải ảnh lên lúc này. Hãy đăng nhập lại rồi thử lại.';
    return 'Tài khoản không có quyền upload ảnh ở khu vực quản trị này.';
  }
  return value.message ? `Upload ảnh thất bại: ${value.message}` : 'Upload ảnh lên Supabase Storage thất bại. Vui lòng thử lại.';
}
