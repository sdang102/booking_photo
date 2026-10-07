'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Aperture, ArrowUpRight, CalendarDays, House, Images, Menu, PackageOpen, Settings, Star, User, X } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import BrandLogo from './BrandLogo';
import LogoutButton from './LogoutButton';

interface NavbarProps {
  onOpenBooking: (serviceId?: string) => void;
  onOpenAuth: () => void;
  onOpenBookings?: () => void;
  bookingNotificationCount?: number;
  bookingNotificationKey?: string;
}

const links = [
  { label: 'Trang chủ', href: '/', index: '01', icon: House },
  { label: 'Bộ sưu tập', href: '/portfolio', index: '02', icon: Images },
  { label: 'Gói chụp', href: '/services', index: '03', icon: PackageOpen },
  { label: 'Portfolio', href: '/about', index: '04', icon: Aperture },
  { label: 'Đánh giá', href: '/reviews', index: '05', icon: Star },
];

export default function Navbar({
  onOpenBooking,
  onOpenAuth,
  onOpenBookings,
  bookingNotificationCount = 0,
  bookingNotificationKey = '',
}: NavbarProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
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

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setSeenBookingKey(user ? localStorage.getItem(`photo-booking-seen-${user.id}`) : null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [user]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 767px)').matches;
    if (reducedMotion) return;
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
    document.body.classList.toggle('nav-open', menuOpen);
    return () => document.body.classList.remove('nav-open');
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [accountOpen]);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => {
    setAccountOpen(false);
    setMenuOpen((value) => !value);
  };
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''} ${menuOpen ? 'site-nav--open' : ''} ${!navVisible && !menuOpen && !accountOpen ? 'site-nav--hidden' : ''}`}>
        <div className="site-nav__inner">
          <div className="site-nav__brand-group"><BrandLogo />{user && <Link href="/profile" className="site-nav__avatar" aria-label="Mở hồ sơ cá nhân"><span>{user.avatar_url ? <img src={user.avatar_url} alt="" /> : <User />}</span></Link>}</div>
          <nav className="site-nav__desktop" aria-label="Điều hướng chính">
            {links.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return <Link key={href} href={href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}><Icon /><span>{label}</span></Link>;
            })}
          </nav>
          <div className="site-nav__actions">
            <button type="button" onClick={() => onOpenBooking()} className="site-nav__book">
              <span className="site-nav__book-full">Đặt lịch</span><span className="site-nav__book-short">Đặt</span><CalendarDays />
            </button>
            {user ? (
              <div className="site-nav__user">
                <button type="button" onClick={() => setAccountOpen((value) => !value)} className="nav-icon nav-icon--user" title="Quản lý tài khoản" aria-expanded={accountOpen}>
                  <User />
                </button>
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
            <LogoutButton className="nav-account-panel__logout" label="Đăng xuất" />
          </div>
        </aside>
      )}

      <div className={`nav-canvas ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="nav-canvas__image" aria-hidden="true" />
        <div className="nav-canvas__content">
          <p>FIN PHOTO · EDITORIAL PHOTOGRAPHY</p>
          <nav aria-label="Menu toàn màn hình">
            {links.map(({ label, href, index, icon: Icon }) => (
              <Link key={href} href={href} onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} className={isActive(href) ? 'is-active' : ''} aria-current={isActive(href) ? 'page' : undefined}>
                <span>{index}</span><Icon /><strong>{label}</strong><ArrowUpRight />
              </Link>
            ))}
          </nav>
          <button type="button" onClick={() => { closeMenu(); onOpenBooking(); }} tabIndex={menuOpen ? 0 : -1}>
            <CalendarDays /> Đặt lịch cùng FIN PHOTO
          </button>
          <div className="nav-canvas__account">
            {user ? <>
              <button type="button" onClick={() => { closeMenu(); openBookings(); }} tabIndex={menuOpen ? 0 : -1}><CalendarDays /> Lịch chụp của tôi{unreadBookingCount > 0 && <b>{unreadBookingCount}</b>}</button>
              <Link href="/profile" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}><Settings /> Quản lý tài khoản</Link>
              <LogoutButton label="Đăng xuất" onClick={closeMenu} />
            </> : <button type="button" onClick={() => { closeMenu(); onOpenAuth(); }} tabIndex={menuOpen ? 0 : -1}><User /> Đăng nhập / Đăng ký</button>}
          </div>
          <small>{user ? `${user.full_name} · ${isAdmin ? 'Admin' : 'Khách hàng'}` : 'Đăng nhập để theo dõi lịch chụp của bạn'}</small>
        </div>
      </div>

      <nav className="user-bottom-nav" aria-label="Điều hướng trang khách hàng trên di động">
        <Link href="/" className={isActive('/') ? 'is-active' : ''}>
          <span className="workspace-nav__icon"><House /></span>
          <span>Trang chủ</span>
        </Link>
        <Link href="/services" className={isActive('/services') ? 'is-active' : ''}>
          <span className="workspace-nav__icon"><PackageOpen /></span>
          <span>Gói chụp</span>
        </Link>
        <Link href="/portfolio" className={isActive('/portfolio') ? 'is-active' : ''}>
          <span className="workspace-nav__icon"><Images /></span>
          <span>Bộ sưu tập</span>
        </Link>
        <Link href="/reviews" className={isActive('/reviews') ? 'is-active' : ''}>
          <span className="workspace-nav__icon"><Star /></span>
          <span>Đánh giá</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            if (user) {
              openBookings();
            } else {
              onOpenBooking();
            }
          }}
          className={pathname.startsWith('/booking') ? 'is-active' : ''}
        >
          <span className="workspace-nav__icon">
            <CalendarDays />
            {unreadBookingCount > 0 && (
              <b className="booking-notification-pulse">
                {unreadBookingCount > 9 ? '9+' : unreadBookingCount}
              </b>
            )}
          </span>
          <span>Lịch chụp</span>
        </button>
        {user ? (
          <Link href="/profile" className={isActive('/profile') ? 'is-active' : ''}>
            <span className="workspace-nav__icon"><User /></span>
            <span>Tôi</span>
          </Link>
        ) : (
          <button type="button" onClick={onOpenAuth}>
            <span className="workspace-nav__icon"><User /></span>
            <span>Tôi</span>
          </button>
        )}
      </nav>
    </>
  );
}
