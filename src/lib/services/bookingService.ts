import { createClient } from '@/lib/supabase/client';
import { MOCK_SERVICES } from '@/lib/data/mockData';
import { Service, BookingFormData, BookingPhotoRecord, PublicScheduleItem, BookingStatus, AvailabilityBlock } from '@/types';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import { isRangeAvailable, rangesOverlap } from '@/lib/bookingAvailability';

const TABLE_NAME = 'bookings';
const BOOKING_SELECT = 'id,created_at,customer_name,customer_phone,customer_email,service_id,service_name_snapshot,shoot_date,start_time,end_time,shoot_address,customer_note,photographer_note,status,payment_status,total_price,deposit_amount,user_id,photographer_id';
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in', 'shooting'];
const LOCAL_BOOKINGS_KEY = 'photo_bookings_v3';
const isDevelopment = process.env.NODE_ENV !== 'production';

export interface BookingRevenueSummary {
  total: number;
  realized: number;
  atVenue: number;
  activeCount: number;
}

export interface BookingFinancialRecord {
  id: string;
  booking_date: string;
  service_title: string;
  total_price: number;
  payment_status?: string;
  status: BookingStatus;
}

// Sample seed bookings for realistic demo and testing if storage is fresh
const SEED_BOOKINGS: BookingPhotoRecord[] = [
  {
    id: 'bk_seed_001',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    customer_name: 'Nguyễn Thùy Linh',
    customer_phone: '0912 345 678',
    customer_email: 'thuylinh.nguyen@gmail.com',
    service_id: 's-wedding',
    service_title: 'Chụp Ảnh Cưới & Pre-Wedding Nghệ Thuật',
    booking_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    booking_time: '08:30 - 10:30',
    location_type: 'outdoor',
    notes: 'Concept hoàng hôn lãng mạn tại bến Bạch Đằng và phim trường',
    status: 'confirmed',
    addon_services: ['addon-makeup-vip', 'addon-express'],
    total_price: 10000000,
    deposit_amount: 0,
  },
  {
    id: 'bk_seed_002',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    customer_name: 'Trần Minh Hoàng',
    customer_phone: '0988 765 432',
    customer_email: 'hoang.tran@fintech.vn',
    service_id: 's-portrait',
    service_title: 'Profile Doanh Nhân & Chân Dung Nghệ Thuật',
    booking_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    booking_time: '13:30 - 15:30',
    location_type: 'studio',
    notes: 'Chụp phông xám và đen, phục vụ bài viết Forbes Vietnam',
    status: 'confirmed',
    addon_services: ['addon-express'],
    total_price: 2300000,
    deposit_amount: 0,
  },
  {
    id: 'bk_seed_003',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    customer_name: 'Phạm Quỳnh Anh',
    customer_phone: '0903 112 233',
    customer_email: 'quynhanh.pham@gmail.com',
    service_id: 's-concept',
    service_title: 'Concept Nàng Thơ & Vintage Cinematic',
    booking_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    booking_time: '15:30 - 17:30',
    location_type: 'studio',
    notes: 'Tone màu phim Hong Kong vintage, hoa cúc mẫu đơn',
    status: 'completed',
    addon_services: ['addon-costume'],
    total_price: 2950000,
    deposit_amount: 0,
  },
  {
    id: 'bk_seed_004',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    customer_name: 'Lê Hoàng Nam',
    customer_phone: '0934 998 877',
    customer_email: 'nam.le@gmail.com',
    service_id: 's-family',
    service_title: 'Kỷ Niệm Gia Đình & Mẹ Bầu / Bé Yêu',
    booking_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    booking_time: '10:30 - 12:30',
    location_type: 'studio',
    notes: 'Gia đình 4 người, có 2 bé sinh đôi 3 tuổi',
    status: 'pending',
    addon_services: ['addon-album'],
    total_price: 4000000,
    deposit_amount: 0,
  },
];

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .select('id,name,slug,description,short_description,price,duration_minutes,features,cover_image,is_featured,edited_photo_count,concept_count,location_count,categories(slug)')
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const category = Array.isArray(row.categories) ? row.categories[0] : row.categories as { slug?: string } | null;
        return {
          id: row.id, title: row.name, slug: row.slug,
          category: category?.slug ?? 'portrait',
          description: row.description ?? row.short_description ?? '', price: Number(row.price),
          duration_minutes: row.duration_minutes, features: Array.isArray(row.features) ? row.features : [],
          image_url: row.cover_image ?? '', is_popular: row.is_featured,
          edited_photos: row.edited_photo_count, concept_count: row.concept_count,
          location_count: row.location_count ? String(row.location_count) : undefined,
        };
      }) as Service[];
    }
  } catch (err) {
    console.warn('Using mock services due to Supabase connection:', err);
  }
  return isDevelopment ? MOCK_SERVICES : [];
}

