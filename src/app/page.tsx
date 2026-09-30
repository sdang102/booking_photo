'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ReviewsSection from '@/components/ReviewsSection';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { AboutPhotographer, BookingProcess, FAQ, FinalCTA, Footer } from '@/components/HomepageSections';
import BookingWizard from '@/components/BookingWizard';
import AuthModal from '@/components/AuthModal';
import MyBookingsModal from '@/components/MyBookingsModal';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import EditorialServices from '@/components/EditorialServices';
import LuxuryExperience from '@/components/LuxuryExperience';
import type { BookingPhotoRecord, FaqItem, HomepageSection, PublicScheduleItem, Service } from '@/types';
import { getPublicSchedule, getServices, getUserBookings } from '@/lib/services/bookingService';
import { getFaqs, getHomepageSections } from '@/lib/services/contentService';
import { useAuth } from '@/lib/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, isAdmin, isPhotographer, isLoading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<PublicScheduleItem[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [userBookings, setUserBookings] = useState<BookingPhotoRecord[]>([]);
  const [serviceId, setServiceId] = useState<string>();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    if (authLoading || typeof window === 'undefined' || new URLSearchParams(window.location.search).get('preview') === '1') return;
    if (isAdmin) router.replace('/admin');
    else if (isPhotographer) router.replace('/photographer');
  }, [authLoading, isAdmin, isPhotographer, router]);

  useEffect(() => {
    Promise.all([getServices(), getPublicSchedule(), getHomepageSections(), getFaqs()]).then(([serviceData, scheduleData, sectionData, faqData]) => {
      setServices(serviceData);
      setSchedule(scheduleData);
      setSections(sectionData);
      setFaqs(faqData);
    });
  }, []);

  const luxuryServices = useMemo<Service[]>(() => {
    const source = services.find((item) => item.category === 'concept') ?? services[0];
    if (!source) return [];
    return [{
      ...source,
      title: 'Luxury Signature Portrait',
      slug: 'luxury-signature-portrait',
      category: 'concept',
      description: 'Một trải nghiệm chân dung cao cấp được xây dựng riêng quanh thần thái của bạn, từ moodboard, ánh sáng, tạo dáng đến màu ảnh hoàn thiện.',
      duration_minutes: source.duration_minutes || 120,
      edited_photos: source.edited_photos || 15,
      location_count: '1 địa điểm',
      features: [
        'Tư vấn moodboard và trang phục trước buổi chụp',
        'Hướng dẫn tạo dáng và biểu cảm xuyên suốt',
        '15 ảnh hậu kỳ Luxury chọn lọc',
        'Nhận toàn bộ ảnh gốc chất lượng cao',
      ],
      image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=88',
    }];
  }, [services]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => getUserBookings(user.id, user.email).then((items) => { if (active) setUserBookings(items); });
    void load();
    window.addEventListener('focus', load);
    const interval = window.setInterval(load, 15000);
    return () => { active = false; window.removeEventListener('focus', load); window.clearInterval(interval); };
  }, [user]);

  const openBooking = (selectedServiceId?: string) => {
    setServiceId(selectedServiceId);
    setBookingOpen(true);
  };
  const openAuth = () => setAuthOpen(true);
  const onBookingSuccess = async (booking: BookingPhotoRecord) => {
    setSchedule(await getPublicSchedule());
    if (user) setUserBookings((items) => [booking, ...items]);
  };
  const section = (key: string) => sections.find((item) => item.section_key === key);
  const showSection=(key:string)=>sections.length===0||Boolean(section(key));
  const activeUserBookings=userBookings.filter((booking)=>!['completed','cancelled'].includes(booking.status));
  const bookingNotificationCount=activeUserBookings.length;
  const bookingNotificationKey=activeUserBookings.map((booking)=>`${booking.id}:${booking.status}`).sort().join('|');

  return <PublicMotionRoot settings={section('motion_settings')}><main className="public-home min-h-screen overflow-x-hidden">
    <Navbar onOpenBooking={() => openBooking()} onOpenAuth={openAuth} onOpenBookings={() => setMyBookingsOpen(true)} bookingNotificationCount={bookingNotificationCount} bookingNotificationKey={bookingNotificationKey} />
    {showSection('hero')&&<Hero onBook={() => openBooking()} />}
    <LuxuryExperience onBook={() => openBooking(luxuryServices[0]?.id)} />
    {showSection('services')&&<EditorialServices services={luxuryServices} onBook={openBooking} />}
    {showSection('calendar')&&<AvailabilityCalendar bookings={schedule} onBook={() => openBooking()} />}
    {showSection('about')&&<AboutPhotographer section={section('about')} />}
    {showSection('reviews')&&<ReviewsSection />}
    {showSection('booking_process')&&<BookingProcess />}
    {showSection('faq')&&<FAQ items={faqs} />}
    {showSection('final_cta')&&<FinalCTA onBook={() => openBooking()} />}
    <Footer onBook={() => openBooking()} />

    <AuthModal isOpen={authOpen} onClose={()=>setAuthOpen(false)}/>
    <BookingWizard key={`${user?.id ?? 'guest'}-${bookingOpen ? 'open' : 'closed'}`} isOpen={bookingOpen} onClose={()=>setBookingOpen(false)} services={luxuryServices} initialServiceId={serviceId} onBookingSuccess={onBookingSuccess} onOpenAuth={()=>setAuthOpen(true)}/>
    <MyBookingsModal isOpen={myBookingsOpen} onClose={()=>setMyBookingsOpen(false)} bookings={userBookings} services={luxuryServices} onNewBooking={()=>openBooking()} onOpenAuth={openAuth}/>
  </main></PublicMotionRoot>;
}

