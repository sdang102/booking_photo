'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getAllBookings } from '@/lib/services/bookingService';
import type { BookingPhotoRecord } from '@/types';

interface PhotographerBookingsContextValue {
  items: BookingPhotoRecord[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateBooking: (booking: BookingPhotoRecord) => void;
}

const PhotographerBookingsContext = createContext<PhotographerBookingsContextValue | undefined>(undefined);
const PAGE_SIZE = 50;

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function PhotographerBookingsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BookingPhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastFetchedAt = useRef(0);
  const requestInFlight = useRef<Promise<void> | null>(null);
  const fromDate = useRef(dateOffset(-30));

  const refresh = useCallback(async () => {
    if (requestInFlight.current) return requestInFlight.current;
    const request = (async () => {
      try {
        const bookings = await getAllBookings({ fromDate: fromDate.current, limit: PAGE_SIZE, offset: 0 });
        setItems(bookings);
        setHasMore(bookings.length === PAGE_SIZE);
        lastFetchedAt.current = Date.now();
      } finally {
        setIsLoading(false);
      }
    })();
    requestInFlight.current = request;
    try { await request; } finally { if (requestInFlight.current === request) requestInFlight.current = null; }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || requestInFlight.current) return;
    setIsLoadingMore(true);
    try {
      const bookings = await getAllBookings({ fromDate: fromDate.current, limit: PAGE_SIZE, offset: items.length });
      setItems((current) => [...current, ...bookings]);
      setHasMore(bookings.length === PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, items.length]);

  const updateBooking = useCallback((booking: BookingPhotoRecord) => {
    setItems((current) => current.map((item) => item.id === booking.id ? booking : item));
  }, []);

  useEffect(() => {
    let active = true;
    const loadIfStale = async () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastFetchedAt.current < 120_000) return;
      if (active) await refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void loadIfStale();
    };

    void refresh();
    window.addEventListener('focus', loadIfStale);
    window.addEventListener('booking-status-changed', refresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('focus', loadIfStale);
      window.removeEventListener('booking-status-changed', refresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refresh]);

  return <PhotographerBookingsContext.Provider value={{ items, isLoading, isLoadingMore, hasMore, refresh, loadMore, updateBooking }}>
    {children}
  </PhotographerBookingsContext.Provider>;
}

export function usePhotographerBookings() {
  const context = useContext(PhotographerBookingsContext);
  if (!context) throw new Error('usePhotographerBookings must be used within PhotographerBookingsProvider');
  return context;
}
