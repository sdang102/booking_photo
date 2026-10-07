'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAllBookings } from '@/lib/services/bookingService';
import type { BookingPhotoRecord } from '@/types';

interface PhotographerBookingsContextValue {
  items: BookingPhotoRecord[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateBooking: (booking: BookingPhotoRecord) => void;
}

const PhotographerBookingsContext = createContext<PhotographerBookingsContextValue | undefined>(undefined);

export function PhotographerBookingsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BookingPhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const bookings = await getAllBookings({ limit: 200 });
    setItems(bookings);
    setIsLoading(false);
  }, []);

  const updateBooking = useCallback((booking: BookingPhotoRecord) => {
    setItems((current) => current.map((item) => item.id === booking.id ? booking : item));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (document.visibilityState === 'hidden') return;
      const bookings = await getAllBookings({ limit: 200 });
      if (active) {
        setItems(bookings);
        setIsLoading(false);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void load();
    };

    void load();
    window.addEventListener('focus', load);
    window.addEventListener('booking-status-changed', load);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.removeEventListener('focus', load);
      window.removeEventListener('booking-status-changed', load);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  return <PhotographerBookingsContext.Provider value={{ items, isLoading, refresh, updateBooking }}>
    {children}
  </PhotographerBookingsContext.Provider>;
}

export function usePhotographerBookings() {
  const context = useContext(PhotographerBookingsContext);
  if (!context) throw new Error('usePhotographerBookings must be used within PhotographerBookingsProvider');
  return context;
}
