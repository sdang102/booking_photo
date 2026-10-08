import { createClient } from '@/lib/supabase/client';
import type { BookingStatus } from '@/types';
import { TABLE_NAME } from './bookingShared';
import type { BookingQueryOptions } from './bookingReadService';

export interface BookingRevenueSummary {
  total: number;
  realized: number;
  expected: number;
  atVenue: number;
  activeCount: number;
}

export interface BookingRevenueFilters {
  status?: BookingStatus | 'all';
  fromDate?: string;
  toDate?: string;
}

export interface BookingFinancialRecord {
  id: string;
  booking_date: string;
  service_title: string;
  total_price: number;
  payment_status?: string;
  status: BookingStatus;
}

export async function getBookingFinancialRecords({ limit = 50, offset = 0, statuses, fromDate, toDate }: BookingQueryOptions = {}): Promise<BookingFinancialRecord[]> {
  let query = createClient()
    .from(TABLE_NAME)
    .select('id,shoot_date,service_name_snapshot,total_price,payment_status,status')
    .order('shoot_date', { ascending: false });
  if (statuses?.length) query = query.in('status', statuses);
  if (fromDate) query = query.gte('shoot_date', fromDate);
  if (toDate) query = query.lte('shoot_date', toDate);
  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) throw new Error('Không thể tải danh sách doanh thu.');
  return data.map((row) => ({
    id: String(row.id),
    booking_date: String(row.shoot_date),
    service_title: String(row.service_name_snapshot),
    total_price: Number(row.total_price),
    payment_status: String(row.payment_status),
    status: row.status as BookingStatus,
  }));
}

export async function getBookingRevenueSummary(filters: BookingRevenueFilters = {}): Promise<BookingRevenueSummary> {
  const { data, error } = await createClient().rpc('get_admin_booking_revenue_summary', {
    target_status: filters.status && filters.status !== 'all' ? filters.status : null,
    target_from: filters.fromDate ?? null,
    target_to: filters.toDate ?? null,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) throw new Error('Không thể tải tổng hợp doanh thu.');
  return {
    total: Number(row.total_active ?? 0),
    realized: Number(row.realized ?? 0),
    expected: Number(row.expected ?? 0),
    atVenue: Number(row.at_venue ?? 0),
    activeCount: Number(row.active_count ?? 0),
  };
}

export async function getActiveUnassignedBookingCount(): Promise<number> {
  const { count, error } = await createClient()
    .from(TABLE_NAME)
    .select('id', { count: 'exact', head: true })
    .is('photographer_id', null)
    .in('status', ['pending', 'confirmed', 'checked_in', 'shooting']);
  if (error) throw new Error('Không thể kiểm tra booking chưa được gán thợ chụp.');
  return count ?? 0;
}
