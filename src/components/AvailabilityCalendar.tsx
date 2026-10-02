'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck2, ChevronLeft, ChevronRight, Clock3, Sparkles } from 'lucide-react';
import type { AvailabilityStatus, PublicScheduleItem } from '@/types';

interface Props { bookings: PublicScheduleItem[]; onBook: (date?: string) => void; }

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const STATUS = {
  available: { label: 'Còn nhiều ca', shortLabel: 'Còn lịch' },
  limited: { label: 'Sắp kín lịch', shortLabel: 'Còn ít ca' },
  booked: { label: 'Đã kín lịch', shortLabel: 'Đã kín' },
  off: { label: 'Tạm nghỉ', shortLabel: 'Nghỉ' },
} satisfies Record<AvailabilityStatus, { label: string; shortLabel: string }>;

const toKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function AvailabilityCalendar({ bookings, onBook }: Props) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState('');

  const days = useMemo(() => {
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
    return { count, offset };
  }, [month]);

  const bookingCount = (date: Date) => {
    const key = toKey(date);
    return bookings.filter((item) => item.booking_date === key && item.status !== 'cancelled').length;
  };
  const statusFor = (date: Date): AvailabilityStatus => {
    if (date < today || date.getDay() === 1) return 'off';
    const count = bookingCount(date);
    return count >= 3 ? 'booked' : count >= 1 ? 'limited' : 'available';
  };
  const openSlots = (date: Date) => Math.max(0, 3 - bookingCount(date));
  const selected = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;
  const selectedLabel = selected ? new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(selected) : '';
  const currentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const moveMonth = (amount: number) => {
    setMonth((value) => new Date(value.getFullYear(), value.getMonth() + amount, 1));
    setSelectedDate('');
  };

  return (
    <section id="availability" className="availability-section scroll-reveal">
      <div className="availability-shell">
        <header className="availability-heading">
          <div><span><Sparkles /> Lịch Luxury Portrait</span><h2>Ngày đẹp của bạn<br /><em>bắt đầu từ đây.</em></h2></div>
          <p>Xem nhanh lịch trống, chọn ngày phù hợp và hoàn tất yêu cầu đặt lịch chỉ trong vài phút.</p>
        </header>

        <div className="availability-card">
          <aside className="availability-guide">
            <span className="availability-guide__eyebrow">Lịch chụp tháng {month.getMonth() + 1}</span>
            <h3>Mỗi ngày chỉ nhận tối đa 3 buổi chụp.</h3>
            <p>Giới hạn số lịch giúp chúng tôi chuẩn bị concept, ánh sáng và trải nghiệm chỉn chu cho từng khách hàng.</p>
            <div className="availability-legend">
              {(Object.entries(STATUS) as [AvailabilityStatus, typeof STATUS[AvailabilityStatus]][]).map(([key, value]) => <div key={key}><span className={`availability-dot availability-dot--${key}`} />{value.label}</div>)}
            </div>
            <div className={`availability-selection ${selected ? 'is-selected' : ''}`} aria-live="polite">
              <CalendarCheck2 />
              <div>{selected ? <><span>Ngày bạn đã chọn</span><strong>{selectedLabel}</strong><small>{openSlots(selected)} ca đang còn trống</small></> : <><span>Bắt đầu tại đây</span><strong>Chọn một ngày còn lịch</strong><small>Sau đó tiếp tục điền thông tin đặt lịch</small></>}</div>
            </div>
            <button type="button" disabled={!selectedDate} onClick={() => onBook(selectedDate)} className="availability-continue">Tiếp tục đặt lịch <ArrowRight /></button>
          </aside>

          <div className="availability-calendar">
            <div className="availability-toolbar">
              <div><span>Chọn ngày chụp</span><h3>Tháng {month.getMonth() + 1}, {month.getFullYear()}</h3></div>
              <div>
                {!currentMonth && <button type="button" className="availability-today" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(''); }}>Hôm nay</button>}
                <button type="button" disabled={currentMonth} onClick={() => moveMonth(-1)} aria-label="Tháng trước"><ChevronLeft /></button>
                <button type="button" onClick={() => moveMonth(1)} aria-label="Tháng sau"><ChevronRight /></button>
              </div>
            </div>

            <div className="availability-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="availability-days">
              {Array.from({ length: days.offset }).map((_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
              {Array.from({ length: days.count }, (_, index) => index + 1).map((day) => {
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const key = toKey(date);
                const status = statusFor(date);
                const disabled = status === 'booked' || status === 'off';
                const active = selectedDate === key;
                const isToday = key === toKey(today);
                const label = status === 'available' ? `${openSlots(date)} ca trống` : status === 'limited' ? `${openSlots(date)} ca trống` : STATUS[status].shortLabel;
                return <button type="button" key={key} disabled={disabled} onClick={() => setSelectedDate(key)} aria-pressed={active} aria-label={`${day} tháng ${month.getMonth() + 1}: ${STATUS[status].label}`} className={`availability-day availability-day--${status} ${active ? 'is-selected' : ''}`}>
                  <span>{isToday ? 'Hôm nay' : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date)}</span>
                  <strong>{day}</strong>
                  <small><i />{label}</small>
                </button>;
              })}
            </div>

            <div className="availability-mobile-action">
              <Clock3 />
              <div><span>{selected ? selectedLabel : 'Hãy chọn ngày còn lịch'}</span><strong>{selected ? `${openSlots(selected)} ca đang còn trống` : 'Bạn chưa chọn ngày'}</strong></div>
              <button type="button" disabled={!selectedDate} onClick={() => onBook(selectedDate)} aria-label="Tiếp tục đặt lịch"><ArrowRight /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
