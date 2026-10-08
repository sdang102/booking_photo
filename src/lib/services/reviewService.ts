import { createClient } from '@/lib/supabase/client';
import type { ExperienceReview, ReviewSummary } from '@/types';
import { prepareImage, removeStorageImages, uploadPreparedImage, type UploadedImage } from '@/lib/services/imageUploadService';
import { adminErrorMessage, reportError, userErrorMessage } from '@/lib/reportError';

const STORAGE_KEY = 'photo_reviews_v1';
const isDevelopment = process.env.NODE_ENV !== 'production';

function localReviews(): ExperienceReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { localStorage.setItem(STORAGE_KEY, '[]'); return []; }
    return JSON.parse(stored) as ExperienceReview[];
  } catch (error) {
    reportError(error, { area: 'review', operation: 'read-local-fallback' });
    return [];
  }
}
function save(reviews: ExperienceReview[]) { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)); }
function firstRelation<T>(value: T | T[] | null | undefined): T | undefined { return Array.isArray(value) ? value[0] : value ?? undefined; }

async function reviewMedia(reviewIds: string[]) {
  if (!reviewIds.length) return new Map<string, { thumbnails: string[]; full: string[] }>();
  try {
    const client = createClient();
    let { data, error } = await client.from('review_images').select('review_id,image_url,thumb_url,display_order').in('review_id', reviewIds).order('display_order');
    if (error) {
      const legacy = await client.from('review_images').select('review_id,image_url,display_order').in('review_id', reviewIds).order('display_order');
      data = legacy.data?.map((row) => ({ ...row, thumb_url: null })) ?? null;
      error = legacy.error;
    }
    if (error) {
      reportError(error, { area: 'review', operation: 'read-media' });
      return new Map<string, { thumbnails: string[]; full: string[] }>();
    }
    const result = new Map<string, { thumbnails: string[]; full: string[] }>();
    (data ?? []).forEach((row) => {
      if (!row.review_id || !row.image_url) return;
      const current = result.get(row.review_id) ?? { thumbnails: [], full: [] };
      current.thumbnails.push(row.thumb_url || row.image_url);
      current.full.push(row.image_url);
      result.set(row.review_id, current);
    });
    return result;
  } catch (error) {
    reportError(error, { area: 'review', operation: 'read-media' });
    return new Map<string, { thumbnails: string[]; full: string[] }>();
  }
}

async function reviewAuthors(userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  try {
    const { data, error } = await createClient().rpc('get_public_review_authors', { target_ids: userIds });
    if (error) {
      reportError(error, { area: 'review', operation: 'read-authors' });
      return new Map<string, string>();
    }
    const result = new Map<string, string>();
    (data ?? []).forEach((row: { id: string; avatar_url: string | null }) => { if (row.id && row.avatar_url) result.set(row.id, row.avatar_url); });
    return result;
  } catch (error) {
    reportError(error, { area: 'review', operation: 'read-authors' });
    return new Map<string, string>();
  }
}

export async function getReviews(options: { publicOnly?: boolean; featuredFirst?: boolean; limit?: number; offset?: number; bookingIds?: string[] } = {}): Promise<ExperienceReview[]> {
  let failure: unknown;
  try {
    const supabase = createClient();
    let query = supabase.from('reviews')
      .select('id,booking_id,user_id,rating,comment,is_public,is_featured,created_at,updated_at,bookings(customer_name,service_name_snapshot),portfolio_albums(slug)');
    if (options.publicOnly) query = query.eq('is_public', true);
    if (options.bookingIds?.length) query = query.in('booking_id', options.bookingIds);
    if (options.featuredFirst) query = query.order('is_featured', { ascending: false });
    query = query.order('created_at', { ascending: false });
    if (options.limit) query = query.range(Math.max(0, options.offset ?? 0), Math.max(0, (options.offset ?? 0) + options.limit - 1));
    const { data, error } = await query;
    if (!error && data) {
      const reviewIds = data.map((row) => row.id);
      const [media, authors] = await Promise.all([
        reviewMedia(reviewIds),
        reviewAuthors(data.map((row) => row.user_id).filter((id): id is string => Boolean(id))),
      ]);
      return data.map((row) => {
      const booking = firstRelation(row.bookings);
      const album = firstRelation(row.portfolio_albums);
      return { id: row.id, booking_id: row.booking_id, user_id: row.user_id,
        customer_name: booking?.customer_name ?? 'Khách hàng', rating: row.rating, comment: row.comment,
        service_title: booking?.service_name_snapshot ?? '', portfolio_slug: album?.slug,
        avatar_url: row.user_id ? authors.get(row.user_id) : undefined,
        photos: media.get(row.id)?.thumbnails ?? [], photo_urls: media.get(row.id)?.full ?? [],
        is_public: row.is_public, is_featured: row.is_featured, created_at: row.created_at, updated_at: row.updated_at };
      }) as ExperienceReview[];
    }
    failure = error;
  } catch (error) { failure = error; }
  reportError(failure, { area: 'review', operation: 'read-list' });
  if (!isDevelopment) {
    throw new Error(userErrorMessage(failure, 'Không thể tải danh sách đánh giá.'));
  }
  let reviews = localReviews();
  if (options.publicOnly) reviews = reviews.filter((review) => review.is_public);
  reviews.sort((a, b) => options.featuredFirst && a.is_featured !== b.is_featured ? Number(b.is_featured) - Number(a.is_featured) : b.created_at.localeCompare(a.created_at));
  if (options.bookingIds?.length) reviews = reviews.filter((review) => options.bookingIds?.includes(review.booking_id));
  return options.limit ? reviews.slice(options.offset ?? 0, (options.offset ?? 0) + options.limit) : reviews;
}

