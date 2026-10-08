'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { todayKey } from '@/lib/bookingAvailability';
import BookingStatusBadge from '@/components/photographer/BookingStatusBadge';
import { usePhotographerBookings } from '@/lib/context/PhotographerBookingsContext';

export default function Schedule() {
  const { items, isLoading, error, refresh } = usePhotographerBookings();
  const upcoming = useMemo(() => items.filter((item) => item.status !== 'cancelled' && item.booking_date >= todayKey()).sort((a, b) => `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`)), [items]);
  const grouped = Object.groupBy(upcoming, (item) => item.booking_date);
  return <>
    <p className="section-kicker">Agenda</p><h1 className="mt-2 text-3xl font-black">Lịch chụp</h1><p className="mt-2 text-sm text-slate-500">Theo dõi các buổi chụp sắp tới đã được khách đặt.</p>
    <div className="mt-7 space-y-7" aria-busy={isLoading}>
      {isLoading && <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center text-sm text-slate-500" role="status">Đang tải lịch chụp…</div>}
      {!isLoading && error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><p>{error}</p><button type="button" onClick={() => void refresh()} className="mt-2 font-bold underline">Thử lại</button></div>}
      {!isLoading && !error && Object.entries(grouped).map(([day, dayItems]) => <section key={day}><h2 className="mb-3 flex items-center gap-2 font-black"><CalendarDays className="h-5 w-5 text-amber-400" />{formatLongDate(day)}</h2><div className="space-y-3">{dayItems?.map((item) => <Link key={item.id} href={`/photographer/bookings/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-white p-4"><div><strong>{item.booking_time}</strong><p className="mt-1 text-sm">{item.customer_name}</p><p className="text-xs text-slate-500">{item.service_title}</p></div><BookingStatusBadge status={item.status} /></Link>)}</div></section>)}
      {!isLoading && !error && !upcoming.length && <div className="rounded-2xl border border-dashed border-sky-300 bg-white p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-amber-400" /><h2 className="mt-3 font-black">Chưa có lịch chụp sắp tới</h2></div>}
    </div>
  </>;
}

function formatLongDate(date: string) { return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T00:00:00`)); }
