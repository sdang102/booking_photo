'use client';

import React, { useEffect, useState } from 'react';
import { BookingPhotoRecord } from '@/types';
import { formatVND } from './ServiceCard';
import { useAuth } from '@/lib/context/AuthContext';
import { X, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import ReviewForm from './ReviewForm';
import { getReviews } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';
import BookingStatusBadge from '@/components/photographer/BookingStatusBadge';

interface MyBookingsModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  bookings: BookingPhotoRecord[];
  onNewBooking: () => void;
  onOpenAuth: () => void;
}

export default function MyBookingsModal({
  isOpen,
  isLoading = false,
  onClose,
  bookings,
  onNewBooking,
  onOpenAuth,
}: MyBookingsModalProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<BookingPhotoRecord | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    getReviews().then((items) => { setReviews(items); setReviewsLoaded(true); });
  }, [isOpen]);
  if (!isOpen) return null;

  // Filter bookings for the active user if logged in
  const userBookings = (user
    ? bookings.filter(
        (b) =>
          b.user_id === user.id ||
          b.customer_email.toLowerCase() === user.email.toLowerCase()
        )
    : []).filter((booking) =>
      booking.status !== 'cancelled' &&
      (booking.status !== 'completed' || (reviewsLoaded && !reviews.some((review) => review.booking_id === booking.id)))
    );

  return (
    <div className="my-bookings-backdrop fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="my-bookings-dialog relative w-full max-w-2xl bg-elevated border border-sky-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[85dvh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-sky-200 flex items-center justify-between bg-background sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lịch Chụp Của Tôi</h3>
              <p className="text-xs text-slate-600">
                {user ? `Lịch đã đặt theo tài khoản ${user.email}` : 'Theo dõi tiến trình các buổi chụp của bạn'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Logged In Warning */}
        {!user && (
          <div className="px-5 py-3 bg-sky-950/30 border-b border-sky-900/30 flex items-center justify-between text-xs text-sky-700">
            <span>Bạn chưa đăng nhập. Đăng nhập để đồng bộ và xem đầy đủ lịch của bạn.</span>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
                className="px-2.5 py-1 rounded bg-brand text-brand-contrast font-bold hover:bg-brand-hover cursor-pointer shadow-sm"
            >
              Đăng Nhập
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-600">Đang tải lịch của bạn…</div>
          ) : userBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-sky-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Bạn chưa có lịch chụp nào</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Hãy đặt lịch Luxury Portrait để giữ khung giờ phù hợp và bắt đầu chuẩn bị moodboard dành riêng cho bạn.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewBooking();
                }}
                className="mt-5 sky-button px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Đặt Lịch Ngay</span>
              </button>
            </div>
          ) : (
            userBookings.map((booking) => {
              return (
                <div
                  key={booking.id}
                  className="p-4 rounded-xl bg-elevated/70 border border-sky-200 hover:border-sky-600/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-600 block uppercase">
                        Mã #{booking.id.slice(-6).toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {booking.service_title}
                      </h4>
                    </div>

                    <BookingStatusBadge status={booking.status}/>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-sky-200">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>{booking.booking_date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>{booking.booking_time}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>{booking.shoot_address||'Ngoại cảnh'}</span>
                    </div>

                    <div className="text-right font-bold text-sky-400">
                      <span>{formatVND(booking.total_price)}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="p-2 rounded bg-elevated/50 text-[11px] text-slate-600 border border-sky-950/30">
                      Ghi chú: {booking.notes}
                    </div>
                  )}
                  {booking.status === 'completed' && (
                    reviews.some((review) => review.booking_id === booking.id) ? (
                      <div className="flex items-center justify-between border-t border-sky-100 pt-3 text-xs"><span className="font-semibold text-emerald-700">✓ Bạn đã đánh giá</span><a href="/reviews" className="font-bold text-sky-700">Xem đánh giá</a></div>
                    ) : (
                      <button onClick={() => setReviewBooking(booking)} className="w-full rounded-xl border border-sky-300 px-4 py-2.5 text-xs font-bold text-sky-700">Đánh Giá Trải Nghiệm</button>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sky-200 bg-background flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Tổng cộng: <strong className="text-slate-900">{userBookings.length} lịch hẹn</strong>
          </span>

          <button
            onClick={() => {
              onClose();
              onNewBooking();
            }}
            className="sky-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đặt Thêm Lịch Mới</span>
          </button>
        </div>

      </div>
      {reviewBooking && <ReviewForm booking={reviewBooking} userId={user?.id} onClose={() => setReviewBooking(null)} onSuccess={() => { setReviewBooking(null); getReviews().then((items) => { setReviews(items); setReviewsLoaded(true); }); }} />}
    </div>
  );
}

