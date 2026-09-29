'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailabilityBlock, PublicScheduleItem } from '@/types';
import { dateKey, getBookingDayState, todayKey, type BookingDayState } from '@/lib/bookingAvailability';

interface Props {
  selectedDate: string;
  bookings: PublicScheduleItem[];
  blocks: AvailabilityBlock[];
  loading?: boolean;
  onSelect: (date: string) => void;
}

const DAY_STYLE: Record<BookingDayState, { label: string; className: string }> = {
  available: { label:'Còn trống', className:'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400' },
  limited: { label:'Đã có lịch', className:'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400' },
  booked: { label:'Hết chỗ', className:'border-rose-200 bg-rose-50 text-rose-500' },
  blocked: { label:'Thợ khóa lịch', className:'border-slate-200 bg-slate-100 text-slate-400' },
  past: { label:'Đã qua', className:'border-transparent bg-slate-50 text-slate-300' },
};

export default function BookingCalendar({ selectedDate, bookings, blocks, loading, onSelect }: Props) {
  const today = new Date();
  const currentDateParts = todayKey(today).split('-').map(Number);
  const selectedParts = selectedDate.split('-').map(Number);
  const [month, setMonth] = useState(() => selectedDate
    ? new Date(selectedParts[0], selectedParts[1] - 1, 1)
    : new Date(currentDateParts[0], currentDateParts[1] - 1, 1));
  const currentMonth = new Date(currentDateParts[0], currentDateParts[1] - 1, 1);
  const days = useMemo(() => {
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    return { count, offset };
  }, [month]);

  return <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-sky-200 bg-slate-50/70 p-3 sm:p-4">
    <div className="flex items-center justify-between">
      <button type="button" disabled={month <= currentMonth} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="calendar-nav disabled:cursor-not-allowed disabled:opacity-30" aria-label="Tháng trước"><ChevronLeft className="h-4 w-4"/></button>
      <div className="text-center"><h4 className="font-black text-slate-900">Tháng {month.getMonth()+1}/{month.getFullYear()}</h4><p className="mt-0.5 text-[10px] text-slate-500">Chọn ngày còn chỗ để xem giờ</p></div>
      <button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="calendar-nav" aria-label="Tháng sau"><ChevronRight className="h-4 w-4"/></button>
    </div>
    <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase text-slate-500 sm:gap-1.5">{['T2','T3','T4','T5','T6','T7','CN'].map(day=><div key={day} className="py-1">{day}</div>)}</div>
    <div className={`grid grid-cols-7 gap-1 sm:gap-1.5 ${loading?'animate-pulse opacity-60':''}`}>
      {Array.from({length:days.offset},(_,index)=><div key={`blank-${index}`}/>)}
      {Array.from({length:days.count},(_,index)=>index+1).map(day=>{
        const key=dateKey(month.getFullYear(),month.getMonth(),day);
        const meta=getBookingDayState(key,bookings,blocks,today);
        const disabled=loading||meta.state==='past'||meta.state==='booked'||meta.state==='blocked';
        const selected=selectedDate===key;
        const detail=meta.state==='limited'
          ? meta.bookingCount>0?`${meta.bookingCount} lịch${meta.hasBlock?' · có giờ khóa':''}`:'Khóa một phần'
          : DAY_STYLE[meta.state].label;
        return <button type="button" key={key} disabled={disabled} onClick={()=>onSelect(key)} aria-pressed={selected} className={`min-h-11 rounded-lg border p-1 text-left transition sm:min-h-12 sm:p-1.5 ${DAY_STYLE[meta.state].className} ${selected?'ring-2 ring-sky-500 ring-offset-1':''} disabled:cursor-not-allowed`}>
          <strong className="block text-[11px] sm:text-xs">{day}</strong><span className="mt-0.5 block truncate text-[7px] font-semibold sm:text-[8px]">{detail}</span>
        </button>;
      })}
    </div>
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">{(['available','limited','booked','blocked'] as BookingDayState[]).map(state=><span key={state} className="flex items-center gap-1 text-[9px] text-slate-600"><i className={`h-2.5 w-2.5 rounded border ${DAY_STYLE[state].className}`}/>{DAY_STYLE[state].label}</span>)}</div>
  </div>;
}
