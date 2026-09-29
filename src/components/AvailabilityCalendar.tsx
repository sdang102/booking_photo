'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { AvailabilityStatus, PublicScheduleItem } from '@/types';

interface Props { bookings: PublicScheduleItem[]; onBook: () => void; }
const STATUS = {
  available: { label: 'Còn lịch', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  limited: { label: 'Còn ít slot', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  booked: { label: 'Hết lịch', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  off: { label: 'Không nhận lịch', className: 'bg-slate-100 text-slate-400 border-slate-200' },
} satisfies Record<AvailabilityStatus, { label: string; className: string }>;

export default function AvailabilityCalendar({ bookings, onBook }: Props) {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const days = useMemo(() => {
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    return { count, offset };
  }, [month]);
  const statusFor = (day: number): AvailabilityStatus => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    if (date < new Date(new Date().setHours(0, 0, 0, 0)) || date.getDay() === 1) return 'off';
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = bookings.filter((item) => item.booking_date === key && item.status !== 'cancelled').length;
    return count >= 2 ? 'booked' : count >= 1 ? 'limited' : 'available';
  };

  return (
    <section id="availability" className="scroll-reveal py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center"><span className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Lịch chụp</span><h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-5xl">Kiểm Tra Lịch Chụp</h2><p className="mt-3 text-slate-600">Xem nhanh những ngày tôi còn nhận lịch trước khi đặt gói.</p></div>
        <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-sky-200 bg-white p-4 shadow-xl shadow-sky-900/5 sm:p-7">
          <div className="flex items-center justify-between"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="calendar-nav" aria-label="Tháng trước"><ChevronLeft /></button><h3 className="text-lg font-bold text-slate-900">Tháng {month.getMonth() + 1}, {month.getFullYear()}</h3><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="calendar-nav" aria-label="Tháng sau"><ChevronRight /></button></div>
          <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-500 sm:gap-2 sm:text-xs">{['T2','T3','T4','T5','T6','T7','CN'].map((d) => <div key={d} className="py-2">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: days.offset }).map((_, i) => <div key={`blank-${i}`} />)}{Array.from({ length: days.count }, (_, i) => i + 1).map((day) => { const status = statusFor(day); const meta = STATUS[status]; return <button key={day} disabled={status === 'booked' || status === 'off'} onClick={onBook} className={`aspect-square rounded-xl border p-1 text-left transition-all hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 ${meta.className}`}><strong className="block text-xs sm:text-sm">{day}</strong><span className="hidden text-[9px] sm:block">{meta.label}</span></button>; })}</div>
          <div className="mt-6 flex flex-wrap gap-3">{Object.entries(STATUS).map(([key, value]) => <div key={key} className="flex items-center gap-1.5 text-[11px] text-slate-600"><span className={`h-3 w-3 rounded border ${value.className}`} />{value.label}</div>)}</div>
        </div>
        <div className="mt-7 text-center"><button onClick={onBook} className="sky-button inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm"><CalendarDays className="h-4 w-4" />Kiểm Tra Lịch & Đặt Chụp</button></div>
      </div>
    </section>
  );
}

