'use client';

import { use, useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  getBookingFinancialRecords,
  getBookingRevenueSummary,
  type BookingFinancialRecord,
  type BookingRevenueFilters,
  type BookingRevenueSummary,
} from '@/lib/services/bookingService';
import type { BookingStatus } from '@/types';
import { formatVND } from '@/components/ServiceCard';

const PAGE_SIZE = 50;
const EMPTY_SUMMARY: BookingRevenueSummary = { total: 0, realized: 0, expected: 0, atVenue: 0, activeCount: 0 };
const AdminCrudPanel = dynamic(() => import('@/components/admin/AdminCrudPanel'), { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-2xl bg-sky-50" /> });
const titles: Record<string, string> = { homepage: 'Nội dung trang chủ', services: 'Gói chụp', addons: 'Dịch vụ bổ sung', categories: 'Bộ lọc bộ sưu tập', portfolio: 'Tác phẩm nổi bật', albums: 'Album ảnh', locations: 'Địa điểm', faq: 'FAQ', reviews: 'Đánh giá', revenue: 'Doanh thu', settings: 'Cài đặt' };
const statusLabels: Record<BookingStatus, string> = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', checked_in: 'Đã check-in', shooting: 'Đang chụp', completed: 'Hoàn tất', cancelled: 'Đã hủy' };
type RevenuePeriod = 'all' | 'day' | 'month' | 'year';

export default function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const [bookings, setBookings] = useState<BookingFinancialRecord[]>([]);
  const [summary, setSummary] = useState<BookingRevenueSummary>(EMPTY_SUMMARY);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<BookingStatus | 'all'>('all');
  const [period, setPeriod] = useState<RevenuePeriod>('all');
  const [dateValue, setDateValue] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(section === 'revenue');
  const [error, setError] = useState('');

  const filters = useMemo<BookingRevenueFilters>(() => {
    const range = getDateRange(period, dateValue);
    return { status, ...range };
  }, [dateValue, period, status]);

  useEffect(() => {
    if (section !== 'revenue') return;
    let active = true;
    const statuses = filters.status && filters.status !== 'all' ? [filters.status] : undefined;
    Promise.all([
      getBookingRevenueSummary(filters),
      getBookingFinancialRecords({ limit: PAGE_SIZE, statuses, fromDate: filters.fromDate, toDate: filters.toDate }),
    ]).then(([nextSummary, records]) => {
      if (!active) return;
      setSummary(nextSummary);
      setBookings(records);
      setHasMore(records.length === PAGE_SIZE);
    }).catch(() => { if (active) setError('Không thể tải báo cáo doanh thu. Vui lòng thử lại.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, retryKey, section]);

  const loadMore = async () => {
    const statuses = filters.status && filters.status !== 'all' ? [filters.status] : undefined;
    setError('');
    try {
      const records = await getBookingFinancialRecords({ limit: PAGE_SIZE, offset: bookings.length, statuses, fromDate: filters.fromDate, toDate: filters.toDate });
      setBookings((current) => [...current, ...records]);
      setHasMore(records.length === PAGE_SIZE);
    } catch { setError('Không thể tải thêm dữ liệu doanh thu. Vui lòng thử lại.'); }
  };

  const changeStatus = (value: BookingStatus | 'all') => { setLoading(true); setError(''); setStatus(value); };
  const changePeriod = (next: RevenuePeriod) => { setLoading(true); setError(''); setPeriod(next); setDateValue(next === 'day' ? new Date().toISOString().slice(0, 10) : next === 'month' ? new Date().toISOString().slice(0, 7) : next === 'year' ? new Date().getFullYear().toString() : ''); };
  const changeDate = (value: string) => { setLoading(true); setError(''); setDateValue(value); };
  return <><p className="section-kicker">Admin</p><h1 className="mt-2 text-3xl font-black">{titles[section] || 'Quản trị'}</h1>{error&&<div role="alert" className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800"><p>{error}</p><button type="button" onClick={()=>{setLoading(true);setError('');setRetryKey((value)=>value+1)}} className="mt-2 font-bold underline">Thử lại</button></div>}<div className="mt-7"><SectionContent section={section} bookings={bookings} summary={summary} hasMore={hasMore} loading={loading} status={status} period={period} dateValue={dateValue} onStatusChange={changeStatus} onPeriodChange={changePeriod} onDateChange={changeDate} onLoadMore={() => void loadMore()} /></div></>;
}

function SectionContent({ section, bookings, summary, hasMore, loading, status, period, dateValue, onStatusChange, onPeriodChange, onDateChange, onLoadMore }: { section: string; bookings: BookingFinancialRecord[]; summary: BookingRevenueSummary; hasMore: boolean; loading: boolean; status: BookingStatus | 'all'; period: RevenuePeriod; dateValue: string; onStatusChange: (value: BookingStatus | 'all') => void; onPeriodChange: (value: RevenuePeriod) => void; onDateChange: (value: string) => void; onLoadMore: () => void }) {
  if (['homepage', 'services', 'addons', 'categories', 'portfolio', 'albums', 'locations', 'faq', 'settings'].includes(section)) return <AdminCrudPanel section={section} />;
  if (section === 'reviews') return <Link href="/admin/reviews" className="sky-button inline-flex rounded-xl px-5 py-3">Mở quản lý đánh giá</Link>;
  if (section === 'revenue') return <RevenueContent bookings={bookings} summary={summary} hasMore={hasMore} loading={loading} status={status} period={period} dateValue={dateValue} onStatusChange={onStatusChange} onPeriodChange={onPeriodChange} onDateChange={onDateChange} onLoadMore={onLoadMore} />;
  return <div className="rounded-2xl border border-sky-200 bg-white p-6">Không tìm thấy mục quản trị.</div>;
}

function RevenueContent({ bookings, summary, hasMore, loading, status, period, dateValue, onStatusChange, onPeriodChange, onDateChange, onLoadMore }: { bookings: BookingFinancialRecord[]; summary: BookingRevenueSummary; hasMore: boolean; loading: boolean; status: BookingStatus | 'all'; period: RevenuePeriod; dateValue: string; onStatusChange: (value: BookingStatus | 'all') => void; onPeriodChange: (value: RevenuePeriod) => void; onDateChange: (value: string) => void; onLoadMore: () => void }) {
  const dateInputType = period === 'day' ? 'date' : period === 'month' ? 'month' : 'number';
  return <>
    <section className="rounded-2xl border border-sky-200 bg-white p-4 sm:p-5">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1.2fr_auto] md:items-end">
        <label className="text-xs font-bold text-slate-600">Trạng thái booking<select value={status} onChange={(event) => onStatusChange(event.target.value as BookingStatus | 'all')} className="booking-input mt-1"><option value="all">Tất cả trạng thái</option>{(Object.keys(statusLabels) as BookingStatus[]).map((key) => <option key={key} value={key}>{statusLabels[key]}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Kiểu thời gian<select value={period} onChange={(event) => onPeriodChange(event.target.value as RevenuePeriod)} className="booking-input mt-1"><option value="all">Tất cả thời gian</option><option value="day">Theo ngày</option><option value="month">Theo tháng</option><option value="year">Theo năm</option></select></label>
        {period !== 'all' && <label className="text-xs font-bold text-slate-600">Mốc thời gian<input type={dateInputType} min={period === 'year' ? '2020' : undefined} max={period === 'year' ? '2100' : undefined} value={dateValue} onChange={(event) => onDateChange(event.target.value)} className="booking-input mt-1" /></label>}
        <button type="button" onClick={() => { onStatusChange('all'); onPeriodChange('all'); }} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700">Xóa lọc</button>
      </div>
    </section>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Tổng booking chưa hủy" value={formatVND(summary.total)} /><Metric label="Doanh thu đã hoàn tất" value={formatVND(summary.realized)} /><Metric label="Doanh thu dự kiến đã xác nhận" value={formatVND(summary.expected)} /><Metric label="Booking đang hoạt động" value={`${summary.activeCount} lịch`} /></div>
    <div className="mt-6"><Table headers={['Thời gian', 'Dịch vụ', 'Tổng', 'Thanh toán', 'Trạng thái']}>{bookings.map((item) => <tr key={item.id}><Td>{item.booking_date}</Td><Td>{item.service_title}</Td><Td>{formatVND(item.total_price)}</Td><Td>{item.payment_status || 'unpaid'}</Td><Td>{statusLabels[item.status] || item.status}</Td></tr>)}</Table>{loading && <p className="mt-3 text-center text-sm text-slate-500">Đang tải dữ liệu…</p>}{hasMore && <button type="button" onClick={onLoadMore} className="mt-4 min-h-11 rounded-xl border border-sky-300 px-5 text-sm font-bold text-sky-800">Tải thêm</button>}{!loading && !bookings.length && <p className="mt-5 text-center text-sm text-slate-500">Không có booking phù hợp bộ lọc.</p>}</div>
  </>;
}

function getDateRange(period: RevenuePeriod, value: string): Pick<BookingRevenueFilters, 'fromDate' | 'toDate'> {
  if (period === 'day' && value) return { fromDate: value, toDate: value };
  if (period === 'month' && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return { fromDate: `${value}-01`, toDate: `${value}-${String(lastDay).padStart(2, '0')}` };
  }
  if (period === 'year' && /^\d{4}$/.test(value)) return { fromDate: `${value}-01-01`, toDate: `${value}-12-31` };
  return {};
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-sky-50 text-xs uppercase text-slate-600"><tr>{headers.map((item) => <th key={item} className="p-4">{item}</th>)}</tr></thead><tbody className="divide-y divide-sky-100">{children}</tbody></table></div>; }
function Td({ children }: { children: ReactNode }) { return <td className="p-4 align-top">{children}</td>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-sky-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-xl">{value}</strong></div>; }
