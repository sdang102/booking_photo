import type { AvailabilityBlock, BookingPhotoRecord, BookingStatus } from '@/types';

export const TABLE_NAME = 'bookings';
export const BOOKING_SELECT = 'id,created_at,customer_name,customer_phone,customer_email,service_id,service_name_snapshot,shoot_date,start_time,end_time,shoot_address,customer_note,photographer_note,status,payment_status,total_price,deposit_amount,user_id,photographer_id';
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in', 'shooting'];
export const LOCAL_BOOKINGS_KEY = 'photo_bookings_v3';
export const AVAILABILITY_KEY = 'photo_availability_blocks_v1';
export const isDevelopment = process.env.NODE_ENV !== 'production';

const SEED_BOOKINGS: BookingPhotoRecord[] = [
  {
    id: 'bk_seed_001', created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    customer_name: 'Nguyễn Thùy Linh', customer_phone: '0912 345 678', customer_email: 'thuylinh.nguyen@gmail.com',
    service_id: 's-wedding', service_title: 'Chụp Ảnh Cưới & Pre-Wedding Nghệ Thuật',
    booking_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], booking_time: '08:30 - 10:30',
    location_type: 'outdoor', notes: 'Concept hoàng hôn lãng mạn tại bến Bạch Đằng và phim trường', status: 'confirmed',
    addon_services: ['addon-makeup-vip', 'addon-express'], total_price: 10000000, deposit_amount: 0,
  },
  {
    id: 'bk_seed_002', created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    customer_name: 'Trần Minh Hoàng', customer_phone: '0988 765 432', customer_email: 'hoang.tran@fintech.vn',
    service_id: 's-portrait', service_title: 'Profile Doanh Nhân & Chân Dung Nghệ Thuật',
    booking_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], booking_time: '13:30 - 15:30',
    location_type: 'studio', notes: 'Chụp phông xám và đen, phục vụ bài viết Forbes Vietnam', status: 'confirmed',
    addon_services: ['addon-express'], total_price: 2300000, deposit_amount: 0,
  },
  {
    id: 'bk_seed_003', created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    customer_name: 'Phạm Quỳnh Anh', customer_phone: '0903 112 233', customer_email: 'quynhanh.pham@gmail.com',
    service_id: 's-concept', service_title: 'Concept Nàng Thơ & Vintage Cinematic',
    booking_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], booking_time: '15:30 - 17:30',
    location_type: 'studio', notes: 'Tone màu phim Hong Kong vintage, hoa cúc mẫu đơn', status: 'completed',
    addon_services: ['addon-costume'], total_price: 2950000, deposit_amount: 0,
  },
  {
    id: 'bk_seed_004', created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    customer_name: 'Lê Hoàng Nam', customer_phone: '0934 998 877', customer_email: 'nam.le@gmail.com',
    service_id: 's-family', service_title: 'Kỷ Niệm Gia Đình & Mẹ Bầu / Bé Yêu',
    booking_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], booking_time: '10:30 - 12:30',
    location_type: 'studio', notes: 'Gia đình 4 người, có 2 bé sinh đôi 3 tuổi', status: 'pending',
    addon_services: ['addon-album'], total_price: 4000000, deposit_amount: 0,
  },
];

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

export function mapBookingRow(row: Record<string, unknown>): BookingPhotoRecord {
  const start = String(row.start_time ?? '').slice(0, 5);
  const end = String(row.end_time ?? '').slice(0, 5);
  return {
    id: String(row.id), created_at: String(row.created_at), customer_name: String(row.customer_name),
    customer_phone: String(row.customer_phone), customer_email: String(row.customer_email),
    service_id: String(row.service_id ?? ''), service_title: String(row.service_name_snapshot ?? ''),
    booking_date: String(row.shoot_date), booking_time: `${start} - ${end}`,
    location_type: 'outdoor', shoot_address: row.shoot_address ? String(row.shoot_address) : undefined,
    notes: row.customer_note ? String(row.customer_note) : undefined,
    photographer_note: row.photographer_note ? String(row.photographer_note) : undefined,
    status: row.status as BookingPhotoRecord['status'], payment_status: row.payment_status as BookingPhotoRecord['payment_status'],
    addon_services: [], total_price: Number(row.total_price), deposit_amount: Number(row.deposit_amount),
    user_id: row.user_id ? String(row.user_id) : undefined,
    photographer_id: row.photographer_id ? String(row.photographer_id) : undefined,
  };
}

export function getLocalAvailabilityBlocks(): AvailabilityBlock[] {
  if (!isDevelopment || typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(AVAILABILITY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
