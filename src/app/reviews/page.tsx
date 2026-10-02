'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Quote, X } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import { getReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';
import BrandLogo from '@/components/BrandLogo';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<ExperienceReview | null>(null);

  useEffect(() => {
    getReviews({ publicOnly: true }).then((items) => {
      setReviews(items);
      const id = window.location.hash.replace('#review-', '');
      if (id) setSelected(items.find((item) => item.id === id) ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', close); };
  }, [selected]);

  const summary = reviewSummary(reviews);
  const filtered = reviews.filter((review) => !rating || review.rating === rating);
  const openReview = (review: ExperienceReview) => {
    setSelected(review);
    window.history.replaceState(null, '', `#review-${review.id}`);
  };
  const closeReview = () => {
    setSelected(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <PublicMotionRoot>
      <main className="review-archive">
        <header className="review-archive__nav">
          <Link href="/#reviews"><ArrowLeft /> Trở về trang chủ</Link><BrandLogo compact />
        </header>
        <section className="review-archive__hero" data-cinematic-section>
          <span>Đánh giá đã xác thực</span>
          <h1>Những lời kể<br /><em>từ khách hàng.</em></h1>
          <div><strong>{summary.averageRating.toFixed(1)}</strong><span><Stars rating={Math.round(summary.averageRating)} />{summary.totalReviews} trải nghiệm đã được chia sẻ</span></div>
        </section>
        <section className="review-archive__body" data-cinematic-section>
          <div className="review-archive__filters">
            <div>{[0, 5, 4, 3, 2, 1].map((value) => <button key={value} onClick={() => setRating(value)} className={rating === value ? 'is-active' : ''}>{value ? `${value} sao` : 'Tất cả'}</button>)}</div>
            <span><CheckCircle2 /> Chỉ khách đã hoàn thành buổi chụp mới có thể đánh giá</span>
          </div>
          <div className="review-archive__list">
            {filtered.map((review, index) => (
              <article key={review.id} id={`review-${review.id}`} data-reveal>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div className="review-archive__quote"><Stars rating={review.rating} /><blockquote>“{review.comment}”</blockquote></div>
                <div><strong>{review.customer_name}</strong><small>{review.service_title || 'Luxury Signature Portrait'} · {new Date(review.created_at).toLocaleDateString('vi-VN')}</small><small className="review-archive__verified"><CheckCircle2 /> Khách hàng đã chụp</small></div>
                <button type="button" onClick={() => openReview(review)} aria-label={`Xem chi tiết đánh giá của ${review.customer_name}`}><ArrowRight /></button>
              </article>
            ))}
          </div>
          {!filtered.length && <p className="review-archive__empty">Chưa có đánh giá phù hợp bộ lọc.</p>}
        </section>
      </main>

      {selected && <div className="review-detail" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeReview()}>
        <section role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
          <button type="button" className="review-detail__close" onClick={closeReview} aria-label="Đóng chi tiết đánh giá"><X /></button>
          <Quote className="review-detail__quote-icon" aria-hidden="true" />
          <Stars rating={selected.rating} size="lg" />
          <blockquote id="review-detail-title">“{selected.comment}”</blockquote>
          <div className="review-detail__author"><div><strong>{selected.customer_name}</strong><span><CheckCircle2 /> Đánh giá xác thực từ khách đã chụp</span></div><time>{new Date(selected.created_at).toLocaleDateString('vi-VN')}</time></div>
          <p>{selected.service_title || 'Luxury Signature Portrait'}</p>
          {selected.portfolio_slug ? <Link href={`/portfolio/${selected.portfolio_slug}`} className="review-detail__album">Xem bài đăng và bộ ảnh <ExternalLink /></Link> : <p className="review-detail__no-album">Khách hàng chưa chia sẻ bộ ảnh công khai.</p>}
        </section>
      </div>}
    </PublicMotionRoot>
  );
}
