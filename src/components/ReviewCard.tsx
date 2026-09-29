'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check, Star } from 'lucide-react';
import type { ExperienceReview } from '@/types';

export function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return <div className="flex gap-0.5" aria-label={`${rating} trên 5 sao`}>{[1,2,3,4,5].map((star)=><Star key={star} className={`${size==='lg'?'h-6 w-6':'h-4 w-4'} ${star<=rating?'fill-amber-400 text-amber-400':'fill-transparent text-slate-300'}`}/>)}</div>;
}

export default function ReviewCard({ review }: { review: ExperienceReview }) {
  const [expanded,setExpanded]=useState(false);
  const long=review.comment.length>170;
  return <article className="flex h-full flex-col rounded-2xl border border-sky-200 bg-white p-6 shadow-sm"><Stars rating={review.rating}/><blockquote className={`mt-5 text-sm leading-7 text-slate-700 ${!expanded&&long?'line-clamp-4':''}`}>“{review.comment}”</blockquote>{long&&<button onClick={()=>setExpanded(!expanded)} className="mt-2 self-start text-xs font-bold text-sky-700">{expanded?'Thu gọn':'Xem thêm'}</button>}<div className="mt-6 border-t border-sky-100 pt-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">{review.customer_name}</h3><span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><Check className="h-3 w-3"/>Khách hàng đã chụp</span></div><time className="text-[10px] text-slate-500">{new Intl.DateTimeFormat('vi-VN',{month:'2-digit',year:'numeric'}).format(new Date(review.created_at))}</time></div><p className="mt-3 text-xs font-semibold text-slate-600">{review.service_title}</p>{review.portfolio_slug&&<Link href={`/portfolio/${review.portfolio_slug}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-700">Xem Bộ Ảnh <ArrowRight className="h-3 w-3"/></Link>}</div></article>;
}

