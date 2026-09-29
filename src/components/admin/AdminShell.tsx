'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Cog, HelpCircle, Home, ImageIcon, LayoutDashboard, MapPin, MessageSquare, Package, Tags } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import BrandLogo from '@/components/BrandLogo';
import LogoutButton from '@/components/LogoutButton';

const NAV=[
  {href:'/admin',label:'Dashboard',icon:LayoutDashboard,exact:true},
  {href:'/admin/homepage',label:'Trang chủ',icon:Home},
  {href:'/admin/services',label:'Gói chụp',icon:Package},
  {href:'/admin/categories',label:'Danh mục',icon:Tags},
  {href:'/admin/portfolio',label:'Portfolio',icon:ImageIcon},
  {href:'/admin/albums',label:'Albums',icon:ImageIcon},
  {href:'/admin/locations',label:'Địa điểm',icon:MapPin},
  {href:'/admin/faq',label:'FAQ',icon:HelpCircle},
  {href:'/admin/media',label:'Media',icon:ImageIcon},
  {href:'/admin/reviews',label:'Đánh giá',icon:MessageSquare},
  {href:'/admin/revenue',label:'Doanh thu',icon:BarChart3},
  {href:'/admin/settings',label:'Cài đặt',icon:Cog},
];

export default function AdminShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  return <RoleGuard allow={['admin']}><div className="min-h-screen bg-[#fffcf7] text-slate-900"><header className="sticky top-0 z-50 border-b border-sky-200 bg-[#fffcf7]/95 backdrop-blur-xl"><div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-7"><div className="flex items-center gap-3"><BrandLogo compact/><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-700">Admin workspace</p><strong className="text-sm">BACK OFFICE</strong></div></div><LogoutButton/></div></header><div className="lg:grid lg:grid-cols-[270px_minmax(0,1fr)]"><aside className="border-b border-sky-200 bg-white lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r"><nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:p-5">{NAV.map(({href,label,icon:Icon,exact})=>{const active=exact?path===href:path===href||path.startsWith(`${href}/`);return <Link key={href} href={href} className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors lg:mb-1 ${active?'bg-[#fff3df] text-[#8b5b21]':'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="h-4 w-4"/>{label}</Link>})}</nav></aside><main className="min-w-0 p-4 sm:p-7 lg:p-10">{children}</main></div></div></RoleGuard>;
}
