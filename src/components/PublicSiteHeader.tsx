'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import MyBookingsModal from './MyBookingsModal';
import { useAuth } from '@/lib/context/AuthContext';
import { getActiveUserBookingCount, getUserBookings } from '@/lib/services/bookingService';
import type { BookingPhotoRecord } from '@/types';

export default function PublicSiteHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingPhotoRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeBookingCount, setActiveBookingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => {
      if (document.visibilityState === 'hidden') return;
      getActiveUserBookingCount(user.id).then((count) => { if (active) setActiveBookingCount(count); });
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
  }, [user]);

  const openBookings = async () => {
    setBookingsOpen(true);
    if (!user) return;
    setBookingsLoading(true);
    const items = await getUserBookings(user.id, user.email, { limit: 50 });
    setBookings(items);
    setActiveBookingCount(items.filter((booking) => !['completed', 'cancelled'].includes(booking.status)).length);
    setBookingsLoading(false);
  };

  return <>
    <Navbar
      onOpenBooking={(serviceId) => router.push(serviceId ? `/booking?service=${serviceId}` : '/booking')}
      onOpenAuth={() => setAuthOpen(true)}
      onOpenBookings={() => void openBookings()}
      bookingNotificationCount={user ? activeBookingCount : 0}
      bookingNotificationKey={`${user?.id ?? 'guest'}:${user ? activeBookingCount : 0}`}
    />
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    <MyBookingsModal isOpen={bookingsOpen} isLoading={bookingsLoading} onClose={() => setBookingsOpen(false)} bookings={bookings} onNewBooking={() => router.push('/booking')} onOpenAuth={() => setAuthOpen(true)} />
  </>;
}
