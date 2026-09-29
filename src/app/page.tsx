'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ServiceCard from '@/components/ServiceCard';
import PortfolioGallery from '@/components/PortfolioGallery';
import ReviewsSection from '@/components/ReviewsSection';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { AboutPhotographer, BookingProcess, FAQ, FinalCTA, Footer, LocationsSection } from '@/components/HomepageSections';
import BookingWizard from '@/components/BookingWizard';
import AuthModal from '@/components/AuthModal';
import MyBookingsModal from '@/components/MyBookingsModal';
import type { BookingPhotoRecord, FaqItem, HomepageSection, PublicScheduleItem, Service, ShootingLocation } from '@/types';
import { getPublicSchedule, getServices, getUserBookings } from '@/lib/services/bookingService';
import { getCategories, getFaqs, getHomepageSections, getLocations } from '@/lib/services/contentService';
import { useAuth } from '@/lib/context/AuthContext';

const CATEGORIES = [
  ['all', 'Tất Cả'], ['wedding', 'Ảnh Cưới & Pre-Wedding'], ['portrait', 'Chân Dung'],
  ['concept', 'Concept Nghệ Thuật'], ['family', 'Gia Đình & Bé'], ['event', 'Sự Kiện'],
];

export default function HomePage() {
  const router = useRouter();
  const { user, isAdmin, isPhotographer, isLoading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<PublicScheduleItem[]>([]);
  const [category, setCategory] = useState('all');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [userBookings, setUserBookings] = useState<BookingPhotoRecord[]>([]);
  const [serviceId, setServiceId] = useState<string>();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [locations, setLocations] = useState<ShootingLocation[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<{slug:string;name:string}[]>([]);

  useEffect(() => {
    if (authLoading || typeof window === 'undefined' || new URLSearchParams(window.location.search).get('preview') === '1') return;
    if (isAdmin) router.replace('/admin');
    else if (isPhotographer) router.replace('/photographer');
  }, [authLoading, isAdmin, isPhotographer, router]);

  useEffect(() => {
    Promise.all([getServices(), getPublicSchedule(), getHomepageSections(), getLocations(), getFaqs(), getCategories()]).then(([serviceData, scheduleData, sectionData, locationData, faqData, categoryData]) => {
      setServices(serviceData);
      setSchedule(scheduleData);
      setSections(sectionData);
      setLocations(locationData);
      setFaqs(faqData);
      setCategories(categoryData);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => getUserBookings(user.id, user.email).then((items) => { if (active) setUserBookings(items); });
    void load();
    window.addEventListener('focus', load);
    const interval = window.setInterval(load, 15000);
    return () => { active = false; window.removeEventListener('focus', load); window.clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('.scroll-reveal');
    const text = document.querySelectorAll<HTMLElement>('.scroll-reveal h1, .scroll-reveal h2, .scroll-reveal h3, .scroll-reveal p');
    text.forEach((element, index) => { element.classList.add('scroll-pop-text'); element.style.setProperty('--reveal-delay', `${(index % 4) * 110}ms`); });
    const elements = [...sections, ...text];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { elements.forEach((element) => element.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [services]);

  const openBooking = (selectedServiceId?: string) => {
    setServiceId(selectedServiceId);
    setBookingOpen(true);
  };
  const openAuth = () => setAuthOpen(true);
  const onBookingSuccess = async (booking: BookingPhotoRecord) => {
    setSchedule(await getPublicSchedule());
    if (user) setUserBookings((items) => [booking, ...items]);
  };
  const filtered = category === 'all' ? services : services.filter((service) => service.category === category);
  const section = (key: string) => sections.find((item) => item.section_key === key);
  const serviceSection=section('services');
  const categoryOptions=categories.length?[{slug:'all',name:'Tất Cả'},...categories]:CATEGORIES.map(([slug,name])=>({slug,name}));
  const showSection=(key:string)=>sections.length===0||Boolean(section(key));
  const activeUserBookings=userBookings.filter((booking)=>!['completed','cancelled'].includes(booking.status));
  const bookingNotificationCount=activeUserBookings.length;
  const bookingNotificationKey=activeUserBookings.map((booking)=>`${booking.id}:${booking.status}`).sort().join('|');

  return <main className="min-h-screen overflow-x-hidden bg-[#fffcf7] pt-20 text-slate-900">
    <Navbar onOpenBooking={() => openBooking()} onOpenAuth={openAuth} onOpenBookings={() => setMyBookingsOpen(true)} bookingNotificationCount={bookingNotificationCount} bookingNotificationKey={bookingNotificationKey} />
    {showSection('hero')&&<Hero section={section('hero')} />}

    {showSection('services')&&<section id="services" className="scroll-reveal py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><span className="section-kicker">{serviceSection?.subtitle??'Gói chụp'}</span><h2 className="section-title">{serviceSection?.title??'Các Gói Dịch Vụ Của Tôi'}</h2><p className="section-copy mx-auto">{String(serviceSection?.content?.description??'Thông tin cô đọng, giá minh bạch để bạn dễ dàng so sánh và chọn đúng gói.')}</p></div><div className="mt-8 flex gap-2 overflow-x-auto pb-2 sm:justify-center">{categoryOptions.map(({slug,label,name}:{slug:string;label?:string;name:string})=><button key={slug} onClick={()=>setCategory(slug)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${category===slug?'bg-sky-600 text-white shadow-lg':'border border-sky-200 bg-white text-slate-600'}`}>{name??label}</button>)}</div><div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filtered.map((service)=><ServiceCard key={service.id} service={service} onBook={openBooking}/>)}</div></div></section>}

    {showSection('portfolio')&&<PortfolioGallery />}
    {showSection('calendar')&&<AvailabilityCalendar bookings={schedule} onBook={() => openBooking()} />}
    {showSection('locations')&&<LocationsSection locations={locations} section={section('locations')} />}
    {showSection('about')&&<AboutPhotographer section={section('about')} />}
    {showSection('reviews')&&<ReviewsSection />}
    {showSection('booking_process')&&<BookingProcess section={section('booking_process')} />}
    {showSection('faq')&&<FAQ items={faqs} />}
    {showSection('final_cta')&&<FinalCTA section={section('final_cta')} onBook={() => openBooking()} />}
    <Footer />

    <AuthModal isOpen={authOpen} onClose={()=>setAuthOpen(false)}/>
    <BookingWizard isOpen={bookingOpen} onClose={()=>setBookingOpen(false)} services={services} initialServiceId={serviceId} onBookingSuccess={onBookingSuccess} onOpenAuth={()=>setAuthOpen(true)}/>
    <MyBookingsModal isOpen={myBookingsOpen} onClose={()=>setMyBookingsOpen(false)} bookings={userBookings} services={services} onNewBooking={()=>openBooking()} onOpenAuth={openAuth}/>
  </main>;
}

