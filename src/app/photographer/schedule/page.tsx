'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import type { AvailabilityBlock, BookingPhotoRecord } from '@/types';
import { createAvailabilityBlock, getAllBookings, getAvailabilityBlocks, removeAvailabilityBlock } from '@/lib/services/bookingService';
import BookingStatusBadge from '@/components/photographer/BookingStatusBadge';

export default function Schedule() {
  const [items, setItems] = useState<BookingPhotoRecord[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [reason, setReason] = useState<AvailabilityBlock['reason']>('Không nhận lịch');

  useEffect(() => {
    getAllBookings().then(setItems);
    getAvailabilityBlocks().then(setBlocks);
  }, []);

  const upcoming = useMemo(() => items
    .filter((item) => item.status !== 'cancelled' && item.booking_date >= new Date().toLocaleDateString('en-CA'))
    .sort((a, b) => `${a.booking_date}${a.booking_time}`.localeCompare(`${b.booking_date}${b.booking_time}`)), [items]);
  const grouped = Object.groupBy(upcoming, (item) => item.booking_date);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const block = await createAvailabilityBlock({ date, start_time: allDay?'08:00':start, end_time: allDay?'20:00':end, reason });
    setBlocks((value) => [block, ...value]);
    setOpen(false);
    setDate(''); setStart(''); setEnd(''); setAllDay(false);
  };

  return <>
    <div className="flex items-end justify-between gap-4"><div><p className="section-kicker">Agenda</p><h1 className="mt-2 text-3xl font-black">Lịch chụp</h1></div><button onClick={() => setOpen(!open)} className="sky-button flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm"><Plus className="h-4 w-4" />Chặn lịch</button></div>
    {open && <form onSubmit={submit} className="mt-5 grid gap-3 rounded-2xl border border-sky-200 bg-white p-5 sm:grid-cols-2"><input className="booking-input" type="date" min={new Date().toLocaleDateString('en-CA')} required value={date} onChange={(event) => setDate(event.target.value)} /><select className="booking-input" value={reason} onChange={(event) => setReason(event.target.value as AvailabilityBlock['reason'])}>{['Nghỉ', 'Việc cá nhân', 'Không nhận lịch', 'Khác'].map((value) => <option key={value}>{value}</option>)}</select><label className="flex min-h-12 items-center gap-3 rounded-xl border border-sky-200 px-4 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={allDay} onChange={(event)=>setAllDay(event.target.checked)} className="h-4 w-4"/>Khóa cả ngày (08:00–20:00)</label><input className="booking-input" aria-label="Giờ bắt đầu khóa" type="time" min="08:00" max="20:00" required={!allDay} disabled={allDay} value={allDay?'08:00':start} onChange={(event) => setStart(event.target.value)} /><input className="booking-input" aria-label="Giờ kết thúc khóa" type="time" min="08:00" max="20:00" required={!allDay} disabled={allDay} value={allDay?'20:00':end} onChange={(event) => setEnd(event.target.value)} /><button className="sky-button min-h-12 rounded-xl sm:col-span-2">Xác nhận chặn lịch</button></form>}
    <div className="mt-7 space-y-7">{Object.entries(grouped).map(([day, dayItems]) => <section key={day}><h2 className="mb-3 flex items-center gap-2 font-black"><CalendarDays className="h-5 w-5 text-sky-600" />{new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(`${day}T00:00:00`))}</h2><div className="space-y-3">{dayItems?.map((item) => <Link key={item.id} href={`/photographer/bookings/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-white p-4"><div><strong>{item.booking_time}</strong><p className="mt-1 text-sm">{item.customer_name}</p><p className="text-xs text-slate-500">{item.service_title}</p></div><BookingStatusBadge status={item.status} /></Link>)}</div></section>)}</div>
    {blocks.length > 0 && <section className="mt-10"><h2 className="text-xl font-black">Khoảng thời gian đã chặn</h2><div className="mt-4 space-y-3">{blocks.map((block) => <div key={block.id} className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><div><strong>{block.date} · {block.start_time.slice(0,5)==='08:00'&&block.end_time.slice(0,5)==='20:00'?'Cả ngày':`${block.start_time.slice(0,5)}–${block.end_time.slice(0,5)}`}</strong><p className="mt-1 text-amber-800">{block.reason}</p></div><button aria-label="Bỏ chặn" onClick={() => { removeAvailabilityBlock(block.id); setBlocks((value) => value.filter((item) => item.id !== block.id)); }} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-rose-700"><Trash2 className="h-4 w-4" /></button></div>)}</div></section>}
  </>;
}
