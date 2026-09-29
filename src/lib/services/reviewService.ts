import { createClient } from '@/lib/supabase/client';
import { MOCK_REVIEWS } from '@/lib/data/mockData';
import { getAllBookings } from './bookingService';
import type { ExperienceReview, ReviewSummary } from '@/types';

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

export async function getReviews(options: { publicOnly?: boolean; featuredFirst?: boolean; limit?: number } = {}): Promise<ExperienceReview[]> {
  let reviews: ExperienceReview[] = [];
  let databaseSucceeded = false;
  try {
    const supabase = createClient();
    let query = supabase.from('reviews').select('*, bookings(customer_name, service_name_snapshot), portfolio_albums(slug)').order('created_at', { ascending: false });
    if (options.publicOnly) query = query.eq('is_public', true);
    const { data, error } = await query;
    if (!error && data) { databaseSucceeded = true; reviews = data.map((row) => ({ id: row.id, booking_id: row.booking_id, user_id: row.user_id,
      customer_name: row.bookings?.customer_name ?? 'Khách hàng', rating: row.rating, comment: row.comment,
      service_title: row.bookings?.service_name_snapshot ?? '', portfolio_slug: row.portfolio_albums?.slug,
      is_public: row.is_public, is_featured: row.is_featured, created_at: row.created_at, updated_at: row.updated_at })) as ExperienceReview[]; }
  } catch { /* local fallback */ }
  if (!databaseSucceeded && isDevelopment) reviews = localReviews();
  if (options.publicOnly) reviews = reviews.filter((review) => review.is_public);
  reviews.sort((a, b) => options.featuredFirst && a.is_featured !== b.is_featured ? Number(b.is_featured) - Number(a.is_featured) : b.created_at.localeCompare(a.created_at));
  return options.limit ? reviews.slice(0, options.limit) : reviews;
}

export async function getPhotographerReviews(): Promise<ExperienceReview[]> {
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return[];
  const {data,error}=await supabase.from('reviews').select('*, bookings!inner(customer_name, service_name_snapshot, photographer_id), portfolio_albums(slug)').eq('bookings.photographer_id',user.id).order('created_at',{ascending:false});
  if(error||!data)return[];
  return data.map((row)=>({id:row.id,booking_id:row.booking_id,user_id:row.user_id,customer_name:row.bookings?.customer_name??'Khách hàng',rating:row.rating,comment:row.comment,service_title:row.bookings?.service_name_snapshot??'',portfolio_slug:row.portfolio_albums?.slug,is_public:row.is_public,is_featured:row.is_featured,created_at:row.created_at,updated_at:row.updated_at})) as ExperienceReview[];
}

export function reviewSummary(reviews: ExperienceReview[]): ReviewSummary {
  const valid = reviews.filter((review) => review.is_public && review.rating >= 1 && review.rating <= 5);
  return { averageRating: valid.length ? Math.round((valid.reduce((sum, review) => sum + review.rating, 0) / valid.length) * 10) / 10 : 0, totalReviews: valid.length };
}

export async function canReviewBooking(bookingId: string): Promise<{ allowed: boolean; reason?: string }> {
  const booking = (await getAllBookings()).find((item) => item.id === bookingId);
  if (!booking || booking.status !== 'completed') return { allowed: false, reason: 'Chỉ booking đã hoàn thành mới có thể đánh giá.' };
  if ((await getReviews()).some((review) => review.booking_id === bookingId)) return { allowed: false, reason: 'Booking này đã được đánh giá.' };
  return { allowed: true };
}

export async function createReview(input: { bookingId: string; userId?: string; customerName: string; serviceTitle: string; rating: number; comment: string }): Promise<{ success: boolean; review?: ExperienceReview; message?: string }> {
  const comment = input.comment.trim();
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { success: false, message: 'Vui lòng chọn từ 1 đến 5 sao.' };
  if (comment.length < 10 || comment.length > 800) return { success: false, message: 'Nội dung đánh giá cần từ 10 đến 800 ký tự.' };
  const permission = await canReviewBooking(input.bookingId);
  if (!permission.allowed) return { success: false, message: permission.reason };
  try {
    const { data, error } = await createClient().rpc('review_completed_booking', { target_booking: input.bookingId, target_rating: input.rating, target_comment: comment });
    if (!error && data) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('review-created'));
      return { success: true };
    }
  } catch { /* Development fallback below. */ }
  if (!isDevelopment) return { success: false, message: 'Không thể lưu đánh giá vào database.' };
  const now = new Date().toISOString(); const review: ExperienceReview = { id: `rv-${Date.now()}`, booking_id: input.bookingId, user_id: input.userId, customer_name: input.customerName, rating: input.rating, comment, service_title: input.serviceTitle, is_public: true, is_featured: false, created_at: now, updated_at: now };
  save([review, ...localReviews()]);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('review-created'));
  return { success: true, review };
}

export async function updateReviewModeration(id: string, patch: Partial<Pick<ExperienceReview, 'is_public' | 'is_featured' | 'portfolio_slug'>>): Promise<void> {
  const dbPatch = { is_public: patch.is_public, is_featured: patch.is_featured };
  const { error } = await createClient().from('reviews').update(dbPatch).eq('id', id);
  if (error && isDevelopment) save(localReviews().map((review) => review.id === id ? { ...review, ...patch, updated_at: new Date().toISOString() } : review));
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
