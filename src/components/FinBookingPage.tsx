'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BookingPhotoRecord, Service } from '@/types';
import { getServices } from '@/lib/services/bookingService';
import { MOCK_SERVICES } from '@/lib/data/mockData';
import BookingWizard from './BookingWizard';
import PublicSiteHeader from './PublicSiteHeader';
import { FinFooter } from './FinPhotoSections';
import PublicMotionRoot from './motion/PublicMotionRoot';

export default function FinBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [completed, setCompleted] = useState<BookingPhotoRecord | null>(null);
  useEffect(() => { getServices().then(items => { if (items.length) setServices(items); }); }, []);

  return <PublicMotionRoot><main className="fin-booking-page fin-site">
    <PublicSiteHeader />
    <section className="fin-booking-intro"><div className="fin-shell"><p className="fin-kicker"><span /> Bespoke reservation</p><h1>Đặt hẹn &amp; tư vấn<br />buổi chụp.</h1><p>Chọn ngày, ca chụp và chia sẻ mong muốn của bạn. FIN PHOTO sẽ liên hệ xác nhận sau khi nhận yêu cầu.</p></div></section>
    <section className="fin-booking-workspace"><div className="fin-shell">
      {services.length ? <BookingWizard isOpen services={services} initialServiceId={searchParams.get('service') || undefined} onClose={() => router.push('/')} onBookingSuccess={setCompleted} variant="page" /> : <p className="fin-booking-loading">Đang tải lịch và các gói chụp…</p>}
      {completed && <p className="sr-only" aria-live="polite">Đã gửi yêu cầu đặt lịch thành công.</p>}
    </div></section>
    <FinFooter />
  </main></PublicMotionRoot>;
}
