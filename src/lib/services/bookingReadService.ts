import { createClient } from '@/lib/supabase/client';
import { MOCK_SERVICES } from '@/lib/data/mockData';
import type { BookingPhotoRecord, BookingStatus, PublicScheduleItem, Service } from '@/types';
import { devWarn } from '@/lib/devLogger';
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_SELECT,
  getLocalBookings,
  isDevelopment,
  mapBookingRow,
  TABLE_NAME,
} from './bookingShared';

export interface BookingQueryOptions {
  fromDate?: string;
  toDate?: string;
  statuses?: BookingStatus[];
  limit?: number;
  offset?: number;
}

export async function getServices(): Promise<Service[]> {
  try {
    const { data, error } = await createClient()
      .from('services')
      .select('id,name,slug,description,short_description,price,duration_minutes,features,cover_image,is_featured,edited_photo_count,concept_count,location_count,categories(slug)')
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const category = Array.isArray(row.categories) ? row.categories[0] : row.categories as { slug?: string } | null;
        return {
          id: row.id, title: row.name, slug: row.slug,
          category: category?.slug ?? 'portrait',
          description: row.description ?? row.short_description ?? '', price: Number(row.price),
          duration_minutes: row.duration_minutes, features: Array.isArray(row.features) ? row.features : [],
          image_url: row.cover_image ?? '', is_popular: row.is_featured,
          edited_photos: row.edited_photo_count, concept_count: row.concept_count,
          location_count: row.location_count ? String(row.location_count) : undefined,
        };
      }) as Service[];
    }
  } catch (err) {
    devWarn('Using mock services due to Supabase connection:', err);
  }
  return isDevelopment ? MOCK_SERVICES : [];
}

export async function getAllBookings({ fromDate, toDate, statuses, limit = 200, offset = 0 }: BookingQueryOptions = {}): Promise<BookingPhotoRecord[]> {
  try {
    let query = createClient()
      .from(TABLE_NAME)
      .select(BOOKING_SELECT)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fromDate) query = query.gte('shoot_date', fromDate);
    if (toDate) query = query.lte('shoot_date', toDate);
    if (statuses?.length) query = query.in('status', statuses);
    const { data, error } = await query;
    if (!error && data) return data.map(mapBookingRow);
  } catch (err) {
    devWarn('Error fetching all bookings from Supabase:', err);
  }
  return isDevelopment ? getLocalBookings() : [];
}

export async function getUserBookings(
  userId?: string,
  email?: string,
  { activeOnly = false, limit = 50 }: { activeOnly?: boolean; limit?: number } = {},
): Promise<BookingPhotoRecord[]> {
  try {
    const supabase = createClient();
    let query = supabase.from(TABLE_NAME).select(BOOKING_SELECT).order('created_at', { ascending: false }).limit(limit);
    if (userId) query = query.eq('user_id', userId);
    else if (email) query = query.eq('customer_email', email);
    if (activeOnly) query = query.in('status', ACTIVE_BOOKING_STATUSES);

    const { data, error } = await query;
    if (!error && data?.length) return data.map(mapBookingRow);
    if (!error && userId && email) {
      let emailQuery = supabase.from(TABLE_NAME).select(BOOKING_SELECT).eq('customer_email', email).order('created_at', { ascending: false }).limit(limit);
      if (activeOnly) emailQuery = emailQuery.in('status', ACTIVE_BOOKING_STATUSES);
      const { data: emailData, error: emailError } = await emailQuery;
      if (!emailError && emailData) return emailData.map(mapBookingRow);
    }
  } catch (err) {
    devWarn('Error fetching user bookings from Supabase:', err);
  }

  if (!isDevelopment) return [];
  let locals = getLocalBookings();
  if (userId) locals = locals.filter((booking) => booking.user_id === userId || (email && booking.customer_email.toLowerCase() === email.toLowerCase()));
  else if (email) locals = locals.filter((booking) => booking.customer_email.toLowerCase() === email.toLowerCase());
  if (activeOnly) locals = locals.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  return locals.slice(0, limit);
}

export async function getActiveUserBookingCount(userId: string): Promise<number> {
  const { count, error } = await createClient()
    .from(TABLE_NAME)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ACTIVE_BOOKING_STATUSES);
  if (error) return 0;
  return count ?? 0;
}

export async function getPublicSchedule(): Promise<PublicScheduleItem[]> {
  try {
    const { data, error } = await createClient().rpc('get_public_booking_schedule');
    if (!error && data) return data.map((row: Record<string, unknown>) => ({
      id: String(row.id), booking_date: String(row.booking_date), booking_time: String(row.booking_time),
      service_title: String(row.service_title), status: row.status as BookingStatus,
      location_type: (row.location_type === 'outdoor' ? 'outdoor' : 'studio') as 'studio' | 'outdoor',
    }));
  } catch { /* Migration may not be applied yet. */ }
  return isDevelopment ? getLocalBookings().filter((b) => b.status !== 'cancelled').map((b) => ({ id: b.id, booking_date: b.booking_date, booking_time: b.booking_time, service_title: b.service_title, status: b.status, location_type: b.location_type })) : [];
}

export async function getBookingById(id: string) {
  const { data, error } = await createClient().from(TABLE_NAME).select(BOOKING_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapBookingRow(data);
}
