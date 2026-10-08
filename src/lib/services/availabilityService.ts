import { createClient } from '@/lib/supabase/client';
import type { AvailabilityBlock, BookingPhotoRecord } from '@/types';
import { rangesOverlap } from '@/lib/bookingAvailability';
import { adminErrorMessage, reportError, userErrorMessage } from '@/lib/reportError';
import {
  AVAILABILITY_KEY,
  getLocalAvailabilityBlocks,
  isDevelopment,
} from './bookingShared';

export async function hasOperationalPhotographer(): Promise<boolean> {
  const { data, error } = await createClient().rpc('has_operational_photographer');
  if (error) {
    reportError(error, { area: 'availability', operation: 'check-photographer' });
    throw new Error(userErrorMessage(error, 'Không thể kiểm tra trạng thái vận hành lúc này.'));
  }
  return data === true;
}

export async function getAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
  let failure: unknown;
  try {
    const { data, error } = await createClient().rpc('get_public_availability');
    if (!error && data) {
      return data.map((row: Omit<AvailabilityBlock, 'reason'>) => ({ ...row, reason: 'Khác' }));
    }
    failure = error;
  } catch (error) { failure = error; }
  reportError(failure, { area: 'availability', operation: 'read-public' });
  if (!isDevelopment) {
    throw new Error(userErrorMessage(failure, 'Không thể tải lịch nghỉ của thợ chụp.'));
  }
  return getLocalAvailabilityBlocks();
}

export async function getPhotographerAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
  try {
    const { data, error } = await createClient().from('availability').select('id,date,start_time,end_time,reason,created_at').in('status', ['blocked', 'off']).order('date').order('start_time');
    if (!error && data) return data as AvailabilityBlock[];
    if (error) reportError(error, { area: 'availability', operation: 'read-photographer' });
  } catch (error) {
    reportError(error, { area: 'availability', operation: 'read-photographer' });
    /* Use the public/local fallback below. */
  }
  return getAvailabilityBlocks();
}

export async function createAvailabilityBlocks(
  inputs: Array<Omit<AvailabilityBlock, 'id' | 'created_at'>>,
  existingBookings: BookingPhotoRecord[],
) {
  for (const input of inputs) {
    const range = `${input.start_time} - ${input.end_time}`;
    const conflict = existingBookings.find((booking) => booking.booking_date === input.date
      && ['confirmed', 'checked_in', 'shooting', 'completed'].includes(booking.status)
      && rangesOverlap(range, booking.booking_time));
    if (conflict) throw new Error(`Không thể chặn ca ${range}: khách ${conflict.customer_name} đã có booking được xác nhận.`);
  }
  const payload = inputs.map((input) => ({
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    reason: input.reason,
    status: 'blocked' as const,
  }));
  const { data, error } = await createClient().from('availability').insert(payload).select('id,date,start_time,end_time,reason,created_at');
  if (!error && data) return data as AvailabilityBlock[];
  if (error && (error.code === 'P0001' || /confirmed booking|booking.*confirmed/i.test(error.message))) {
    reportError(error, { area: 'availability', operation: 'create-blocks' });
    throw new Error('Không thể chặn lịch vì một trong các ca đã có booking được xác nhận.');
  }
  reportError(error, { area: 'availability', operation: 'create-blocks' });
  if (!isDevelopment) {
    throw new Error(adminErrorMessage(error, 'Không thể chặn lịch.'));
  }
  const now = Date.now();
  const blocks: AvailabilityBlock[] = inputs.map((input, index) => ({
    ...input,
    id: `block_${now}_${index}`,
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify([...blocks, ...getLocalAvailabilityBlocks()]));
  return blocks;
}

export async function removeAvailabilityBlock(id: string) {
  const { error } = await createClient().from('availability').delete().eq('id', id);
  if (!error) return;
  reportError(error, { area: 'availability', operation: 'remove-block' });
  if (!isDevelopment) {
    throw new Error(adminErrorMessage(error, 'Không thể gỡ lịch chặn.'));
  }
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(getLocalAvailabilityBlocks().filter((block) => block.id !== id)));
}
