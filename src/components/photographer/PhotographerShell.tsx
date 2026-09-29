'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ClipboardList, Home, Star, UserRound } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import BookingAlertToast from '@/components/BookingAlertToast';
import { useAuth } from '@/lib/context/AuthContext';
import { getAllBookings } from '@/lib/services/bookingService';

const NAV=[
  {href:'/photographer',label:'Tổng quan',icon:Home},
  {href:'/photographer/schedule',label:'Lịch',icon:CalendarDays},
  {href:'/photographer/bookings',label:'Booking',icon:ClipboardList,notification:true},
  {href:'/photographer/reviews',label:'Đánh giá',icon:Star},
];

export default function PhotographerShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const {user}=useAuth();
  const [pendingNotice,setPendingNotice]=useState({count:0,key:''});

  useEffect(()=>{
    let active=true;
    const load=()=>getAllBookings().then((items)=>{if(active){const pending=items.filter((item)=>item.status==='pending');setPendingNotice({count:pending.length,key:pending.map((item)=>item.id).sort().join('|')})}});
    void load();
    window.addEventListener('focus',load);
    window.addEventListener('booking-status-changed',load);
    const interval=window.setInterval(load,15000);
    return()=>{active=false;window.removeEventListener('focus',load);window.removeEventListener('booking-status-changed',load);window.clearInterval(interval)};
  },[]);

  return <RoleGuard allow={['photographer']}><div className="min-h-screen bg-[#fffcf7] pb-24 text-slate-900">
    <header className="sticky top-0 z-40 border-b border-sky-200 bg-[#fffcf7]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4"><div className="flex min-w-0 items-center gap-3"><BrandLogo compact/><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-700">Photographer workspace</p><p className="max-w-40 truncate text-xs font-semibold">{user?.full_name}</p></div></div><div className="flex items-center gap-2"><span className="hidden rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase text-sky-800 sm:inline-flex">Thợ chụp</span><LogoutButton/></div></div></header>
    <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-sky-200 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto grid max-w-lg grid-cols-5 gap-1">{NAV.map(({href,label,icon:Icon,notification})=>{const active=href==='/photographer'?path===href:path.startsWith(href);return <Link key={href} href={href} className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl text-[10px] font-bold ${active?'bg-sky-100 text-sky-800':'text-slate-500'}`}><span className="relative"><Icon className="mb-1 h-5 w-5"/>{notification&&pendingNotice.count>0&&<span className="booking-notification-pulse absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-white">{pendingNotice.count>9?'9+':pendingNotice.count}</span>}</span>{label}</Link>})}<Link href="/profile" className="flex min-h-14 flex-col items-center justify-center rounded-xl text-[10px] font-bold text-slate-500"><UserRound className="mb-1 h-5 w-5"/>Tôi</Link></div></nav>
    {!path.startsWith('/photographer/bookings')&&<BookingAlertToast key={pendingNotice.key} count={pendingNotice.count} title={`Có ${pendingNotice.count} booking mới chờ duyệt`} message="Nhấn để mở danh sách booking và xác nhận lịch cho khách." href="/photographer/bookings"/>}
  </div></RoleGuard>;
}