// 1. Tạo mới lịch đặt vào bảng booking_photo (Supabase & Local)
export async function createBookingPhoto(
  booking: BookingFormData
): Promise<{ success: boolean; data?: BookingPhotoRecord; message?: string }> {
  const normalizedPhone = normalizeVietnameseMobile(booking.customer_phone);
  if (!normalizedPhone) return { success: false, message: VIETNAMESE_MOBILE_ERROR };

  const [allBookings, availabilityBlocks] = await Promise.all([getPublicSchedule(), getAvailabilityBlocks()]);
  if (!isRangeAvailable(booking.booking_date, booking.booking_time, allBookings, availabilityBlocks)) {
    return {
      success: false,
      message: `Khung giờ ${booking.booking_time} vào ngày ${booking.booking_date} đã có người giữ chỗ, bị thợ khóa hoặc không còn hợp lệ. Vui lòng chọn giờ khác.`,
    };
  }

  const [startTime, endTime] = booking.booking_time.replace(/\s*\(.+\)$/, '').split('-').map((part) => part.trim());
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([payload])
      .select(BOOKING_SELECT)
      .single();

    if (!error && data) {
      const record = mapBookingRow(data);
      return { success: true, data: record };
    } else if (error) {
      const isScheduleConflict = ['23P01','23514','P0001'].includes(error.code ?? '')
        || /overlap|unavailable|past|working hours/i.test(error.message);
      return {
        success:false,
        message:isScheduleConflict
          ? 'Một khách khác vừa giữ khung giờ này hoặc thợ đã khóa lịch. Dữ liệu lịch đã được cập nhật, vui lòng chọn giờ khác.'
          : `Không thể lưu booking: ${error.message}`,
      };
    }
  } catch (err) {
    console.warn('Error inserting booking into Supabase:', err);
    return { success:false, message:'Không thể kết nối database để giữ chỗ. Vui lòng kiểm tra mạng và thử lại.' };
  }
  return { success:false, message:'Không thể lưu booking vào database. Vui lòng thử lại.' };
}

// RLS quyết định phạm vi: photographer chỉ thấy lịch được giao, admin chỉ dùng cho báo cáo.
interface BookingQueryOptions {
  fromDate?: string;
  statuses?: BookingStatus[];
  limit?: number;
  offset?: number;
}

export async function getAllBookings({ fromDate, statuses, limit = 200, offset = 0 }: BookingQueryOptions = {}): Promise<BookingPhotoRecord[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from(TABLE_NAME)
      .select(BOOKING_SELECT)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fromDate) query = query.gte('shoot_date', fromDate);
    if (statuses?.length) query = query.in('status', statuses);
    const { data, error } = await query;

    if (!error && data) {
      return data.map(mapBookingRow);
    }
  } catch (err) {
    console.warn('Error fetching all bookings from Supabase:', err);
  }
  return isDevelopment ? getLocalBookings() : [];
}

export async function getBookingFinancialRecords({ limit = 50, offset = 0 }: Pick<BookingQueryOptions, 'limit' | 'offset'> = {}): Promise<BookingFinancialRecord[]> {
  const { data, error } = await createClient()
    .from(TABLE_NAME)
    .select('id,shoot_date,service_name_snapshot,total_price,payment_status,status')
    .neq('status', 'cancelled')
    .order('shoot_date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    booking_date: String(row.shoot_date),
    service_title: String(row.service_name_snapshot),
    total_price: Number(row.total_price),
    payment_status: String(row.payment_status),
    status: row.status as BookingStatus,
  }));
}

