import { createClient } from '@/lib/supabase/client';
import type { BookingPhotoRecord, BookingStatus } from '@/types';
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

export async function getBookingById(id: string) {
  const { data, error } = await createClient().from(TABLE_NAME).select(BOOKING_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapBookingRow(data);
}
