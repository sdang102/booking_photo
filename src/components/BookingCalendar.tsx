'use client';

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailabilityBlock, PublicScheduleItem } from '@/types';
import { BOOKING_SHIFTS, dateKey, getBookingDayState, isRangeAvailable, todayKey, type BookingDayState } from '@/lib/bookingAvailability';

interface Props {
  selectedDate: string;
  bookings: PublicScheduleItem[];
  blocks: AvailabilityBlock[];
  loading?: boolean;
  onSelect: (date: string) => void;
}

const DAY_STYLE: Record<BookingDayState, { label: string; className: string }> = {
  available: { label: 'Còn trống', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:shadow-md' },
  limited: { label: 'Còn ít ca', className: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-500 hover:shadow-md' },
  booked: { label: 'Hết ca', className: 'border-rose-200 bg-rose-50 text-rose-500' },
  blocked: { label: 'Tạm nghỉ', className: 'border-slate-200 bg-slate-100 text-slate-400' },
  past: { label: 'Đã qua', className: 'border-transparent bg-slate-50 text-slate-300' },
};

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(value: string, amount: number) {
  const date = fromDateKey(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function BookingCalendar({ selectedDate, bookings, blocks, loading, onSelect }: Props) {
  const today = todayKey();
  const [firstDate, setFirstDate] = useState(selectedDate || today);
  const [dateMessage, setDateMessage] = useState('');
  const visibleDates = Array.from({ length: 7 }, (_, index) => addDays(firstDate, index));

  const selectDate = (value: string) => {
    const meta = getBookingDayState(value, bookings, blocks);
    if (meta.state === 'available' || meta.state === 'limited') {
      setDateMessage('');
      setFirstDate(value);
      onSelect(value);
      return;
    }
    setDateMessage('Ngày này đã hết ca hoặc tạm nghỉ. Bạn vui lòng chọn ngày khác.');
  };

  return <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-sky-200 bg-slate-50/70 p-3 sm:p-4">
    <div className="flex items-center justify-between gap-2">
      <button type="button" disabled={firstDate <= today} onClick={() => setFirstDate((value) => addDays(value, -7) < today ? today : addDays(value, -7))} className="calendar-nav shrink-0 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Xem 7 ngày trước"><ChevronLeft className="h-4 w-4" /></button>
      <div className="min-w-0 text-center">
        <h4 className="font-black text-slate-900">Chọn một ngày còn trống</h4>
        <p className="mt-0.5 text-xs text-slate-500">Xem 7 ngày một lần, bấm mũi tên để xem tuần sau</p>
      </div>
      <button type="button" onClick={() => setFirstDate((value) => addDays(value, 7))} className="calendar-nav shrink-0" aria-label="Xem 7 ngày sau"><ChevronRight className="h-4 w-4" /></button>
    </div>

    <div className={`mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 ${loading ? 'animate-pulse opacity-60' : ''}`}>
      {visibleDates.map((key) => {
        const value = fromDateKey(key);
        const meta = getBookingDayState(key, bookings, blocks);
        const disabled = loading || !['available', 'limited'].includes(meta.state);
        const selected = selectedDate === key;
        const openShifts = BOOKING_SHIFTS.filter((shift) => isRangeAvailable(key, shift.range, bookings, blocks)).length;
        const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(value);
        return <button type="button" key={key} disabled={disabled} onClick={() => selectDate(key)} aria-pressed={selected} className={`min-h-24 rounded-xl border p-3 text-left transition duration-200 ${DAY_STYLE[meta.state].className} ${selected ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-500 ring-offset-2' : ''} disabled:cursor-not-allowed disabled:shadow-none`}>
          <span className="block text-xs font-bold uppercase">{weekday}</span>
          <strong className="mt-1 block text-lg text-slate-900">{String(value.getDate()).padStart(2, '0')}/{String(value.getMonth() + 1).padStart(2, '0')}</strong>
          <span className="mt-2 block text-[11px] font-bold">{disabled ? DAY_STYLE[meta.state].label : `${openShifts} ca còn trống`}</span>
        </button>;
      })}
    </div>

    <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-sky-200 bg-elevated px-3 text-sm font-bold text-slate-700">
      <CalendarDays className="h-5 w-5 shrink-0 text-sky-600" />
      <span className="min-w-0 flex-1">Hoặc chọn ngày khác</span>
      <input type="date" min={today} value={selectedDate} onChange={(event) => event.target.value && selectDate(event.target.value)} className="min-w-0 max-w-[9rem] rounded-lg border border-sky-200 bg-white px-2 py-2 text-sm text-slate-800" aria-label="Chọn ngày khác" />
    </label>
    {dateMessage && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">{dateMessage}</p>}
  </div>;
}