export async function getBookingRevenueSummary(): Promise<BookingRevenueSummary> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_admin_booking_revenue_summary');
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row) {
    const value = row as Record<string, unknown>;
    return {
      total: Number(value.total_active ?? 0),
      realized: Number(value.realized ?? 0),
      atVenue: Number(value.at_venue ?? 0),
      activeCount: Number(value.active_count ?? 0),
    };
  }

  // Backward-compatible while the Phase 1 migration is waiting to be applied.
  const records: BookingFinancialRecord[] = [];
  const batchSize = 1_000;
  for (let offset = 0; ; offset += batchSize) {
    const batch = await getBookingFinancialRecords({ limit: batchSize, offset });
    records.push(...batch);
    if (batch.length < batchSize) break;
  }
  const completed = records.filter((item) => item.status === 'completed');
  const atVenue = records.filter((item) => item.status !== 'completed');
  return {
    total: records.reduce((sum, item) => sum + item.total_price, 0),
    realized: completed.reduce((sum, item) => sum + item.total_price, 0),
    atVenue: atVenue.reduce((sum, item) => sum + item.total_price, 0),
    activeCount: atVenue.length,
  };
}

// 3. Lấy lịch đặt của riêng người dùng hiện tại
export async function getUserBookings(
  userId?: string,
  email?: string,
  { activeOnly = false, limit = 50 }: { activeOnly?: boolean; limit?: number } = {},
): Promise<BookingPhotoRecord[]> {
  try {
    const supabase = createClient();
    let query = supabase.from(TABLE_NAME).select(BOOKING_SELECT).order('created_at', { ascending: false }).limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('customer_email', email);
    }
    if (activeOnly) query = query.in('status', ACTIVE_BOOKING_STATUSES);

    const { data, error } = await query;
    if (!error && data) {
      return data.map(mapBookingRow);
    }
  } catch (err) {
    console.warn('Error fetching user bookings from Supabase:', err);
  }

  // Filter local
  if (!isDevelopment) return [];
  let locals = getLocalBookings();
  if (userId) locals = locals.filter((booking) => booking.user_id === userId || (email && booking.customer_email.toLowerCase() === email.toLowerCase()));
  else if (email) locals = locals.filter((booking) => booking.customer_email.toLowerCase() === email.toLowerCase());
  if (activeOnly) locals = locals.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  return locals.slice(0, limit);
}

export async function getActiveUserBookingCount(userId: string): Promise<number> {
  const { count, error } = await createClient()
    .from(TABLE_NAME)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ACTIVE_BOOKING_STATUSES);
  if (error) return 0;
  return count ?? 0;
}

// 4. Cập nhật trạng thái lịch chụp (xác nhận, hoàn thành, hủy)
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  actor: 'admin' | 'photographer' = 'photographer'
): Promise<boolean> {
  try {
    const supabase = createClient();
    if (actor === 'photographer') {
      const { error } = await supabase.rpc('photographer_advance_booking', { target_id: bookingId, new_status: newStatus, note: null });
      return !error;
    }
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      updateLocalStatus(bookingId, newStatus);
      return true;
    }
  } catch (err) {
    console.warn('Error updating status in Supabase:', err);
  }

  if (isDevelopment) { updateLocalStatus(bookingId, newStatus); return true; }
  return false;
}

// 6. Lịch chụp công khai để khách xem (KHÔNG chứa thông tin cá nhân, KHÔNG mật khẩu)
export async function getPublicSchedule(): Promise<PublicScheduleItem[]> {
  try {
    const { data, error } = await createClient().rpc('get_public_booking_schedule');
    if (!error && data) return data.map((row: Record<string, unknown>) => ({
      id:String(row.id), booking_date:String(row.booking_date), booking_time:String(row.booking_time),
      service_title:String(row.service_title), status:row.status as BookingStatus,
      location_type:(row.location_type === 'outdoor' ? 'outdoor' : 'studio') as 'studio'|'outdoor',
    }));
  } catch { /* Migration may not be applied yet. */ }
  return isDevelopment ? getLocalBookings().filter((b) => b.status !== 'cancelled').map((b) => ({ id:b.id,booking_date:b.booking_date,booking_time:b.booking_time,service_title:b.service_title,status:b.status,location_type:b.location_type })) : [];
}

