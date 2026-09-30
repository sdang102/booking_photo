'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Bell, CalendarDays, Menu, Moon, Settings, Sun, User, X } from 'lucide-react';
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

const links = [
  ['Concept Luxury', '#luxury', '01'],
  ['Trải nghiệm', '#services', '02'],
  ['Lịch trống', '#availability', '03'],
  ['Về tôi', '#about', '04'],
  ['Cảm nhận', '#reviews', '05'],
];

export default function Navbar({
  onOpenBooking,
  onOpenAuth,
  onOpenBookings,
  bookingNotificationCount = 0,
  bookingNotificationKey = '',
}: NavbarProps) {
  const { user, isAdmin } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [activeSection, setActiveSection] = useState('');
  const [seenBookingKey, setSeenBookingKey] = useState<string | null>(null);
  const unreadBookingCount = seenBookingKey === bookingNotificationKey ? 0 : bookingNotificationCount;
  const openBookings = () => {
    if (user && bookingNotificationKey) {
      localStorage.setItem(`photo-booking-seen-${user.id}`, bookingNotificationKey);
      setSeenBookingKey(bookingNotificationKey);
    }
    setAccountOpen(false);
    onOpenBookings?.();
  };

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem('photo-booking-theme');
    const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
    const frameId = window.requestAnimationFrame(() => setTheme(initialTheme));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setSeenBookingKey(user ? localStorage.getItem(`photo-booking-seen-${user.id}`) : null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [user]);

  useEffect(() => {
    let frameId = 0;
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        setScrolled(currentY > 56);
        if (currentY < 24) setNavVisible(true);
        else if (Math.abs(delta) > 6) setNavVisible(delta < 0);
        lastScrollY.current = currentY;
        frameId = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const sections = links
      .map(([, href]) => document.querySelector<HTMLElement>(href))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-22% 0px -62%', threshold: [0, 0.15, 0.4] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
    return () => document.body.classList.remove('nav-open');
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [accountOpen]);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    const applyTheme = () => {
      document.documentElement.classList.add('theme-changing');
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      localStorage.setItem('photo-booking-theme', nextTheme);
      window.setTimeout(() => document.documentElement.classList.remove('theme-changing'), 300);
    };
    applyTheme();
  };

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => {
    setAccountOpen(false);
    setMenuOpen((value) => !value);
  };

  return (
    <>
      <header className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''} ${menuOpen ? 'site-nav--open' : ''} ${!navVisible && !menuOpen && !accountOpen ? 'site-nav--hidden' : ''}`}>
        <div className="site-nav__inner">
          <BrandLogo />
          <nav className="site-nav__desktop" aria-label="Điều hướng chính">
            {links.slice(0, 4).map(([label, href]) => {
              const active = activeSection === href.slice(1);
              return <a key={href} href={href} className={active ? 'is-active' : ''} aria-current={active ? 'location' : undefined}>{label}</a>;
            })}
          </nav>
          <div className="site-nav__actions">
            <button type="button" onClick={toggleTheme} className="theme-switch" aria-label={theme === 'dark' ? 'Bật chế độ sáng' : 'Bật chế độ tối'} title={theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}>
              <span className="theme-switch__thumb" />
              <Sun className="theme-switch__sun" />
              <Moon className="theme-switch__moon" />
            </button>
            <button type="button" onClick={() => onOpenBooking()} className="site-nav__book">
              <span className="site-nav__book-full">Đặt lịch</span><span className="site-nav__book-short">Đặt</span><CalendarDays />
            </button>
            {user && unreadBookingCount > 0 && (
              <button type="button" onClick={openBookings} className="nav-icon nav-icon--notice" aria-label={`${unreadBookingCount} thông báo lịch chưa xem`} title="Thông báo lịch chưa xem">
                <Bell />
                <span className="nav-icon__badge">{unreadBookingCount > 9 ? '9+' : unreadBookingCount}</span>
              </button>
            )}
            {user ? (
              <div className="site-nav__user">
                <button type="button" onClick={() => setAccountOpen((value) => !value)} className="nav-icon nav-icon--user" title="Quản lý tài khoản" aria-expanded={accountOpen}>
                  <User />
                </button>
                <LogoutButton className="nav-logout" />
              </div>
            ) : (
              <button type="button" onClick={onOpenAuth} className="nav-icon nav-icon--login" aria-label="Đăng nhập" title="Đăng nhập"><User /></button>
            )}
            <button type="button" onClick={toggleMenu} className="nav-icon nav-icon--menu" aria-expanded={menuOpen} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {user && accountOpen && (
        <aside className="nav-account-panel" aria-label="Quản lý tài khoản">
          <button type="button" onClick={() => setAccountOpen(false)} className="nav-account-panel__close" aria-label="Đóng quản lý tài khoản"><X /></button>
          <span>Tài khoản của bạn</span>
          <strong>{user.full_name}</strong>
          <small>{user.email}</small>
          <div>
            <button type="button" onClick={openBookings}><CalendarDays />Lịch đã đặt{unreadBookingCount > 0 && <b>{unreadBookingCount}</b>}</button>
            <Link href="/profile" onClick={() => setAccountOpen(false)}><Settings />Quản lý tài khoản</Link>
            <LogoutButton className="nav-account-panel__logout" />
          </div>
        </aside>
      )}

      <div className={`nav-canvas ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="nav-canvas__image" aria-hidden="true" />
        <div className="nav-canvas__content">
          <p>S. ĐẶNG PHOTOGRAPHY · LUXURY PORTRAIT ONLY</p>
          <nav aria-label="Menu toàn màn hình">
            {links.map(([label, href, index]) => (
              <a key={href} href={href} onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} aria-current={activeSection === href.slice(1) ? 'location' : undefined}>
                <span>{index}</span>{label}<ArrowUpRight />
              </a>
            ))}
          </nav>
          <button type="button" onClick={() => { closeMenu(); onOpenBooking(); }} tabIndex={menuOpen ? 0 : -1}>
            <CalendarDays /> Đặt lịch Luxury Portrait
          </button>
          <small>{user ? `${user.full_name} · ${isAdmin ? 'Admin' : 'Khách hàng'}` : 'Đăng nhập để theo dõi lịch chụp của bạn'}</small>
        </div>
      </div>

      {user && <BookingAlertToast key={bookingNotificationKey} count={unreadBookingCount} title={`Bạn có ${unreadBookingCount} thông báo lịch chưa xem`} message="Nhấn để xem ngày chụp và trạng thái mới nhất." onOpen={openBookings} />}
    </>
  );
}
