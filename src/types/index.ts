export interface Service {
  id: string;
  title: string;
  slug: string;
  category: 'wedding' | 'portrait' | 'concept' | 'family' | 'event';
  description: string;
  price: number;
  duration_minutes: number;
  features: string[];
  image_url: string;
  is_popular?: boolean;
  edited_photos?: number;
  concept_count?: number;
  location_count?: string;
}

export type PortfolioCategory = 'couple' | 'portrait' | 'pre-wedding' | 'family' | 'event' | 'concept';

export interface PortfolioImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  alt: string;
  width: number;
  height: number;
}

export interface PortfolioAlbum {
  id: string;
  slug: string;
  title: string;
  category: PortfolioCategory;
  location?: string;
  shoot_date?: string;
  cover_url: string;
  mobile_cover_url?: string;
  images: PortfolioImage[];
}

export interface ShootingLocation {
  id: string;
  name: string;
  area: string;
  description: string;
  travel_fee: number;
  image_url: string;
}

export type AvailabilityStatus = 'available' | 'limited' | 'booked' | 'off';

export interface ExperienceReview {
  id: string;
  booking_id: string;
  user_id?: string;
  customer_name: string;
  avatar_url?: string;
  rating: number;
  comment: string;
  service_title: string;
  portfolio_slug?: string;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  content: Record<string, unknown>;
  is_visible: boolean;
  display_order: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface Photographer {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  rating: number;
  review_count: number;
  experience_years: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  roles: AppRole[];
}

export type AppRole = 'user' | 'photographer' | 'admin';
export type Permission =
  | 'booking:self:read' | 'booking:create' | 'review:create'
  | 'booking:all:read' | 'booking:status:update' | 'availability:manage'
  | 'customer:manage' | 'service:manage' | 'portfolio:manage'
  | 'review:manage' | 'payment:manage' | 'revenue:read' | 'settings:manage';

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'shooting' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';

export interface BookingPhotoRecord {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_id: string;
  service_title: string;
  booking_date: string;
  booking_time: string;
  location_type: 'studio' | 'outdoor';
  shoot_address?: string;
  notes?: string;
  photographer_note?: string;
  status: BookingStatus;
  payment_status?: PaymentStatus;
  addon_services: string[];
  total_price: number;
  deposit_amount: number;
  user_id?: string;
  photographer_id?: string;
}

export interface BookingFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_id: string;
  service_title: string;
  booking_date: string;
  booking_time: string;
  location_type: 'studio' | 'outdoor';
  shoot_address: string;
  notes: string;
  addon_services: string[];
  total_price: number;
  user_id?: string;
}

export interface AddonOption {
  id: string;
  title: string;
  price: number;
  description: string;
}

export interface ServiceAddon {
  id: string;
  title: string;
  description: string;
  price: number;
  price_label: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  totalDeposit: number;
  lastBookingDate?: string;
  recentStatus?: string;
  notes?: string;
}

export interface PublicScheduleItem {
  id: string;
  booking_date: string;
  booking_time: string;
  service_title: string;
  status: BookingStatus;
  location_type: 'studio' | 'outdoor';
}

export interface AvailabilityBlock {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: 'Nghỉ' | 'Việc cá nhân' | 'Không nhận lịch' | 'Khác';
  created_at: string;
}
