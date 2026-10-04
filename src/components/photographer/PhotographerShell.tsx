'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, CalendarOff, ClipboardList, Home, Star, UserRound } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import BookingAlertToast from '@/components/BookingAlertToast';
import { useAuth } from '@/lib/context/AuthContext';
import { getAllBookings } from '@/lib/services/bookingService';

const NAV=[
  {href:'/photographer',label:'Tổng quan',icon:Home},
  {href:'/photographer/schedule',label:'Lịch chụp',icon:CalendarDays},
  {href:'/photographer/availability',label:'Chặn lịch',icon:CalendarOff},
  {href:'/photographer/bookings',label:'Booking',icon:ClipboardList,notification:true},
  {href:'/photographer/reviews',label:'Đánh giá',icon:Star},
];

export default function PhotographerShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const {user}=useAuth();
  const [pendingNotice,setPendingNotice]=useState({count:0,key:''});
  const current=NAV.find(({href})=>href==='/photographer'?path===href:path.startsWith(href))??NAV[0];

  useEffect(()=>{
    let active=true;
    const load=()=>getAllBookings().then((items)=>{if(active){const pending=items.filter((item)=>item.status==='pending');setPendingNotice({count:pending.length,key:pending.map((item)=>item.id).sort().join('|')})}});
    void load();
    window.addEventListener('focus',load);
    window.addEventListener('booking-status-changed',load);
    const interval=window.setInterval(load,15000);
    return()=>{active=false;window.removeEventListener('focus',load);window.removeEventListener('booking-status-changed',load);window.clearInterval(interval)};
  },[]);

  const navigation=(mobile=false)=>NAV.map(({href,label,icon:Icon,notification})=>{
    const active=href==='/photographer'?path===href:path.startsWith(href);
    return <Link key={href} href={href} aria-current={active?'page':undefined} className={active?'is-active':''}>
      <span className="workspace-nav__icon"><Icon/>{notification&&pendingNotice.count>0&&<b className="booking-notification-pulse">{pendingNotice.count>9?'9+':pendingNotice.count}</b>}</span>
      <span>{mobile&&label==='Lịch chụp'?'Lịch':label}</span>{!mobile&&active&&<i/>}
    </Link>;
  });

  return <RoleGuard allow={['photographer']}>
    <div className="workspace-shell workspace-shell--photographer">
      <header className="workspace-header">
        <div className="workspace-header__brand">
          <BrandLogo compact/>
          <span className="workspace-header__divider"/>
          <div className="workspace-header__context"><span>Không gian thợ chụp</span><strong>{current.label}</strong></div>
        </div>
        <div className="workspace-header__account">
          <div className="workspace-user-copy"><span>Photographer</span><strong>{user?.full_name||'Thợ chụp'}</strong></div>
          <LogoutButton label="Đăng xuất"/>
        </div>
      </header>
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <div className="workspace-sidebar__intro"><span>Lịch làm việc</span><strong>Photographer</strong><p>Theo dõi booking và tiến độ buổi chụp.</p></div>
          <nav className="workspace-nav" aria-label="Điều hướng thợ chụp">{navigation()}</nav>
          <nav className="workspace-nav workspace-nav--account" aria-label="Tài khoản"><Link href="/profile"><span className="workspace-nav__icon"><UserRound/></span><span>Hồ sơ của tôi</span></Link></nav>
          <div className="workspace-sidebar__foot"><span>FIN PHOTO</span><p>Editorial photography</p></div>
        </aside>
        <main className="workspace-main">{children}</main>
      </div>
      <nav className="workspace-bottom-nav" aria-label="Điều hướng thợ chụp trên di động">{navigation(true)}<Link href="/profile"><span className="workspace-nav__icon"><UserRound/></span><span>Tôi</span></Link></nav>
      {!path.startsWith('/photographer/bookings')&&<BookingAlertToast key={pendingNotice.key} count={pendingNotice.count} title={`Có ${pendingNotice.count} booking mới chờ duyệt`} message="Nhấn để mở danh sách booking và xác nhận lịch cho khách." href="/photographer/bookings"/>}
    </div>
  </RoleGuard>;
}
