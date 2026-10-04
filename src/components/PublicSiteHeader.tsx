'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import MyBookingsModal from './MyBookingsModal';
import { useAuth } from '@/lib/context/AuthContext';
import { getServices, getUserBookings } from '@/lib/services/bookingService';
import type { BookingPhotoRecord, Service } from '@/types';

export default function PublicSiteHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingPhotoRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => { getServices().then(setServices); }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => getUserBookings(user.id, user.email).then(items => { if (active) setBookings(items); });
    void load();
    window.addEventListener('focus', load);
    const interval = window.setInterval(load, 15000);
    return () => { active = false; window.removeEventListener('focus', load); window.clearInterval(interval); };
  }, [user]);

  const activeBookings = bookings.filter(booking => !['completed', 'cancelled'].includes(booking.status));
  const notificationKey = activeBookings.map(booking => `${booking.id}:${booking.status}`).sort().join('|');

  return <>
    <Navbar
      onOpenBooking={(serviceId) => router.push(serviceId ? `/booking?service=${serviceId}` : '/booking')}
      onOpenAuth={() => setAuthOpen(true)}
      onOpenBookings={() => setBookingsOpen(true)}
      bookingNotificationCount={activeBookings.length}
      bookingNotificationKey={notificationKey}
    />
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    <MyBookingsModal isOpen={bookingsOpen} onClose={() => setBookingsOpen(false)} bookings={bookings} services={services} onNewBooking={() => router.push('/booking')} onOpenAuth={() => setAuthOpen(true)} />
  </>;
}
