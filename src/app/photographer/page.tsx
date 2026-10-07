'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import BookingStatusBadge from '@/components/photographer/BookingStatusBadge';
import { todayKey } from '@/lib/bookingAvailability';
import { usePhotographerBookings } from '@/lib/context/PhotographerBookingsContext';

export default function PhotographerHome() {
  const { items: allItems } = usePhotographerBookings();
  const today = todayKey();
  const items = useMemo(() => allItems
    .filter((item) => item.booking_date >= today && item.status !== 'cancelled')
    .sort((first, second) => `${first.booking_date}${first.booking_time}`.localeCompare(`${second.booking_date}${second.booking_time}`)), [allItems, today]);

  const pendingCount = items.filter((item) => item.status === 'pending').length;

  return <>
    <p className="section-kicker">Xin chào,</p>
    <h1 className="mt-2 text-3xl font-black">Lịch khách đã đặt</h1>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-sky-600"/><strong>{items.length} lịch sắp tới</strong><span>·</span><strong className="text-amber-700">{pendingCount} lịch chờ duyệt</strong></div>
    <div className="mt-7 space-y-4">{items.map((item) => <article key={item.id} className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><strong className="text-lg">{item.booking_date.split('-').reverse().join('/')} · {item.booking_time}</strong><p className="mt-1 text-xs text-slate-500">{item.booking_date===today?'Hôm nay':'Lịch sắp tới'}</p></div><BookingStatusBadge status={item.status}/></div>
      <h2 className="mt-4 text-lg font-black">{item.customer_name}</h2><p className="mt-1 text-sm text-slate-600">{item.service_title}</p>
      <p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"/>{item.shoot_address||'Ngoại cảnh'}</p>
      <Link href={`/photographer/bookings/${item.id}`} className="sky-button mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm">Xem và duyệt booking <ArrowRight className="h-4 w-4"/></Link>
    </article>)}{!items.length&&<div className="rounded-2xl border border-dashed border-sky-300 bg-white p-10 text-center"><CameraIcon/><h2 className="mt-3 font-black">Chưa có booking nào sắp tới</h2><p className="mt-2 text-sm text-slate-500">Booking mới của khách sẽ tự động xuất hiện tại đây.</p></div>}</div>
  </>;
}

function CameraIcon(){return <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sky-100 text-xl">📷</div>}
