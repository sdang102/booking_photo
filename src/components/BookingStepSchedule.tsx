import { Info, Sun, Sunset } from 'lucide-react';
import type { AvailabilityBlock, PublicScheduleItem } from '@/types';
import { BOOKING_SHIFTS, rangesOverlap } from '@/lib/bookingAvailability';
import BookingCalendar from './BookingCalendar';

const SHIFT_PRESENTATION = {
  morning: { title: 'Buổi Sáng', copy: 'Ánh sáng tự nhiên dịu êm', badge: 'Còn chỗ', icon: Sun },
  afternoon: { title: 'Buổi Chiều', copy: 'Ánh sáng khối tương phản sâu', badge: 'Khuyên dùng', icon: Sun },
  evening: { title: 'Hoàng Hôn & Tối', copy: 'Chuyển sắc rực rỡ và đèn nghệ thuật', badge: 'Golden Hour', icon: Sunset },
} as const;

type Shift = typeof BOOKING_SHIFTS[number];

export default function BookingStepSchedule({
  date,
  time,
  bookings,
  blocks,
  loading,
  availableShifts,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  bookings: PublicScheduleItem[];
  blocks: AvailabilityBlock[];
  loading: boolean;
  availableShifts: Shift[];
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  return <div className="booking-schedule-step">
    <header className="booking-schedule-heading"><span>Phần 02</span><i>/</i><h3>Ngày Thực Hiện &amp; Khung Giờ Ánh Sáng</h3></header>
    <div className="booking-schedule-grid">
      <BookingCalendar selectedDate={date} bookings={bookings} blocks={blocks} loading={loading} onSelect={onDateChange} />
      <section className="booking-light-slots" aria-label="Chọn khung giờ chụp">
        <h4>Khung giờ quang học</h4>
        <div>{BOOKING_SHIFTS.map((shift) => {
          const available = Boolean(date) && availableShifts.some((item) => item.id === shift.id);
          const blockedByPhotographer = Boolean(date) && blocks.some((block) => block.date === date && rangesOverlap(shift.range, `${block.start_time} - ${block.end_time}`));
          const selected = time === shift.range;
          const presentation = SHIFT_PRESENTATION[shift.id];
          const ShiftIcon = presentation.icon;
          return <button type="button" key={shift.id} disabled={!available} onClick={() => onTimeChange(shift.range)} className={`${selected ? 'is-selected' : ''} ${available ? 'is-available' : blockedByPhotographer ? 'is-blocked' : 'is-unavailable'}`}>
            <span className="booking-light-slots__title"><ShiftIcon /><strong>{presentation.title}</strong><b>{selected ? 'Đã chọn' : available ? presentation.badge : blockedByPhotographer ? 'Thợ đã chặn' : date ? 'Hết lịch' : 'Chọn ngày'}</b></span>
            <span className="booking-light-slots__copy">{shift.range} <i>•</i> {presentation.copy}</span>
          </button>;
        })}</div>
        <p className="booking-light-slots__notice"><Info />Mỗi khung giờ chỉ nhận tối đa 01 khách hàng độc quyền tại sảnh.</p>
        {date && !availableShifts.length && <p className="booking-light-slots__empty">Ngày này đã hết lịch. Vui lòng chọn ngày khác.</p>}
      </section>
    </div>
  </div>;
}
