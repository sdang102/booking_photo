'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ReviewCard, { Stars } from './ReviewCard';
import { getReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => getReviews({ publicOnly: true, featuredFirst: true }).then((items) => { if (active) setReviews(items); });
    void load();
    window.addEventListener('review-created', load);
    return () => { active = false; window.removeEventListener('review-created', load); };
  }, []);
  const summary = reviewSummary(reviews);
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);
  return (
    <section id="reviews" className="scroll-reveal bg-white/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl"><span className="section-kicker">Trải nghiệm thật</span><h2 className="section-title">Khách Hàng Nói Gì Về Trải Nghiệm Chụp?</h2><p className="section-copy">Những chia sẻ thật từ những khách hàng đã đồng hành cùng tôi trong các buổi chụp.</p></div>
          <div className="rounded-2xl border border-sky-200 bg-white px-6 py-4"><div className="flex items-center gap-3"><strong className="text-3xl font-black text-slate-900">{summary.averageRating.toFixed(1)}</strong><div><Stars rating={Math.round(summary.averageRating)} /><p className="mt-1 text-[11px] text-slate-500">Dựa trên {summary.totalReviews} đánh giá đã chụp</p></div></div></div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visibleReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
        {reviews.length > 3 && <div className="mt-9 text-center"><button type="button" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll} className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sm font-bold text-sky-700 transition-all hover:bg-sky-50">{showAll ? 'Thu Gọn Đánh Giá' : `Xem Thêm ${reviews.length - 3} Đánh Giá`} <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} /></button></div>}
      </div>
    </section>
  );
}

