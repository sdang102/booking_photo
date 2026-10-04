'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { BookingPhotoRecord, BookingStatus } from '@/types';
import { getAllBookings } from '@/lib/services/bookingService';
import BookingStatusBadge, { BOOKING_STATUS_LABEL } from '@/components/photographer/BookingStatusBadge';

const FILTERS=['pending','confirmed','completed'] as const satisfies readonly BookingStatus[];
type BookingFilter=(typeof FILTERS)[number];

export default function PhotographerBookings(){
  const[items,setItems]=useState<BookingPhotoRecord[]>([]);
  const[q,setQ]=useState('');
  const[status,setStatus]=useState<'all'|BookingFilter>('all');
  useEffect(()=>{getAllBookings().then(setItems)},[]);
  const shown=items.filter((item)=>(status==='all'||item.status===status)&&`${item.customer_name} ${item.service_title} ${item.booking_date}`.toLowerCase().includes(q.toLowerCase()));

  return <>
    <p className="section-kicker">Danh sách công việc</p><h1 className="mt-2 text-3xl font-black">Booking</h1>
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_240px]"><label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/><input value={q} onChange={(event)=>setQ(event.target.value)} className="booking-input pl-10" placeholder="Tìm khách, dịch vụ, ngày…"/></label><select aria-label="Lọc trạng thái booking" className="booking-input" value={status} onChange={(event)=>setStatus(event.target.value as typeof status)}><option value="all">Tất cả trạng thái</option>{FILTERS.map((value)=><option key={value} value={value}>{BOOKING_STATUS_LABEL[value]}</option>)}</select></div>
    <div className="mt-3 flex flex-wrap gap-2">{FILTERS.map((value)=>{const count=items.filter((item)=>item.status===value).length;return <button key={value} type="button" onClick={()=>setStatus(status===value?'all':value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${status===value?'border-amber-400 bg-amber-50 text-amber-800':'border-sky-200 text-slate-500 hover:border-amber-400'}`}>{BOOKING_STATUS_LABEL[value]} · {count}</button>})}</div>
    <div className="mt-6 space-y-3">{shown.map((item)=><Link key={item.id} href={`/photographer/bookings/${item.id}`} className="block rounded-2xl border border-sky-200 bg-white p-4"><div className="flex justify-between gap-3"><div><strong>{item.booking_time} · {item.customer_name}</strong><p className="mt-1 text-xs text-slate-600">{item.booking_date} · {item.service_title}</p></div><BookingStatusBadge status={item.status}/></div></Link>)}{!shown.length&&<div className="rounded-2xl border border-dashed border-sky-300 bg-white p-8 text-center text-sm text-slate-500">Không có booking phù hợp với bộ lọc.</div>}</div>
  </>;
}