function updateLocalStatus(id: string, status: BookingStatus) {
  if (typeof window === 'undefined') return;
  const list = getLocalBookings();
  const item = list.find((b) => b.id === id);
  if (item) {
    item.status = status;
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(list));
  }
}

export async function getBookingById(id: string) {
  const { data, error } = await createClient().from(TABLE_NAME).select(BOOKING_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapBookingRow(data);
}

export async function updatePhotographerNote(bookingId:string,note:string){
  const {data,error}=await createClient().rpc('update_photographer_note',{p_booking_id:bookingId,p_note:note});
  return !error&&Boolean(data);
}

const AVAILABILITY_KEY = 'photo_availability_blocks_v1';

function getLocalAvailabilityBlocks(): AvailabilityBlock[] {
  if (!isDevelopment || typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(AVAILABILITY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// Booking availability is public schedule data. Always use the public RPC for
// visitors and signed-in customers alike; a signed-in customer cannot select
// the protected availability table directly because of RLS.
export async function getAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
  try {
    const {data,error}=await createClient().rpc('get_public_availability');
    if(!error&&data)return data as AvailabilityBlock[];
  } catch { /* Development fallback. */ }
  return getLocalAvailabilityBlocks();
}

// The photographer workspace needs the role-protected rows so it can remove
// its own blocks. Keep this separate from the public booking read above.
export async function getPhotographerAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
  try {
    const {data,error}=await createClient().from('availability').select('id,date,start_time,end_time,reason,created_at').in('status',['blocked','off']).order('date').order('start_time');
    if(!error&&data)return data as AvailabilityBlock[];
  } catch { /* Use the public/local fallback below. */ }
  return getAvailabilityBlocks();
}

export async function createAvailabilityBlocks(
  inputs: Array<Omit<AvailabilityBlock, 'id' | 'created_at'>>,
  existingBookings: BookingPhotoRecord[],
) {
  for (const input of inputs) {
    const range = `${input.start_time} - ${input.end_time}`;
    const conflict = existingBookings.find((booking) => booking.booking_date === input.date
      && ['confirmed','checked_in','shooting','completed'].includes(booking.status)
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
    throw new Error('Không thể chặn lịch vì một trong các ca đã có booking được xác nhận.');
  }
  if (!isDevelopment) throw error ?? new Error('Không thể chặn lịch.');
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
  if (!isDevelopment) throw error;
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(getLocalAvailabilityBlocks().filter((block) => block.id !== id)));
}

export function getLocalBookings(): BookingPhotoRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    if (!stored) {
      const initial = process.env.NEXT_PUBLIC_USE_DEMO_BOOKINGS === 'true' ? SEED_BOOKINGS : [];
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapBookingRow(row: Record<string, unknown>): BookingPhotoRecord {
  const start = String(row.start_time ?? '').slice(0, 5);
  const end = String(row.end_time ?? '').slice(0, 5);
  return {
    id: String(row.id), created_at: String(row.created_at), customer_name: String(row.customer_name),
    customer_phone: String(row.customer_phone), customer_email: String(row.customer_email),
    service_id: String(row.service_id ?? ''), service_title: String(row.service_name_snapshot ?? ''),
    booking_date: String(row.shoot_date), booking_time: `${start} - ${end}`,
    location_type: 'outdoor', shoot_address:row.shoot_address ? String(row.shoot_address) : undefined,
    notes: row.customer_note ? String(row.customer_note) : undefined,
    photographer_note: row.photographer_note ? String(row.photographer_note) : undefined,
    status: row.status as BookingPhotoRecord['status'], payment_status: row.payment_status as BookingPhotoRecord['payment_status'],
    addon_services: [], total_price: Number(row.total_price), deposit_amount: Number(row.deposit_amount),
    user_id: row.user_id ? String(row.user_id) : undefined,
    photographer_id: row.photographer_id ? String(row.photographer_id) : undefined,
  };
}
