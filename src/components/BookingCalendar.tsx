'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AvailabilityBlock, PublicScheduleItem } from '@/types';
import { dateKey, getBookingDayState, todayKey, type BookingDayState } from '@/lib/bookingAvailability';

interface Props {
  selectedDate: string;
  bookings: PublicScheduleItem[];
  blocks: AvailabilityBlock[];
  loading?: boolean;
  onSelect: (date: string) => void;
}

const DAY_META: Record<BookingDayState, { label: string; className: string }> = {
  available: { label: 'Còn chỗ', className: 'is-open' },
  limited: { label: 'Còn ít chỗ', className: 'is-limited' },
  partially_blocked: { label: 'Có ca bị chặn', className: 'is-blocked-partial' },
  booked: { label: 'Hết lịch', className: 'is-full' },
  blocked: { label: 'Ngày không nhận job', className: 'is-blocked' },
  past: { label: 'Đã qua', className: 'is-past' },
};

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export default function BookingCalendar({ selectedDate, bookings, blocks, loading, onSelect }: Props) {
  const today = todayKey();
  const initialDate = fromDateKey(selectedDate || today);
  const [viewMonth, setViewMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12));
  const [dateMessage, setDateMessage] = useState('');

  const monthCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const leadingDays = (new Date(year, month, 1, 12).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const value = new Date(year, month, index - leadingDays + 1, 12);
      return { value, inMonth: value.getMonth() === month, key: dateKey(value.getFullYear(), value.getMonth(), value.getDate()) };
    });
  }, [viewMonth]);

  const todayDate = fromDateKey(today);
  const canGoBack = viewMonth.getFullYear() > todayDate.getFullYear() || viewMonth.getMonth() > todayDate.getMonth();
  const moveMonth = (amount: number) => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));

  const selectDate = (value: string) => {
    const meta = getBookingDayState(value, bookings, blocks);
    if (meta.state === 'available' || meta.state === 'limited' || meta.state === 'partially_blocked') {
      setDateMessage('');
      onSelect(value);
      return;
    }
    setDateMessage(meta.state === 'blocked' ? 'Ngày này FIN PHOTO không nhận job vì có lịch riêng. Bạn vui lòng chọn ngày khác.' : 'Ngày này đã hết lịch. Bạn vui lòng chọn ngày khác.');
  };

  return <div className={`booking-month-calendar ${loading ? 'is-loading' : ''}`}>
    <div className="booking-month-calendar__head">
      <div><CalendarDays /><strong>Tháng {String(viewMonth.getMonth() + 1).padStart(2, '0')}, {viewMonth.getFullYear()}</strong></div>
      <div>
        <button type="button" disabled={!canGoBack} onClick={() => moveMonth(-1)} aria-label="Xem tháng trước"><ChevronLeft /></button>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Xem tháng sau"><ChevronRight /></button>
      </div>
    </div>
    <div className="booking-month-calendar__weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="booking-month-calendar__days">
      {monthCells.map(({ value, inMonth, key }) => {
        const meta = getBookingDayState(key, bookings, blocks);
        const disabled = loading || !inMonth || !['available', 'limited', 'partially_blocked'].includes(meta.state);
        const selected = selectedDate === key;
        return <button
          type="button"
          key={key}
          disabled={disabled}
          onClick={() => selectDate(key)}
          aria-label={`${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()} · ${inMonth ? DAY_META[meta.state].label : 'Ngoài tháng đang xem'}`}
          aria-pressed={selected}
          className={`${inMonth ? DAY_META[meta.state].className : 'is-outside'} ${selected ? 'is-selected' : ''}`}
        ><span>{String(value.getDate()).padStart(2, '0')}</span>{selected && <i />}</button>;
      })}
    </div>
    <div className="booking-month-calendar__legend"><span><i className="is-open" />Còn chỗ</span><span><i className="is-full" />Hết lịch</span><span><i className="is-blocked" />Có lịch thợ chặn</span></div>
    {dateMessage && <p className="booking-month-calendar__message" role="alert">{dateMessage}</p>}
  </div>;
}
