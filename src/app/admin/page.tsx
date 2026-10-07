'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, FileText, ImageIcon, MessageSquare, Package, Settings, Sparkles } from 'lucide-react';
import { getBookingRevenueSummary, type BookingRevenueSummary } from '@/lib/services/bookingService';
import { formatVND } from '@/components/ServiceCard';

const modules=[
  {href:'/admin/homepage',label:'Quản lý trang chủ',description:'Sửa banner, giới thiệu, quy trình và CTA.',icon:Sparkles},
  {href:'/admin/services',label:'Gói chụp',description:'Thêm, sửa, ẩn giá và nội dung dịch vụ.',icon:Package},
  {href:'/admin/portfolio',label:'Portfolio & album',description:'Quản lý album và hình ảnh công khai.',icon:ImageIcon},
  {href:'/admin/locations',label:'Địa điểm & FAQ',description:'Cập nhật các nội dung hỗ trợ khách hàng.',icon:FileText},
  {href:'/admin/reviews',label:'Kiểm duyệt đánh giá',description:'Ẩn, hiện và chọn đánh giá nổi bật.',icon:MessageSquare},
  {href:'/admin/settings',label:'Cài đặt website',description:'Thông tin liên hệ, chính sách và SEO.',icon:Settings},
];

export default function AdminDashboardPage(){
  const[report,setReport]=useState<BookingRevenueSummary>({total:0,realized:0,atVenue:0,activeCount:0});
  useEffect(()=>{getBookingRevenueSummary().then(setReport)},[]);
  return <><div className="max-w-2xl"><p className="section-kicker">Tổng quan</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Quản lý nội dung và kinh doanh</h1><p className="mt-3 text-sm leading-6 text-slate-600">Admin quản lý website, báo cáo doanh thu và kiểm duyệt đánh giá. Duyệt lịch, liên hệ khách và vận hành buổi chụp thuộc giao diện Photographer.</p></div><section className="mt-8"><div className="flex items-center justify-between"><h2 className="text-lg font-black">Báo cáo doanh thu</h2><Link href="/admin/revenue" className="text-xs font-bold text-sky-700">Xem chi tiết →</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Giá trị booking active" value={formatVND(report.total)}/><Metric label="Doanh thu hoàn tất" value={formatVND(report.realized)}/><Metric label="Thanh toán tại nơi chụp" value={formatVND(report.atVenue)}/><Metric label="Booking đang hoạt động" value={`${report.activeCount} lịch`}/></div></section><section className="mt-10"><h2 className="text-lg font-black">Quản trị website</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map(({href,label,description,icon:Icon})=><Link key={href} href={href} className="group rounded-2xl border border-sky-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg"><span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700"><Icon className="h-5 w-5"/></span><h3 className="mt-4 font-black group-hover:text-sky-700">{label}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></Link>)}</div></section></>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-sky-200 bg-white p-5"><BarChart3 className="h-4 w-4 text-sky-600"/><p className="mt-3 text-xs text-slate-500">{label}</p><strong className="mt-1 block text-xl">{value}</strong></div>}
