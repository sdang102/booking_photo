import type { AvailabilityBlock, PublicScheduleItem } from '@/types';

export const BOOKING_DAY_START = '08:00';
export const BOOKING_DAY_END = '20:00';
export const MIN_CUSTOM_BOOKING_MINUTES = 30;
export const MAX_BOOKINGS_PER_DAY = 2;
export const BOOKING_SHIFTS = [
  { id:'morning', label:'Ca sáng', range:'08:30 - 10:30' },
  { id:'afternoon', label:'Ca chiều', range:'13:30 - 15:30' },
  { id:'evening', label:'Ca tối', range:'18:00 - 20:00' },
] as const;

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'checked_in', 'shooting', 'completed']);

export function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayKey(now = new Date()) {
  const parts = vietnamDateTimeParts(now);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function vietnamDateTimeParts(now: Date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return { year:values.year, month:values.month, day:values.day, hour:Number(values.hour), minute:Number(values.minute) };
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.trim().slice(0, 5).split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : Number.NaN;
}

export function parseTimeRange(value: string): [number, number] {
  const clean = value.replace(/\s*\(.+\)$/, '');
  const [start = '', end = ''] = clean.split('-').map((part) => part.trim());
  return [timeToMinutes(start), timeToMinutes(end)];
}

export function rangesOverlap(first: string, second: string) {
  const [firstStart, firstEnd] = parseTimeRange(first);
  const [secondStart, secondEnd] = parseTimeRange(second);
  return [firstStart, firstEnd, secondStart, secondEnd].every(Number.isFinite)
    && firstStart < secondEnd
    && secondStart < firstEnd;
}

export function activeBookingRanges(date: string, bookings: PublicScheduleItem[]) {
  return bookings
    .filter((booking) => booking.booking_date === date && ACTIVE_STATUSES.has(booking.status))
    .map((booking) => booking.booking_time);
}

export function blockedRanges(date: string, blocks: AvailabilityBlock[]) {
  return blocks
    .filter((block) => block.date === date)
    .map((block) => `${block.start_time.slice(0, 5)} - ${block.end_time.slice(0, 5)}`);
}

export function isRangeAvailable(
  date: string,
  range: string,
  bookings: PublicScheduleItem[],
  blocks: AvailabilityBlock[],
  now = new Date(),
) {
  const [start, end] = parseTimeRange(range);
  const workStart = timeToMinutes(BOOKING_DAY_START);
  const workEnd = timeToMinutes(BOOKING_DAY_END);
  if (!date || !Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (date < todayKey(now) || start < workStart || end > workEnd || end - start < MIN_CUSTOM_BOOKING_MINUTES) return false;
  const vietnamNow = vietnamDateTimeParts(now);
  if (date === todayKey(now) && start <= vietnamNow.hour * 60 + vietnamNow.minute) return false;
  if (activeBookingRanges(date, bookings).length >= MAX_BOOKINGS_PER_DAY) return false;

  return [...activeBookingRanges(date, bookings), ...blockedRanges(date, blocks)]
    .every((busyRange) => !rangesOverlap(range, busyRange));
}

export type BookingDayState = 'available' | 'limited' | 'booked' | 'blocked' | 'past';

export function getBookingDayState(date: string, bookings: PublicScheduleItem[], blocks: AvailabilityBlock[], now = new Date()) {
  if (date < todayKey(now)) return { state: 'past' as const, bookingCount: 0, hasBlock: false };

  const bookingRanges = activeBookingRanges(date, bookings);
  const dayBlocks = blockedRanges(date, blocks);
  const workStart = timeToMinutes(BOOKING_DAY_START);
  const workEnd = timeToMinutes(BOOKING_DAY_END);
  const fullDayBlocked = dayBlocks.some((range) => {
    const [start, end] = parseTimeRange(range);
    return start <= workStart && end >= workEnd;
  });
  if (fullDayBlocked) return { state: 'blocked' as const, bookingCount: bookingRanges.length, hasBlock: true };

  const hasOpenShift = BOOKING_SHIFTS.some((shift) => isRangeAvailable(date, shift.range, bookings, blocks, now));
  if (bookingRanges.length >= MAX_BOOKINGS_PER_DAY || !hasOpenShift) return { state: 'booked' as const, bookingCount: bookingRanges.length, hasBlock:dayBlocks.length > 0 };
  if (bookingRanges.length || dayBlocks.length) return { state: 'limited' as const, bookingCount: bookingRanges.length, hasBlock:dayBlocks.length > 0 };
  return { state: 'available' as const, bookingCount: 0, hasBlock: false };
}
