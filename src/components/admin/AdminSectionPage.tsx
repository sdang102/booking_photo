'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminCrudPanel from '@/components/admin/AdminCrudPanel';
import { getAllBookings } from '@/lib/services/bookingService';
import type { BookingPhotoRecord } from '@/types';
import { formatVND } from '@/components/ServiceCard';

const titles:Record<string,string>={homepage:'Nội dung trang chủ',services:'Gói chụp',addons:'Dịch vụ bổ sung',categories:'Bộ lọc bộ sưu tập',portfolio:'Tác phẩm nổi bật',albums:'Album ảnh',locations:'Địa điểm',faq:'FAQ',media:'Media',reviews:'Đánh giá',revenue:'Doanh thu',settings:'Cài đặt'};

export default function AdminSectionPage({params}:{params:Promise<{section:string}>}){
  const{section}=use(params);const[bookings,setBookings]=useState<BookingPhotoRecord[]>([]);
  useEffect(()=>{if(section==='revenue')getAllBookings().then(setBookings)},[section]);
  const revenue=useMemo(()=>bookings.filter(item=>item.status!=='cancelled').reduce((sum,item)=>sum+item.total_price,0),[bookings]);
  return <><p className="section-kicker">Admin</p><h1 className="mt-2 text-3xl font-black">{titles[section]||'Quản trị'}</h1><div className="mt-7"><SectionContent section={section} bookings={bookings} revenue={revenue}/></div></>;
}

function SectionContent({section,bookings,revenue}:{section:string;bookings:BookingPhotoRecord[];revenue:number}){
  if(['homepage','services','addons','categories','portfolio','albums','locations','faq','settings'].includes(section))return <AdminCrudPanel section={section}/>;
  if(section==='media')return <Link href="/admin/media" className="sky-button inline-flex rounded-xl px-5 py-3">Mở thư viện Media</Link>;
  if(section==='reviews')return <Link href="/admin/reviews" className="sky-button inline-flex rounded-xl px-5 py-3">Mở quản lý đánh giá</Link>;
  if(section==='revenue')return <><div className="grid gap-4 sm:grid-cols-3"><Metric label="Tổng giá trị active" value={formatVND(revenue)}/><Metric label="Doanh thu hoàn tất" value={formatVND(bookings.filter(x=>x.status==='completed').reduce((n,x)=>n+x.total_price,0))}/><Metric label="Thanh toán tại nơi chụp" value={formatVND(bookings.filter(x=>!['cancelled','completed'].includes(x.status)).reduce((n,x)=>n+x.total_price,0))}/></div><div className="mt-6"><Table headers={['Thời gian','Dịch vụ','Tổng','Hình thức','Trạng thái']}>{bookings.filter(x=>x.status!=='cancelled').map(x=><tr key={x.id}><Td>{x.booking_date}</Td><Td>{x.service_title}</Td><Td>{formatVND(x.total_price)}</Td><Td>Tại nơi chụp</Td><Td>{x.payment_status||'unpaid'}</Td></tr>)}</Table></div></>;
  return <div className="rounded-2xl border border-sky-200 bg-white p-6">Không tìm thấy mục quản trị.</div>;
}
function Table({headers,children}:{headers:string[];children:React.ReactNode}){return <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-sky-50 text-xs uppercase text-slate-600"><tr>{headers.map(item=><th key={item} className="p-4">{item}</th>)}</tr></thead><tbody className="divide-y divide-sky-100">{children}</tbody></table></div>}
function Td({children}:{children:React.ReactNode}){return <td className="p-4 align-top">{children}</td>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-sky-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-xl">{value}</strong></div>}
