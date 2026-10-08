'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
  partially_blocked: { label: 'Có ca không khả dụng', className: 'is-blocked-partial' },
  booked: { label: 'Đã kín lịch', className: 'is-full' },
  blocked: { label: 'Không khả dụng', className: 'is-blocked' },
  past: { label: 'Ngày đã qua, không khả dụng', className: 'is-past' },
};

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function keyForDate(value: Date) {
  return dateKey(value.getFullYear(), value.getMonth(), value.getDate());
}

export default function BookingCalendar({ selectedDate, bookings, blocks, loading, onSelect }: Props) {
  const today = todayKey();
  const initialDate = fromDateKey(selectedDate || today);
  const [viewMonth, setViewMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12));
  const [focusDate, setFocusDate] = useState(selectedDate || today);
  const pendingFocus = useRef(false);
  const [dateMessage, setDateMessage] = useState('');
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());

  const monthCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const leadingDays = (new Date(year, month, 1, 12).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const value = new Date(year, month, index - leadingDays + 1, 12);
      return { value, inMonth: value.getMonth() === month, key: keyForDate(value) };
    });
  }, [viewMonth]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    dayRefs.current.get(focusDate)?.focus();
    pendingFocus.current = false;
  }, [focusDate, viewMonth]);

  const todayDate = fromDateKey(today);
  const canGoBack = viewMonth.getFullYear() > todayDate.getFullYear() || viewMonth.getMonth() > todayDate.getMonth();
  const moveMonth = (amount: number) => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));

  const selectDate = (value: string) => {
    const meta = getBookingDayState(value, bookings, blocks);
    if (['available', 'limited', 'partially_blocked'].includes(meta.state)) {
      setDateMessage('');
      onSelect(value);
      return;
    }
    const message = meta.state === 'past'
      ? 'Ngày này đã qua. Bạn vui lòng chọn ngày khác.'
      : meta.state === 'blocked'
        ? 'Ngày này không khả dụng. Bạn vui lòng chọn ngày khác.'
        : 'Ngày này đã kín lịch. Bạn vui lòng chọn ngày khác.';
    setDateMessage(message);
  };

  const moveFocus = (current: Date, amount: number) => {
    const target = new Date(current);
    target.setDate(target.getDate() + amount);
    const key = keyForDate(target);
    setFocusDate(key);
    setViewMonth(new Date(target.getFullYear(), target.getMonth(), 1, 12));
    pendingFocus.current = true;
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: Date) => {
    const movement: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in movement) {
      event.preventDefault();
      moveFocus(value, movement[event.key] ?? 0);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const weekday = (value.getDay() + 6) % 7;
      moveFocus(value, event.key === 'Home' ? -weekday : 6 - weekday);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const target = new Date(value.getFullYear(), value.getMonth() + (event.key === 'PageUp' ? -1 : 1), value.getDate(), 12);
      setFocusDate(keyForDate(target));
      setViewMonth(new Date(target.getFullYear(), target.getMonth(), 1, 12));
      pendingFocus.current = true;
    }
  };

  return <div className={`booking-month-calendar ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
    <div className="booking-month-calendar__head">
      <div><CalendarDays /><strong>Tháng {String(viewMonth.getMonth() + 1).padStart(2, '0')}, {viewMonth.getFullYear()}</strong></div>
      <div>
        <button type="button" disabled={!canGoBack} onClick={() => moveMonth(-1)} aria-label="Xem tháng trước"><ChevronLeft /></button>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Xem tháng sau"><ChevronRight /></button>
      </div>
    </div>
    <div className="booking-month-calendar__weekdays" role="row">{WEEKDAYS.map((day) => <span role="columnheader" key={day}>{day}</span>)}</div>
    <div className="booking-month-calendar__days" role="grid" aria-label={`Lịch tháng ${viewMonth.getMonth() + 1} năm ${viewMonth.getFullYear()}`}>
      {monthCells.map(({ value, inMonth, key }) => {
        const meta = getBookingDayState(key, bookings, blocks);
        const available = ['available', 'limited', 'partially_blocked'].includes(meta.state);
        const selected = selectedDate === key;
        const label = `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()} · ${inMonth ? DAY_META[meta.state].label : 'Ngoài tháng đang xem'}${selected ? ' · Đã chọn' : ''}`;
        return <button
          ref={(element) => { if (element) dayRefs.current.set(key, element); else dayRefs.current.delete(key); }}
          role="gridcell"
          type="button"
          key={key}
          disabled={loading || !inMonth}
          aria-disabled={!available || undefined}
          tabIndex={inMonth && key === focusDate ? 0 : -1}
          onFocus={() => inMonth && setFocusDate(key)}
          onKeyDown={(event) => handleDayKeyDown(event, value)}
          onClick={() => selectDate(key)}
          aria-label={label}
          aria-current={key === today ? 'date' : undefined}
          aria-selected={selected}
          className={`${inMonth ? DAY_META[meta.state].className : 'is-outside'} ${selected ? 'is-selected' : ''}`}
        ><span>{String(value.getDate()).padStart(2, '0')}</span>{selected && <i />}</button>;
      })}
    </div>
    <div className="booking-month-calendar__legend"><span><i className="is-open" />Còn chỗ</span><span><i className="is-full" />Đã kín lịch</span><span><i className="is-blocked" />Không khả dụng</span></div>
    {dateMessage && <p className="booking-month-calendar__message" role="alert">{dateMessage}</p>}
  </div>;
}
