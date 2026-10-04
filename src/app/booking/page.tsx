import { Suspense } from 'react';
import FinBookingPage from '@/components/FinBookingPage';

export default function BookingPage() {
  return <Suspense fallback={<main className="fin-booking-page grid min-h-screen place-items-center">Đang tải trang đặt lịch…</main>}><FinBookingPage /></Suspense>;
}