export async function getPhotographerReviews(options: { limit?: number; offset?: number } = {}): Promise<ExperienceReview[]> {
  const supabase=createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError){reportError(authError,{area:'review',operation:'authenticate-photographer'});throw new Error('Không thể xác thực tài khoản thợ chụp.');}
  if(!user)throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const {data,error}=await supabase.from('reviews').select('id,booking_id,user_id,rating,comment,is_public,is_featured,created_at,updated_at,bookings!inner(customer_name,service_name_snapshot,photographer_id),portfolio_albums(slug)').eq('bookings.photographer_id',user.id).order('created_at',{ascending:false}).range(offset,offset+limit-1);
  if(error){
    reportError(error,{area:'review',operation:'read-photographer'});
    throw new Error(adminErrorMessage(error,'Không thể tải đánh giá của thợ chụp.'));
  }
  if(!data)return[];
  return data.map((row)=>{const booking=firstRelation(row.bookings);const album=firstRelation(row.portfolio_albums);return{id:row.id,booking_id:row.booking_id,user_id:row.user_id,customer_name:booking?.customer_name??'Khách hàng',rating:row.rating,comment:row.comment,service_title:booking?.service_name_snapshot??'',portfolio_slug:album?.slug,is_public:row.is_public,is_featured:row.is_featured,created_at:row.created_at,updated_at:row.updated_at}}) as ExperienceReview[];
}

export function reviewSummary(reviews: ExperienceReview[]): ReviewSummary {
  const valid = reviews.filter((review) => review.is_public && review.rating >= 1 && review.rating <= 5);
  return { averageRating: valid.length ? Math.round((valid.reduce((sum, review) => sum + review.rating, 0) / valid.length) * 10) / 10 : 0, totalReviews: valid.length };
}

export async function createReview(input: { bookingId: string; userId?: string; customerName: string; serviceTitle: string; rating: number; comment: string; photos?: File[] }): Promise<{ success: boolean; review?: ExperienceReview; message?: string }> {
  const comment = input.comment.trim();
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { success: false, message: 'Vui lòng chọn từ 1 đến 5 sao.' };
  if (comment.length < 10 || comment.length > 800) return { success: false, message: 'Nội dung đánh giá cần từ 10 đến 800 ký tự.' };
  if ((input.photos?.length ?? 0) > 5) return { success: false, message: 'Bạn chỉ có thể tải tối đa 5 ảnh cho đánh giá.' };
  try {
    const uploaded = await uploadReviewPhotos(input.photos ?? [], input.userId);
    const { data, error } = await createClient().rpc('create_review_with_images', {
      target_booking: input.bookingId,
      target_rating: input.rating,
      target_comment: comment,
      target_images: uploaded.map((image, index) => ({
        image_url: image.url,
        storage_path: image.path,
        thumb_url: image.thumbnailUrl ?? '',
        thumb_path: image.thumbnailPath ?? '',
        display_order: index,
      })),
    });
    if (error) {
      reportError(error, { area: 'review', operation: 'create' });
      await cleanupUploadedReviewPhotos(uploaded, 'Không thể lưu đánh giá.');
      throw error;
    }
    if (data) {
      const row = Array.isArray(data) ? data[0] : data;
      const reviewId = typeof row === 'object' && row && 'id' in row ? String((row as { id: string }).id) : undefined;
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('review-created'));
      return { success: true, review: reviewId ? { id: reviewId, booking_id: input.bookingId, user_id: input.userId, customer_name: input.customerName, rating: input.rating, comment, service_title: input.serviceTitle, photos: uploaded.map((image) => image.thumbnailUrl ?? image.url), photo_urls: uploaded.map((image) => image.url), is_public: true, is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } : undefined };
    }
    await cleanupUploadedReviewPhotos(uploaded, 'Database không trả về đánh giá mới');
    throw new Error('Database không trả về đánh giá mới');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lưu đánh giá vào database.';
    if (/not reviewable|completed|booking/i.test(message)) return { success: false, message: 'Chỉ booking đã hoàn thành của bạn mới có thể đánh giá.' };
    reportError(error, { area: 'review', operation: 'create' });
    return { success: false, message: userErrorMessage(error, 'Không thể gửi đánh giá. Vui lòng thử lại.') };
  }
}

