'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, LogIn, Menu, Moon, Sun, User, X } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [activeSection, setActiveSection] = useState('');
  const [seenBookingKey, setSeenBookingKey] = useState<string | null>(null);
  const openBookings = () => { setSeenBookingKey(bookingNotificationKey); onOpenBookings?.(); };

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
    let frameId = 0;
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;
        setScrolled(currentY > 56);
        if (currentY < 24) setNavVisible(true);
        else if (Math.abs(delta) > 6) setNavVisible(delta > 0);
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

  return (
    <>
      <header className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''} ${menuOpen ? 'site-nav--open' : ''} ${!navVisible && !menuOpen ? 'site-nav--hidden' : ''}`}>
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
            {user ? (
              <div className="site-nav__user">
                <button type="button" onClick={openBookings} className="nav-icon nav-icon--user" title="Lịch của tôi">
                  <User />
                  {bookingNotificationCount > 0 && <span>{bookingNotificationCount > 9 ? '9+' : bookingNotificationCount}</span>}
                </button>
                <LogoutButton className="nav-logout" />
              </div>
            ) : (
              <button type="button" onClick={onOpenAuth} className="nav-icon" aria-label="Đăng nhập"><LogIn /></button>
            )}
            <button type="button" onClick={() => onOpenBooking()} className="site-nav__book">
              Đặt lịch <ArrowUpRight />
            </button>
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="nav-icon nav-icon--menu" aria-expanded={menuOpen} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

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

      {user && <BookingAlertToast key={bookingNotificationKey} count={seenBookingKey === bookingNotificationKey ? 0 : bookingNotificationCount} title={`Bạn có ${bookingNotificationCount} lịch đã đặt`} message="Nhấn để xem ngày chụp và trạng thái mới nhất." onOpen={openBookings} />}
    </>
  );
}
