import { createClient } from '@/lib/supabase/client';
import type { BookingStatus } from '@/types';
import { BOOKING_SELECT, TABLE_NAME } from './bookingShared';
import type { BookingQueryOptions } from './bookingReadService';

export interface BookingRevenueSummary {
  total: number;
  realized: number;
  atVenue: number;
  activeCount: number;
}

export interface BookingFinancialRecord {
  id: string;
  booking_date: string;
  service_title: string;
  total_price: number;
  payment_status?: string;
  status: BookingStatus;
}

export async function getBookingFinancialRecords({ limit = 50, offset = 0 }: Pick<BookingQueryOptions, 'limit' | 'offset'> = {}): Promise<BookingFinancialRecord[]> {
  const { data, error } = await createClient()
    .from(TABLE_NAME)
    .select('id,shoot_date,service_name_snapshot,total_price,payment_status,status')
    .neq('status', 'cancelled')
    .order('shoot_date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    booking_date: String(row.shoot_date),
    service_title: String(row.service_name_snapshot),
    total_price: Number(row.total_price),
    payment_status: String(row.payment_status),
    status: row.status as BookingStatus,
  }));
}

export async function getBookingRevenueSummary(): Promise<BookingRevenueSummary> {
  const { data, error } = await createClient().rpc('get_admin_booking_revenue_summary');
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row) {
    const value = row as Record<string, unknown>;
    return {
      total: Number(value.total_active ?? 0),
      realized: Number(value.realized ?? 0),
      atVenue: Number(value.at_venue ?? 0),
      activeCount: Number(value.active_count ?? 0),
    };
  }
  throw new Error(error?.message || 'Không thể tải tổng hợp doanh thu từ database. Hãy kiểm tra RPC quản trị.');
}

export { BOOKING_SELECT };