async function uploadReviewPhotos(files: File[], userId?: string): Promise<UploadedImage[]> {
  if (!userId) throw new Error('Vui lòng đăng nhập để gửi đánh giá.');
  if (!files.length) return [];
  const selected = files.slice(0, 5);
  const uploaded: Array<UploadedImage | undefined> = [];
  const errors: unknown[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < selected.length) {
      const index = cursor++;
      try {
        const prepared = await prepareImage(selected[index], { maxDimension: 1800, thumbnailDimension: 640, quality: 0.84 });
        uploaded[index] = await uploadPreparedImage(prepared, selected[index].name, { bucket: 'review-media', folder: userId });
      } catch (error) {
        reportError(error, { area: 'review', operation: 'upload-image' });
        errors.push(error);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, selected.length) }, () => worker()));
  const completed = uploaded.filter((image): image is UploadedImage => Boolean(image));
  if (errors.length || completed.length !== selected.length) {
    await cleanupUploadedReviewPhotos(completed, errors[0] instanceof Error ? errors[0].message : 'Không thể tải đủ ảnh đánh giá.');
    throw new Error(errors[0] instanceof Error ? errors[0].message : 'Không thể tải đủ ảnh đánh giá.');
  }
  return completed;
}

async function cleanupUploadedReviewPhotos(images: UploadedImage[], reason: string) {
  try {
    await removeStorageImages('review-media', images.flatMap((image) => [image.path, image.thumbnailPath]));
  } catch (cleanupError) {
    reportError(cleanupError, { area: 'review', operation: 'cleanup-upload' });
    throw new Error(`${reason} Không thể dọn các file đã tải lên; lỗi đã được ghi nhận.`);
  }
}

export async function updateReviewModeration(id: string, patch: Partial<Pick<ExperienceReview, 'is_public' | 'is_featured' | 'portfolio_slug'>>): Promise<void> {
  const supabase = createClient();
  const dbPatch: { is_public?: boolean; is_featured?: boolean; portfolio_album_id?: string | null } = {};
  if (patch.is_public !== undefined) dbPatch.is_public = patch.is_public;
  if (patch.is_featured !== undefined) dbPatch.is_featured = patch.is_featured;
  if ('portfolio_slug' in patch) {
    if (!patch.portfolio_slug) dbPatch.portfolio_album_id = null;
    else {
      const { data: album, error: albumError } = await supabase.from('portfolio_albums').select('id').eq('slug', patch.portfolio_slug).maybeSingle();
      if (albumError || !album) {
        if (albumError) reportError(albumError, { area: 'review', operation: 'find-linked-album' });
        if (!isDevelopment) throw new Error('Không tìm thấy bộ ảnh để liên kết.');
      } else dbPatch.portfolio_album_id = album.id;
    }
  }
  const { error } = await supabase.from('reviews').update(dbPatch).eq('id', id);
  if (error && isDevelopment) {
    reportError(error, { area: 'review', operation: 'moderate' });
    save(localReviews().map((review) => review.id === id ? { ...review, ...patch, updated_at: new Date().toISOString() } : review));
  }
  else if (error) {
    reportError(error, { area: 'review', operation: 'moderate' });
    throw new Error(adminErrorMessage(error, 'Không thể cập nhật đánh giá.'));
  }
}

export async function deleteReview(id: string): Promise<{ cleanupWarning?: string }> {
  const supabase = createClient();
  const { data: images, error: manifestError } = await supabase
    .from('review_images')
    .select('storage_path,thumb_path')
    .eq('review_id', id);
  if (manifestError) {
    reportError(manifestError, { area: 'review', operation: 'read-delete-manifest' });
    throw new Error(adminErrorMessage(manifestError, 'Không thể đọc danh sách file của đánh giá trước khi xóa.'));
  }

  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (!error) {
    try {
      await removeStorageImages('review-media', (images ?? []).flatMap((image) => [image.storage_path, image.thumb_path]));
      return {};
    } catch (cleanupError) {
      reportError(cleanupError, { area: 'review', operation: 'delete-storage' });
      return { cleanupWarning: 'Đã xóa đánh giá, nhưng một số file Storage chưa dọn được. Lỗi đã được ghi nhận.' };
    }
  }
  if (isDevelopment) {
    reportError(error, { area: 'review', operation: 'delete-row' });
    save(localReviews().filter((review) => review.id !== id));
    return {};
  }
  reportError(error, { area: 'review', operation: 'delete-row' });
  throw new Error(adminErrorMessage(error, 'Không thể xóa đánh giá.'));
}
