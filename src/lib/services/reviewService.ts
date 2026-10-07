import { createClient } from '@/lib/supabase/client';
import { MOCK_REVIEWS } from '@/lib/data/mockData';
import type { ExperienceReview, ReviewSummary } from '@/types';
import { prepareImage, uploadPreparedImage } from '@/lib/services/imageUploadService';

const STORAGE_KEY = 'photo_reviews_v1';
const isDevelopment = process.env.NODE_ENV !== 'production';

function localReviews(): ExperienceReview[] {
  if (typeof window === 'undefined') return MOCK_REVIEWS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_REVIEWS)); return MOCK_REVIEWS; }
    return JSON.parse(stored) as ExperienceReview[];
  } catch { return MOCK_REVIEWS; }
}
function save(reviews: ExperienceReview[]) { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)); }
function firstRelation<T>(value: T | T[] | null | undefined): T | undefined { return Array.isArray(value) ? value[0] : value ?? undefined; }

async function reviewMedia(reviewIds: string[]) {
  if (!reviewIds.length) return new Map<string, string[]>();
  try {
    const { data } = await createClient().from('review_images').select('review_id,image_url,display_order').in('review_id', reviewIds).order('display_order');
    const result = new Map<string, string[]>();
    (data ?? []).forEach((row) => { if (row.review_id && row.image_url) result.set(row.review_id, [...(result.get(row.review_id) ?? []), row.image_url]); });
    return result;
  } catch { return new Map<string, string[]>(); }
}

async function reviewAuthors(userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  try {
    const { data, error } = await createClient().rpc('get_public_review_authors', { target_ids: userIds });
    if (error) return new Map<string, string>();
    const result = new Map<string, string>();
    (data ?? []).forEach((row: { id: string; avatar_url: string | null }) => { if (row.id && row.avatar_url) result.set(row.id, row.avatar_url); });
    return result;
  } catch { return new Map<string, string>(); }
}

async function reviewLikeCounts(reviewIds: string[]) {
  if (!reviewIds.length) return new Map<string, number>();
  try {
    const { data, error } = await createClient().from('review_likes').select('review_id').in('review_id', reviewIds);
    if (error) return new Map<string, number>();
    const result = new Map<string, number>();
    (data ?? []).forEach((row) => result.set(row.review_id, (result.get(row.review_id) ?? 0) + 1));
    return result;
  } catch { return new Map<string, number>(); }
}

export async function getReviews(options: { publicOnly?: boolean; featuredFirst?: boolean; limit?: number } = {}): Promise<ExperienceReview[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('reviews')
      .select('id,booking_id,user_id,rating,comment,is_public,is_featured,created_at,updated_at,bookings(customer_name,service_name_snapshot),portfolio_albums(slug)');
    if (options.publicOnly) query = query.eq('is_public', true);
    if (options.featuredFirst) query = query.order('is_featured', { ascending: false });
    query = query.order('created_at', { ascending: false });
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (!error && data) {
      const reviewIds = data.map((row) => row.id);
      const [media, authors, likes] = await Promise.all([
        reviewMedia(reviewIds),
        reviewAuthors(data.map((row) => row.user_id).filter((id): id is string => Boolean(id))),
        reviewLikeCounts(reviewIds),
      ]);
      return data.map((row) => {
      const booking = firstRelation(row.bookings);
      const album = firstRelation(row.portfolio_albums);
      return { id: row.id, booking_id: row.booking_id, user_id: row.user_id,
        customer_name: booking?.customer_name ?? 'Khách hàng', rating: row.rating, comment: row.comment,
        service_title: booking?.service_name_snapshot ?? '', portfolio_slug: album?.slug,
        avatar_url: row.user_id ? authors.get(row.user_id) : undefined,
        photos: media.get(row.id) ?? [], likes: likes.get(row.id) ?? 0,
        is_public: row.is_public, is_featured: row.is_featured, created_at: row.created_at, updated_at: row.updated_at };
      }) as ExperienceReview[];
    }
  } catch { /* local fallback */ }
  if (!isDevelopment) return [];
  let reviews = localReviews();
  if (options.publicOnly) reviews = reviews.filter((review) => review.is_public);
  reviews.sort((a, b) => options.featuredFirst && a.is_featured !== b.is_featured ? Number(b.is_featured) - Number(a.is_featured) : b.created_at.localeCompare(a.created_at));
  return options.limit ? reviews.slice(0, options.limit) : reviews;
}

export async function getPhotographerReviews(): Promise<ExperienceReview[]> {
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return[];
  const {data,error}=await supabase.from('reviews').select('id,booking_id,user_id,rating,comment,is_public,is_featured,created_at,updated_at,bookings!inner(customer_name,service_name_snapshot,photographer_id),portfolio_albums(slug)').eq('bookings.photographer_id',user.id).order('created_at',{ascending:false}).limit(100);
  if(error||!data)return[];
  return data.map((row)=>{const booking=firstRelation(row.bookings);const album=firstRelation(row.portfolio_albums);return{id:row.id,booking_id:row.booking_id,user_id:row.user_id,customer_name:booking?.customer_name??'Khách hàng',rating:row.rating,comment:row.comment,service_title:booking?.service_name_snapshot??'',portfolio_slug:album?.slug,is_public:row.is_public,is_featured:row.is_featured,created_at:row.created_at,updated_at:row.updated_at}}) as ExperienceReview[];
}

