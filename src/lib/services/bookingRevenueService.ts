import { createClient } from '@/lib/supabase/client';
import type { BookingStatus } from '@/types';
import { BOOKING_SELECT, TABLE_NAME } from './bookingShared';
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
  let query = createClient()
    .from(TABLE_NAME)
    .select('total_price,status,shoot_date');
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.fromDate) query = query.gte('shoot_date', filters.fromDate);
  if (filters.toDate) query = query.lte('shoot_date', filters.toDate);
  const { data, error } = await query;
  if (error || !data) throw new Error('Không thể tải tổng hợp doanh thu.');

  const rows = data as Array<{ total_price: number | string | null; status: BookingStatus }>;
  const amount = (status?: BookingStatus) => rows
    .filter((row) => row.status !== 'cancelled' && (!status || row.status === status))
    .reduce((sum, row) => sum + Number(row.total_price ?? 0), 0);
  return {
    total: amount(),
    realized: amount('completed'),
    expected: amount('confirmed'),
    atVenue: rows.filter((row) => !['cancelled', 'completed'].includes(row.status)).reduce((sum, row) => sum + Number(row.total_price ?? 0), 0),
    activeCount: rows.filter((row) => !['cancelled', 'completed'].includes(row.status)).length,
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

export { BOOKING_SELECT };
