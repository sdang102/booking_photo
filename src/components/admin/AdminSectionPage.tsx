'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  getBookingFinancialRecords,
  getBookingRevenueSummary,
  type BookingFinancialRecord,
  type BookingRevenueSummary,
} from '@/lib/services/bookingService';
import { formatVND } from '@/components/ServiceCard';

const PAGE_SIZE = 50;
const EMPTY_SUMMARY: BookingRevenueSummary = { total: 0, realized: 0, atVenue: 0, activeCount: 0 };
const AdminCrudPanel = dynamic(() => import('@/components/admin/AdminCrudPanel'), { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-2xl bg-sky-50" /> });
const titles:Record<string,string>={homepage:'Nội dung trang chủ',services:'Gói chụp',addons:'Dịch vụ bổ sung',categories:'Bộ lọc bộ sưu tập',portfolio:'Tác phẩm nổi bật',albums:'Album ảnh',locations:'Địa điểm',faq:'FAQ',media:'Media',reviews:'Đánh giá',revenue:'Doanh thu',settings:'Cài đặt'};

export default function AdminSectionPage({params}:{params:Promise<{section:string}>}){
  const{section}=use(params);
  const[bookings,setBookings]=useState<BookingFinancialRecord[]>([]);
  const[summary,setSummary]=useState<BookingRevenueSummary>(EMPTY_SUMMARY);
  const[hasMore,setHasMore]=useState(false);

  useEffect(()=>{
    if(section!=='revenue')return;
    Promise.all([getBookingRevenueSummary(),getBookingFinancialRecords({limit:PAGE_SIZE})]).then(([nextSummary,records])=>{
      setSummary(nextSummary);setBookings(records);setHasMore(records.length===PAGE_SIZE);
    });
  },[section]);

  const loadMore=async()=>{
    const records=await getBookingFinancialRecords({limit:PAGE_SIZE,offset:bookings.length});
    setBookings((current)=>[...current,...records]);
    setHasMore(records.length===PAGE_SIZE);
  };

  return <><p className="section-kicker">Admin</p><h1 className="mt-2 text-3xl font-black">{titles[section]||'Quản trị'}</h1><div className="mt-7"><SectionContent section={section} bookings={bookings} summary={summary} hasMore={hasMore} onLoadMore={()=>void loadMore()}/></div></>;
}

function SectionContent({section,bookings,summary,hasMore,onLoadMore}:{section:string;bookings:BookingFinancialRecord[];summary:BookingRevenueSummary;hasMore:boolean;onLoadMore:()=>void}){
  if(['homepage','services','addons','categories','portfolio','albums','locations','faq','settings'].includes(section))return <AdminCrudPanel section={section}/>;
  if(section==='media')return <Link href="/admin/media" className="sky-button inline-flex rounded-xl px-5 py-3">Mở thư viện Media</Link>;
  if(section==='reviews')return <Link href="/admin/reviews" className="sky-button inline-flex rounded-xl px-5 py-3">Mở quản lý đánh giá</Link>;
  if(section==='revenue')return <><div className="grid gap-4 sm:grid-cols-3"><Metric label="Tổng giá trị active" value={formatVND(summary.total)}/><Metric label="Doanh thu hoàn tất" value={formatVND(summary.realized)}/><Metric label="Thanh toán tại nơi chụp" value={formatVND(summary.atVenue)}/></div><div className="mt-6"><Table headers={['Thời gian','Dịch vụ','Tổng','Hình thức','Trạng thái']}>{bookings.map(x=><tr key={x.id}><Td>{x.booking_date}</Td><Td>{x.service_title}</Td><Td>{formatVND(x.total_price)}</Td><Td>Tại nơi chụp</Td><Td>{x.payment_status||'unpaid'}</Td></tr>)}</Table>{hasMore&&<button type="button" onClick={onLoadMore} className="mt-4 min-h-11 rounded-xl border border-sky-300 px-5 text-sm font-bold text-sky-800">Tải thêm</button>}</div></>;
  return <div className="rounded-2xl border border-sky-200 bg-white p-6">Không tìm thấy mục quản trị.</div>;
}
function Table({headers,children}:{headers:string[];children:React.ReactNode}){return <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-sky-50 text-xs uppercase text-slate-600"><tr>{headers.map(item=><th key={item} className="p-4">{item}</th>)}</tr></thead><tbody className="divide-y divide-sky-100">{children}</tbody></table></div>}
function Td({children}:{children:React.ReactNode}){return <td className="p-4 align-top">{children}</td>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-sky-200 bg-white p-5"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-xl">{value}</strong></div>}