export function reviewSummary(reviews: ExperienceReview[]): ReviewSummary {
  const valid = reviews.filter((review) => review.is_public && review.rating >= 1 && review.rating <= 5);
  return { averageRating: valid.length ? Math.round((valid.reduce((sum, review) => sum + review.rating, 0) / valid.length) * 10) / 10 : 0, totalReviews: valid.length };
}

export async function canReviewBooking(bookingId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createClient();
  const [{ data: booking }, { data: review }] = await Promise.all([
    supabase.from('bookings').select('id,status').eq('id', bookingId).maybeSingle(),
    supabase.from('reviews').select('id').eq('booking_id', bookingId).maybeSingle(),
  ]);
  if (!booking || booking.status !== 'completed') return { allowed: false, reason: 'Chỉ booking đã hoàn thành mới có thể đánh giá.' };
  if (review) return { allowed: false, reason: 'Booking này đã được đánh giá.' };
  return { allowed: true };
}

export async function createReview(input: { bookingId: string; userId?: string; customerName: string; serviceTitle: string; rating: number; comment: string; photos?: File[] }): Promise<{ success: boolean; review?: ExperienceReview; message?: string }> {
  const comment = input.comment.trim();
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { success: false, message: 'Vui lòng chọn từ 1 đến 5 sao.' };
  if (comment.length < 10 || comment.length > 800) return { success: false, message: 'Nội dung đánh giá cần từ 10 đến 800 ký tự.' };
  if ((input.photos?.length ?? 0) < 1 || (input.photos?.length ?? 0) > 5) return { success: false, message: 'Vui lòng chọn từ 1 đến 5 ảnh cho đánh giá.' };
  try {
    const { data, error } = await createClient().rpc('review_completed_booking', { target_booking: input.bookingId, target_rating: input.rating, target_comment: comment });
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      const reviewId = typeof row === 'object' && row && 'id' in row ? String((row as { id: string }).id) : undefined;
      if (reviewId && input.photos?.length) await uploadReviewPhotos(reviewId, input.photos, input.userId);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('review-created'));
      return { success: true, review: reviewId ? { id: reviewId, booking_id: input.bookingId, user_id: input.userId, customer_name: input.customerName, rating: input.rating, comment, service_title: input.serviceTitle, photos: [], likes: 0, is_public: true, is_featured: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } : undefined };
    }
    if (error?.code === '23505') return { success:false, message:'Booking này đã được đánh giá.' };
    if (error && /not reviewable|completed|booking/i.test(error.message)) return { success:false, message:'Chỉ booking đã hoàn thành của bạn mới có thể đánh giá.' };
  } catch { /* Development fallback below. */ }
  if (!isDevelopment) return { success: false, message: 'Không thể lưu đánh giá vào database.' };
  const permission = await canReviewBooking(input.bookingId);
  if (!permission.allowed) return { success: false, message: permission.reason };
  const now = new Date().toISOString(); const review: ExperienceReview = { id: `rv-${Date.now()}`, booking_id: input.bookingId, user_id: input.userId, customer_name: input.customerName, rating: input.rating, comment, service_title: input.serviceTitle, photos: [], likes: 0, is_public: true, is_featured: false, created_at: now, updated_at: now };
  save([review, ...localReviews()]);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('review-created'));
  return { success: true, review };
}

export async function getUserReviewLikes(reviewIds: string[]): Promise<string[]> {
  if (!reviewIds.length) return [];
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return [];
    const { data, error } = await createClient().rpc('get_my_review_likes', { target_review_ids: reviewIds });
    if (error) return [];
    return (data ?? []).map((id: string) => String(id));
  } catch { return []; }
}

export async function toggleReviewLike(reviewId: string): Promise<{ success: boolean; liked: boolean; likeCount: number; message?: string }> {
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return { success: false, liked: false, likeCount: 0, message: 'Vui lòng đăng nhập để thích đánh giá.' };
    const { data, error } = await createClient().rpc('toggle_review_like', { target_review: reviewId });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return { success: false, liked: false, likeCount: 0, message: error?.message };
    return { success: true, liked: Boolean(row.liked), likeCount: Number(row.like_count ?? 0) };
  } catch (error) {
    return { success: false, liked: false, likeCount: 0, message: error instanceof Error ? error.message : undefined };
  }
}

async function uploadReviewPhotos(reviewId: string, files: File[], userId?: string) {
  if (!userId || !files.length) return;
  const supabase = createClient();
  const uploaded: Array<{ url: string; path: string }> = [];
  try {
    for (const [index, file] of files.slice(0, 5).entries()) {
      const prepared = await prepareImage(file, { maxDimension: 1800, quality: 0.84 });
      const image = await uploadPreparedImage(prepared, file.name, { bucket: 'review-media', folder: userId });
      uploaded.push({ url: image.url, path: image.path });
      const { error } = await supabase.from('review_images').insert({ review_id: reviewId, user_id: userId, image_url: image.url, storage_path: image.path, display_order: index });
      if (error) throw error;
    }
  } catch {
    // The review itself remains valid when the optional media migration is not deployed yet.
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
        if (!isDevelopment) throw new Error('Không tìm thấy bộ ảnh để liên kết.');
      } else dbPatch.portfolio_album_id = album.id;
    }
  }
  const { error } = await supabase.from('reviews').update(dbPatch).eq('id', id);
  if (error && isDevelopment) save(localReviews().map((review) => review.id === id ? { ...review, ...patch, updated_at: new Date().toISOString() } : review));
  else if (error) throw new Error(error.message);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await createClient().from('reviews').delete().eq('id', id);
  if (!error) return;
  if (isDevelopment) {
    save(localReviews().filter((review) => review.id !== id));
    return;
  }
  throw new Error(error.message);
}
