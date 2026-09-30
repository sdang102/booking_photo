'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import { getReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';
import BrandLogo from '@/components/BrandLogo';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [rating, setRating] = useState(0);
  useEffect(() => { getReviews({ publicOnly: true }).then(setReviews); }, []);
  const summary = reviewSummary(reviews);
  const filtered = reviews.filter((review) => !rating || review.rating === rating);

  return (
    <PublicMotionRoot>
      <main className="review-archive">
        <header className="review-archive__nav">
          <Link href="/#reviews"><ArrowLeft /> Trở về câu chuyện</Link><BrandLogo compact />
        </header>
        <section className="review-archive__hero" data-cinematic-section>
          <span>Client notes · Vol. 01</span>
          <h1>Những dòng<br /><em>còn ở lại.</em></h1>
          <div><strong>{summary.averageRating.toFixed(1)}</strong><span><Stars rating={Math.round(summary.averageRating)} />{summary.totalReviews} trải nghiệm đã được chia sẻ</span></div>
        </section>
        <section className="review-archive__body" data-cinematic-section>
          <div className="review-archive__filters">
            <div>{[0, 5, 4, 3, 2, 1].map((value) => <button key={value} onClick={() => setRating(value)} className={rating === value ? 'is-active' : ''}>{value ? `${value} sao` : 'Tất cả'}</button>)}</div>
            <span>Luxury Signature Portrait</span>
          </div>
          <div className="review-archive__list">
            {filtered.map((review, index) => (
              <article key={review.id} data-reveal>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <blockquote>“{review.comment}”</blockquote>
                <div><strong>{review.customer_name}</strong><small>Luxury Signature Portrait · {new Date(review.created_at).toLocaleDateString('vi-VN')}</small></div>
              </article>
            ))}
          </div>
          {!filtered.length && <p className="review-archive__empty">Chưa có đánh giá phù hợp bộ lọc.</p>}
        </section>
      </main>
    </PublicMotionRoot>
  );
}
