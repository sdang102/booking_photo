import { createClient } from '@/lib/supabase/client';
import { adminErrorMessage, reportError, userErrorMessage } from '@/lib/reportError';
import type { BookingPhotoRecord, BookingStatus, PublicScheduleItem } from '@/types';
import { ACTIVE_BOOKING_STATUSES, BOOKING_SELECT, mapBookingRow, TABLE_NAME } from './bookingShared';

interface BookingQueryOptions {
  fromDate?: string;
  toDate?: string;
  statuses?: BookingStatus[];
  limit?: number;
  offset?: number;
}

export async function getReliableAllBookings({ fromDate, toDate, statuses, limit = 200, offset = 0 }: BookingQueryOptions = {}): Promise<BookingPhotoRecord[]> {
  try {
    let query = createClient().from(TABLE_NAME).select(BOOKING_SELECT).order('shoot_date', { ascending: false }).order('start_time', { ascending: false }).range(offset, offset + limit - 1);
    if (fromDate) query = query.gte('shoot_date', fromDate);
    if (toDate) query = query.lte('shoot_date', toDate);
    if (statuses?.length) query = query.in('status', statuses);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapBookingRow);
  } catch (error) {
    reportError(error, { area: 'booking', operation: 'read-all' });
    throw new Error(adminErrorMessage(error, 'Không thể tải danh sách booking.'));
  }
}

export async function getReliableUserBookings(userId?: string, email?: string, { activeOnly = false, limit = 50 }: { activeOnly?: boolean; limit?: number } = {}): Promise<BookingPhotoRecord[]> {
  try {
    const supabase = createClient();
    let query = supabase.from(TABLE_NAME).select(BOOKING_SELECT).order('created_at', { ascending: false }).limit(limit);
    if (userId) query = query.eq('user_id', userId);
    else if (email) query = query.eq('customer_email', email);
    if (activeOnly) query = query.in('status', ACTIVE_BOOKING_STATUSES);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.length || !userId || !email) return (data ?? []).map(mapBookingRow);

    let emailQuery = supabase.from(TABLE_NAME).select(BOOKING_SELECT).eq('customer_email', email).order('created_at', { ascending: false }).limit(limit);
    if (activeOnly) emailQuery = emailQuery.in('status', ACTIVE_BOOKING_STATUSES);
    const { data: emailData, error: emailError } = await emailQuery;
    if (emailError) throw emailError;
    return (emailData ?? []).map(mapBookingRow);
  } catch (error) {
    reportError(error, { area: 'booking', operation: 'read-user' });
    throw new Error(userErrorMessage(error, 'Không thể tải lịch chụp của bạn.'));
  }
}

export async function getReliablePublicSchedule(): Promise<PublicScheduleItem[]> {
  try {
    const { data, error } = await createClient().rpc('get_public_booking_schedule');
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      booking_date: String(row.booking_date),
      booking_time: String(row.booking_time),
      service_title: String(row.service_title),
      status: row.status as BookingStatus,
      location_type: (row.location_type === 'outdoor' ? 'outdoor' : 'studio') as 'studio' | 'outdoor',
    }));
  } catch (error) {
    reportError(error, { area: 'booking', operation: 'read-public-schedule' });
    throw new Error(userErrorMessage(error, 'Không thể tải lịch trống.'));
  }
}
