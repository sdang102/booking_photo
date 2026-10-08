import { describe, expect, it } from 'vitest';
import { normalizeVietnameseMobile } from '../src/lib/phone';
import { BOOKING_SHIFTS, getBookingDayState, isRangeAvailable, isWithinBookingWindow, rangesOverlap } from '../src/lib/bookingAvailability';
import { getCatalogFallbackServices, mapServiceRow } from '../src/lib/services/serviceCatalog';
import { normalizeRoles } from '../src/lib/auth/permissions';
import { getReviewPageCursor } from '../src/lib/reviewPagination';
import { normalizeRevenueDateRange } from '../src/lib/revenueRange';
import { validateAdminPayload } from '../src/lib/adminValidation';
import { isAccountDisabled, validateAccountInput } from '../src/lib/adminAccounts';
import type { PublicScheduleItem } from '../src/types';

const NOW = new Date('2026-01-10T05:00:00.000Z');
const booking = (time: string, status: PublicScheduleItem['status'] = 'confirmed'): PublicScheduleItem => ({
  id: time, booking_date: '2026-01-11', booking_time: time, service_title: 'Gói thử', status, location_type: 'studio',
});

describe('phone normalization', () => {
  it('accepts separators and +84 while returning canonical digits', () => {
    expect(normalizeVietnameseMobile(' +84 912-345-678 ')).toBe('0912345678');
    expect(normalizeVietnameseMobile('0123 456 789')).toBeNull();
  });
});

describe('booking availability', () => {
  it('detects overlap and honors all three shifts', () => {
    expect(rangesOverlap('08:30 - 10:30', '10:00 - 11:00')).toBe(true);
    expect(rangesOverlap('08:30 - 10:30', '10:30 - 11:30')).toBe(false);
    expect(BOOKING_SHIFTS).toHaveLength(3);
    expect(isRangeAvailable('2026-01-11', '18:00 - 20:00', [booking('08:30 - 10:30')], [], NOW)).toBe(true);
  });

  it('enforces the two-booking day limit and 90-day window', () => {
    expect(getBookingDayState('2026-01-11', [booking('08:30 - 10:30'), booking('13:30 - 15:30')], [], NOW).state).toBe('booked');
    expect(isWithinBookingWindow('2026-04-10', NOW)).toBe(true);
    expect(isWithinBookingWindow('2026-04-11', NOW)).toBe(false);
    expect(isRangeAvailable('2026-04-11', '08:30 - 10:30', [], [], NOW)).toBe(false);
  });
});

describe('service catalog mapping', () => {
  it('maps legacy rows and keeps fallback packages complete', () => {
    const mapped = mapServiceRow({ id: 'legacy', name: 'Old', slug: 'vintage-concept', price: 1, duration_minutes: 1 }, 0);
    expect(mapped?.slug).toBe('signature');
    expect(mapped?.outfit_count).toBe(2);
    expect(getCatalogFallbackServices()).toHaveLength(3);
  });
});

describe('roles and pagination', () => {
  it('normalizes legacy role aliases without dropping admin or photographer', () => {
    expect(normalizeRoles('photographer_admin')).toEqual(['admin', 'photographer']);
    expect(normalizeRoles(['admin', 'admin', 'unknown'])).toEqual(['admin']);
  });

  it('returns a cursor only for a full review page', () => {
    expect(getReviewPageCursor([{ created_at: '2026-01-02', id: 'b' }], 1)).toEqual({ created_at: '2026-01-02', id: 'b' });
    expect(getReviewPageCursor([{ created_at: '2026-01-02', id: 'b' }], 2)).toBeNull();
  });
});

describe('revenue date range and admin validation', () => {
  it('normalizes reversed ranges and rejects malformed dates', () => {
    expect(normalizeRevenueDateRange('2026-03-01', '2026-01-01')).toEqual({ fromDate: '2026-01-01', toDate: '2026-03-01' });
    expect(normalizeRevenueDateRange('bad', '2026-01-01')).toEqual({ fromDate: undefined, toDate: '2026-01-01' });
  });

  it('rejects unsafe admin values before submit', () => {
    expect(validateAdminPayload('services', { price: -1, slug: 'Bad Slug' })).toContain('không âm');
    expect(validateAdminPayload('services', { price: 100, duration_minutes: 90, slug: 'portrait-basic' })).toBeNull();
  });
});

describe('admin account validation', () => {
  it('normalizes account fields and rejects missing roles', () => {
    const result = validateAccountInput({ email: ' ADMIN@Example.com ', fullName: ' Admin Photo ', phone: '+84 912-345-678', password: 'password1', roles: ['admin', 'photographer', 'bad'] }, true);
    expect(result.data).toEqual({ email: 'admin@example.com', fullName: 'Admin Photo', phone: '0912345678', password: 'password1', roles: ['admin', 'photographer'] });
    expect(validateAccountInput({ email: 'a@example.com', fullName: 'Admin', phone: '', roles: [] }, false).error).toContain('vai trò');
    expect(validateAccountInput({ email: 'a@example.com', fullName: 'Admin', phone: '', roles: ['admin'] }, false).error).toContain('bắt buộc');
  });

  it('detects only bans that are still active', () => {
    expect(isAccountDisabled('2027-01-01T00:00:00Z', Date.parse('2026-01-01T00:00:00Z'))).toBe(true);
    expect(isAccountDisabled('2025-01-01T00:00:00Z', Date.parse('2026-01-01T00:00:00Z'))).toBe(false);
  });
});
