'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReviewCard, { Stars } from '@/components/ReviewCard';
import { getReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';
import BrandLogo from '@/components/BrandLogo';

export default function ReviewsPage() {
  const [reviews,setReviews]=useState<ExperienceReview[]>([]),[rating,setRating]=useState(0),[service,setService]=useState('all');
  useEffect(()=>{getReviews({publicOnly:true}).then(setReviews)},[]);
  const summary=reviewSummary(reviews);
  const services=useMemo(()=>Array.from(new Set(reviews.map((review)=>review.service_title))),[reviews]);
  const filtered=reviews.filter((review)=>(!rating||review.rating===rating)&&(service==='all'||review.service_title===service));
  return <main className="min-h-screen bg-[#fffcf7] text-slate-900"><header className="border-b border-sky-200 bg-white/90"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/#reviews" className="flex items-center gap-2 text-sm font-bold text-sky-700"><ArrowLeft className="h-4 w-4"/>Trang chủ</Link><BrandLogo compact /></div></header><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"><div className="text-center"><span className="section-kicker">Câu chuyện từ khách hàng</span><h1 className="mt-3 text-4xl font-black sm:text-6xl">Trải Nghiệm Từ Khách Hàng</h1><div className="mt-6 flex items-center justify-center gap-3"><strong className="text-3xl">{summary.averageRating.toFixed(1)}</strong><div><Stars rating={Math.round(summary.averageRating)}/><p className="mt-1 text-xs text-slate-500">{summary.totalReviews} đánh giá</p></div></div></div><div className="mt-10 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 overflow-x-auto">{[0,5,4,3,2,1].map((value)=><button key={value} onClick={()=>setRating(value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${rating===value?'bg-sky-600 text-white':'bg-slate-50 text-slate-600'}`}>{value?`${value} Sao`:'Tất Cả'}</button>)}</div><select value={service} onChange={(e)=>setService(e.target.value)} className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs text-slate-700"><option value="all">Tất Cả Dịch Vụ</option>{services.map((item)=><option key={item}>{item}</option>)}</select></div><div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{filtered.map((review)=><ReviewCard key={review.id} review={review}/>)}</div>{!filtered.length&&<p className="py-16 text-center text-slate-500">Chưa có đánh giá phù hợp bộ lọc.</p>}</section></main>;
}


