'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck2 } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/lib/context/AuthContext';
import { getUserBookings } from '@/lib/services/bookingService';

export default function Profile(){
  const{user}=useAuth();
  const[activeBookings,setActiveBookings]=useState(0);
  useEffect(()=>{if(user)getUserBookings(user.id,user.email).then((items)=>setActiveBookings(items.filter((item)=>!['completed','cancelled'].includes(item.status)).length))},[user]);
  return <RoleGuard allow={['user','photographer','admin']}><main className="min-h-screen bg-background p-4 sm:p-8"><header className="mx-auto flex max-w-3xl items-center justify-between"><Link href={user?.roles.includes('admin')?'/admin':user?.roles.includes('photographer')?'/photographer':'/'} className="text-sm font-bold text-sky-800">← Quay lại</Link><BrandLogo compact/></header><section className="mx-auto mt-10 max-w-xl rounded-3xl border border-sky-200 bg-elevated p-6 sm:p-8"><p className="section-kicker">Tài khoản</p><h1 className="mt-2 text-3xl font-black">Hồ sơ</h1>
  <Link href="/my-bookings" className="relative mt-6 flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 transition hover:-translate-y-0.5 hover:shadow-lg"><span className="booking-notification-pulse grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-brand-contrast"><CalendarCheck2 className="h-5 w-5"/></span><span><strong className="block">Lịch đã đặt & trạng thái đơn</strong><span className="mt-1 block text-xs text-red-700">Nhấn vào đây để theo dõi tiến trình booking của bạn.</span></span>{activeBookings>0&&<span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1 text-[10px] font-black text-brand-contrast ring-2 ring-elevated">{activeBookings>9?'9+':activeBookings}<span className="sr-only"> lịch đang hoạt động</span></span>}</Link>
    <dl className="mt-7 space-y-4 text-sm"><Row label="Họ tên" value={user?.full_name}/><Row label="Email" value={user?.email}/><Row label="Điện thoại" value={user?.phone||'Chưa cập nhật'}/><Row label="Quyền" value={user?.roles.join(', ')}/></dl><div className="mt-7">{user?.roles.includes('admin')&&<Link href="/admin" className="sky-button block rounded-xl px-4 py-3 text-center text-sm">Mở trang quản trị</Link>}{user?.roles.includes('photographer')&&<Link href="/photographer" className="sky-button block rounded-xl px-4 py-3 text-center text-sm">Mở workspace thợ chụp</Link>}</div></section></main></RoleGuard>;
}

function Row({label,value}:{label:string;value?:string}){return <div className="flex justify-between gap-4 border-b border-sky-100 pb-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-bold">{value}</dd></div>}
