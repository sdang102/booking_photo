'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Camera, Clock, Layers3, MapPin, X, Check } from 'lucide-react';
import type { Service } from '@/types';

interface Props { service: Service; onBook: (serviceId: string) => void; }
export function formatVND(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount); }

export default function ServiceCard({ service, onBook }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const editedPhotos = service.edited_photos ?? Number(service.features.join(' ').match(/(\d+) ảnh chỉnh/i)?.[1] || 15);
  const concepts = service.concept_count ?? (service.category === 'wedding' ? 2 : 1);
  const locations = service.location_count ?? (service.category === 'wedding' ? '1–2 địa điểm' : '1 địa điểm');
  return <>
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sky-200 bg-elevated shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden"><Image src={service.image_url} alt={service.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />{service.is_popular && <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase text-brand-contrast">Được yêu thích</span>}</div>
      <div className="flex flex-1 flex-col p-5"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">{service.category.replace('-', ' ')}</span><h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">{service.title}</h3><p className="mt-3 text-xl font-black text-sky-700">{formatVND(service.price)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-sky-100 py-4 text-xs text-slate-600"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-sky-500"/>{Math.round(service.duration_minutes/60)} giờ</span><span className="flex items-center gap-2"><Camera className="h-4 w-4 text-sky-500"/>{editedPhotos} ảnh chỉnh</span><span className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-sky-500"/>{concepts} concept</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-500"/>{locations}</span></div>
        <div className="mt-auto flex gap-2 pt-5"><button onClick={()=>setDetailsOpen(true)} className="flex-1 rounded-xl border border-sky-300 px-3 py-2.5 text-xs font-bold text-sky-700">Xem Chi Tiết</button><button onClick={()=>onBook(service.id)} className="sky-button flex-1 rounded-xl px-3 py-2.5 text-xs font-bold">Đặt Lịch</button></div>
      </div>
    </article>
    {detailsOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md" onMouseDown={(e)=>e.target===e.currentTarget&&setDetailsOpen(false)}><div className="auth-dialog max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-sky-200 bg-elevated p-6 shadow-2xl"><div className="flex justify-between gap-4"><div><span className="section-kicker">Chi tiết gói</span><h3 className="mt-2 text-xl font-bold text-slate-900">{service.title}</h3></div><button onClick={()=>setDetailsOpen(false)} className="h-9 w-9 rounded-xl bg-slate-100 p-2"><X/></button></div><p className="mt-5 text-sm leading-relaxed text-slate-600">{service.description}</p><ul className="mt-6 space-y-3">{service.features.map((feature)=><li key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"/>{feature}</li>)}</ul><button onClick={()=>{setDetailsOpen(false);onBook(service.id)}} className="sky-button mt-7 w-full rounded-xl py-3">Đặt Gói Này</button></div></div>}
  </>;
}

