'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import MyBookingsModal from '@/components/MyBookingsModal';
import { useAuth } from '@/lib/context/AuthContext';
import { getReliableUserBookings } from '@/lib/services/reliableBookingReadService';
import type { BookingPhotoRecord } from '@/types';

export default function MyBookings() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<BookingPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      setItems(await getReliableUserBookings(user.id, user.email, { limit: 50 }));
    } catch {
      setError('Không thể tải lịch chụp của bạn. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  return <RoleGuard allow={['user', 'admin', 'photographer']}><MyBookingsModal isOpen isLoading={loading} error={error} onRetry={() => void load()} bookings={items} onClose={() => router.push('/')} onNewBooking={() => router.push('/booking')} onOpenAuth={() => router.push('/login?next=%2Fmy-bookings')} /></RoleGuard>;
}
