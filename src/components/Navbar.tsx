'use client';

import React, { useEffect, useState } from 'react';
import { Camera, User, LogIn, Moon, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import BrandLogo from './BrandLogo';
import LogoutButton from './LogoutButton';
import BookingAlertToast from './BookingAlertToast';

interface NavbarProps {
  onOpenBooking: (serviceId?: string) => void;
  onOpenAuth: () => void;
  onOpenBookings?: () => void;
  bookingNotificationCount?: number;
  bookingNotificationKey?: string;
}

export default function Navbar({
  onOpenBooking,
  onOpenAuth,
  onOpenBookings,
  bookingNotificationCount = 0,
  bookingNotificationKey = '',
}: NavbarProps) {
  const { user, isAdmin } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenBookingKey, setSeenBookingKey] = useState<string | null>(null);
  const openBookings = () => { setSeenBookingKey(bookingNotificationKey); onOpenBookings?.(); };

  useEffect(() => {
    const savedTheme = localStorage.getItem('photo-booking-theme');
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = initialTheme;
    const frameId = window.requestAnimationFrame(() => setTheme(initialTheme));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    const applyTheme = () => {
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('photo-booking-theme', nextTheme);
    };
    const documentWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };

    if (documentWithTransition.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      documentWithTransition.startViewTransition(applyTheme);
    } else {
      document.documentElement.classList.add('theme-transitioning');
      applyTheme();
      window.setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 900);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full glass-panel border-b border-sky-200 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand: Personal Photographer Studio */}
        <BrandLogo />

        <nav className="hidden items-center gap-6 lg:flex">
          {[['Portfolio','#portfolio'],['Gói Chụp','#services'],['Lịch Trống','#availability'],['Địa Điểm','#locations'],['Về Tôi','#about']].map(([label,href])=><a key={href} href={href} className="text-xs font-semibold text-slate-600 transition-colors hover:text-sky-600">{label}</a>)}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
            title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            className={`theme-toggle ${theme === 'dark' ? 'is-dark' : ''} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-white/80 text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-50 cursor-pointer`}
          >
            {theme === 'light' ? <Moon className="theme-icon h-4 w-4" /> : <Sun className="theme-icon h-4 w-4" />}
          </button>

          {/* Booking CTA */}
          <button
            onClick={() => onOpenBooking()}
            className="sky-button px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Book Lịch Chụp</span>
            <span className="sm:hidden">Book</span>
          </button>
          
          {/* Login is intentionally the right-most navbar action. */}
          {user ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={openBookings} title="Xem lịch đã đặt và trạng thái booking" className="relative flex h-10 items-center gap-2 rounded-lg border border-sky-200 bg-white/90 px-3 py-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden max-w-[120px] truncate font-medium text-slate-800 sm:inline">{user.full_name}</span>
                {isAdmin ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-600/20 text-sky-700 font-bold border border-sky-500/30">
                    Admin
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                    Khách
                  </span>
                )}
                {bookingNotificationCount>0&&<span className="booking-notification-pulse absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white">{bookingNotificationCount>9?'9+':bookingNotificationCount}</span>}
              </button>
              <LogoutButton className="h-10 min-h-10" />
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-2 rounded-lg bg-transparent hover:bg-sky-50 border border-sky-300 text-xs font-semibold text-sky-800 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Đăng Nhập</span>
            </button>
          )}
          <button type="button" onClick={()=>setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-white text-slate-700 lg:hidden" aria-label="Mở menu">{menuOpen?<X className="h-4 w-4"/>:<Menu className="h-4 w-4"/>}</button>

        </div>

      </div>
      {menuOpen && <nav className="border-t border-sky-200 bg-white/95 px-4 py-4 lg:hidden">{[['Portfolio','#portfolio'],['Gói Chụp','#services'],['Lịch Trống','#availability'],['Địa Điểm','#locations'],['Về Tôi','#about']].map(([label,href])=><a key={href} href={href} onClick={()=>setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50">{label}</a>)}</nav>}
      {user&&<BookingAlertToast key={bookingNotificationKey} count={seenBookingKey===bookingNotificationKey?0:bookingNotificationCount} title={`Bạn có ${bookingNotificationCount} lịch đã đặt`} message="Nhấn vào đây để xem ngày chụp và trạng thái mới nhất của từng đơn." onOpen={openBookings}/>} 
    </header>
  );
}


