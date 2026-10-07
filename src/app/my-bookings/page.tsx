'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import MyBookingsModal from '@/components/MyBookingsModal';
import { useAuth } from '@/lib/context/AuthContext';
import { getUserBookings } from '@/lib/services/bookingService';
import type { BookingPhotoRecord } from '@/types';

export default function MyBookings() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<BookingPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserBookings(user.id, user.email, { limit: 50 }).then(setItems).finally(() => setLoading(false));
  }, [user]);

  return <RoleGuard allow={['user', 'admin', 'photographer']}><MyBookingsModal isOpen isLoading={loading} bookings={items} onClose={() => router.push('/')} onNewBooking={() => router.push('/booking')} onOpenAuth={() => router.push('/login?next=%2Fmy-bookings')} /></RoleGuard>;
}
