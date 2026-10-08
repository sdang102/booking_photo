'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import { useAuth } from '@/lib/context/AuthContext';
import { getReliableUserBookings } from '@/lib/services/reliableBookingReadService';
import type { BookingPhotoRecord } from '@/types';

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });
const MyBookingsModal = dynamic(() => import('./MyBookingsModal'), { ssr: false });

export default function PublicSiteHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingPhotoRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingsRetryKey, setBookingsRetryKey] = useState(0);
  const [activeBookingCount, setActiveBookingCount] = useState(0);

  useEffect(() => {
    if (!user || !bookingsOpen) return;
    let active = true;
    const load = () => {
      if (document.visibilityState === 'hidden') return;
      getReliableUserBookings(user.id, user.email, { limit: 50 }).then((items) => {
        if (!active) return;
        setBookings(items);
        setBookingsError('');
        setActiveBookingCount(items.filter((booking) => !['completed', 'cancelled'].includes(booking.status)).length);
        setBookingsLoading(false);
      }).catch(() => { if (active) { setBookingsError('Không thể tải lịch chụp của bạn. Vui lòng thử lại.'); setBookingsLoading(false); } });
    };
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') load(); };
    void load();
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [bookingsOpen, bookingsRetryKey, user]);

  const openBookings = () => { setBookingsLoading(Boolean(user)); setBookingsOpen(true); };

  return <>
    <Navbar
      onOpenBooking={(serviceId) => router.push(serviceId ? `/booking?service=${serviceId}` : '/booking')}
      onOpenAuth={() => setAuthOpen(true)}
      onOpenBookings={() => void openBookings()}
      bookingNotificationCount={user ? activeBookingCount : 0}
      bookingNotificationKey={`${user?.id ?? 'guest'}:${user ? activeBookingCount : 0}`}
    />
    {authOpen && <AuthModal isOpen onClose={() => setAuthOpen(false)} />}
    {bookingsOpen && <MyBookingsModal isOpen isLoading={bookingsLoading} error={bookingsError} onRetry={() => { setBookingsLoading(true); setBookingsError(''); setBookingsRetryKey((value) => value + 1); }} onClose={() => setBookingsOpen(false)} bookings={bookings} onNewBooking={() => router.push('/booking')} onOpenAuth={() => setAuthOpen(true)} />}
  </>;
}
