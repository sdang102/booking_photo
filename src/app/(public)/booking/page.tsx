import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { getPublicServices } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

const FinBookingPage = dynamic(() => import('@/components/FinBookingPage'), {
  loading: () => <main className="fin-booking-page grid min-h-screen place-items-center">Đang tải trang đặt lịch…</main>,
});

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Đặt lịch chụp ảnh',
    description: 'Chọn gói, ngày và ca chụp phù hợp để gửi yêu cầu đặt lịch cùng FIN PHOTO.',
    path: '/booking',
  });
}

export default async function BookingPage() {
  const services = await getPublicServices();
  return <Suspense fallback={<main className="fin-booking-page grid min-h-screen place-items-center">Đang tải trang đặt lịch…</main>}><FinBookingPage initialServices={services} /></Suspense>;
}
