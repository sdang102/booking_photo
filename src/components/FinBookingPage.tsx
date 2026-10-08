'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { BookingPhotoRecord, Service } from '@/types';
import BookingWizard from './BookingWizard';
import PublicMotionRoot from './motion/PublicMotionRoot';

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

export default function FinBookingPage({ initialServices = [] }: { initialServices?: Service[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services] = useState<Service[]>(initialServices);
  const [completed, setCompleted] = useState<BookingPhotoRecord | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  return <PublicMotionRoot><main className="fin-booking-page fin-site">
    <section className="fin-booking-intro"><div className="fin-shell"><p className="fin-kicker"><span /> Bespoke reservation</p><h1>Đặt hẹn &amp; tư vấn<br />buổi chụp.</h1><p>Chọn ngày, ca chụp và chia sẻ mong muốn của bạn. FIN PHOTO sẽ liên hệ xác nhận sau khi nhận yêu cầu.</p></div></section>
    <section className="fin-booking-workspace"><div className="fin-shell">
      {services.length ? <BookingWizard isOpen services={services} initialServiceId={searchParams.get('service') || undefined} onClose={() => router.push('/')} onBookingSuccess={setCompleted} onOpenAuth={() => setAuthOpen(true)} variant="page" /> : <div role="status" className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-amber-900"><h2 className="text-xl font-black">Chưa có gói chụp đang hoạt động</h2><p className="mt-2 text-sm leading-6">FIN PHOTO chưa thể nhận booking trực tuyến lúc này. Vui lòng quay lại sau hoặc dùng thông tin liên hệ ở cuối trang.</p></div>}
      {completed && <p className="sr-only" aria-live="polite">Đã gửi yêu cầu đặt lịch thành công.</p>}
    </div></section>
  </main>{authOpen && <AuthModal isOpen onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}</PublicMotionRoot>;
}
