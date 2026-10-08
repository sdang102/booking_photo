import { createClient } from '@/lib/supabase/client';
import type { BookingFormData, BookingPhotoRecord, BookingStatus } from '@/types';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import { reportError, userErrorMessage } from '@/lib/reportError';
import {
  BOOKING_SELECT,
  getLocalBookings,
  isDevelopment,
  LOCAL_BOOKINGS_KEY,
  mapBookingRow,
  TABLE_NAME,
} from './bookingShared';

export async function createBookingPhoto(
  booking: BookingFormData,
): Promise<{ success: boolean; data?: BookingPhotoRecord; message?: string }> {
  const normalizedPhone = normalizeVietnameseMobile(booking.customer_phone);
  if (!normalizedPhone) return { success: false, message: VIETNAMESE_MOBILE_ERROR };
  const [startTime, endTime] = booking.booking_time.replace(/\s*\(.+\)$/, '').split('-').map((part) => part.trim());
  try {
    const { data: slotAvailable, error: slotError } = await createClient().rpc('check_booking_slot', {
      target_date: booking.booking_date,
      target_start_time: startTime,
      target_photographer_id: null,
    });
    if (slotError) reportError(slotError, { area: 'booking', operation: 'check-slot' });
    if (!slotError && slotAvailable === false) {
      return { success: false, message: `Khung giờ ${booking.booking_time} vào ngày ${booking.booking_date} đã có người giữ chỗ, bị thợ khóa hoặc không còn hợp lệ. Vui lòng chọn giờ khác.` };
    }
  } catch (error) {
    reportError(error, { area: 'booking', operation: 'check-slot' });
    // The insert-side trigger remains authoritative while this RPC is pending deployment.
  }
  const payload = {
    user_id: booking.user_id || null,
    service_id: booking.service_id,
    customer_name: booking.customer_name,
    customer_phone: normalizedPhone,
    customer_email: booking.customer_email,
    shoot_address: booking.shoot_address,
    shoot_date: booking.booking_date,
    start_time: startTime,
    end_time: endTime,
    customer_note: booking.notes,
    status: 'pending' as const,
    payment_status: 'unpaid' as const,
  };

  try {
    const { data, error } = await createClient().from(TABLE_NAME).insert([payload]).select(BOOKING_SELECT).single();
    if (!error && data) return { success: true, data: mapBookingRow(data) };
    if (error) {
      reportError(error, { area: 'booking', operation: 'create' });
      const isScheduleConflict = ['23P01', '23514', 'P0001'].includes(error.code ?? '') || /overlap|unavailable|past|working hours/i.test(error.message);
      return {
        success: false,
        message: isScheduleConflict
          ? 'Một khách khác vừa giữ khung giờ này hoặc thợ đã khóa lịch. Dữ liệu lịch đã được cập nhật, vui lòng chọn giờ khác.'
          : userErrorMessage(error, 'Không thể lưu yêu cầu đặt lịch. Vui lòng thử lại.'),
      };
    }
  } catch (err) {
    reportError(err, { area: 'booking', operation: 'create' });
    return { success: false, message: userErrorMessage(err, 'Không thể lưu yêu cầu đặt lịch. Vui lòng thử lại.') };
  }
  return { success: false, message: 'Không thể lưu booking vào database. Vui lòng thử lại.' };
}

export async function updateBookingStatus(bookingId: string, newStatus: BookingStatus): Promise<boolean> {
  try {
    const { error } = await createClient().rpc('photographer_advance_booking', { target_id: bookingId, new_status: newStatus, note: null });
    if (error) reportError(error, { area: 'booking', operation: 'update-status' });
    return !error;
  } catch (err) {
    reportError(err, { area: 'booking', operation: 'update-status' });
  }
  if (isDevelopment) {
    updateLocalStatus(bookingId, newStatus);
    return true;
  }
  return false;
}

export async function updatePhotographerNote(bookingId: string, note: string) {
  try {
    const { data, error } = await createClient().rpc('update_photographer_note', { p_booking_id: bookingId, p_note: note });
    if (error) reportError(error, { area: 'booking', operation: 'update-photographer-note' });
    return !error && Boolean(data);
  } catch (error) {
    reportError(error, { area: 'booking', operation: 'update-photographer-note' });
    return false;
  }
}

function updateLocalStatus(id: string, status: BookingStatus) {
  if (typeof window === 'undefined') return;
  const list = getLocalBookings();
  const item = list.find((booking) => booking.id === id);
  if (item) {
    item.status = status;
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(list));
  }
}
