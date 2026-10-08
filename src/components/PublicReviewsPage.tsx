'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, Quote, Star } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import type { ExperienceReview, PublicReviewCursor, PublicReviewPage, PublicReviewSummary } from '@/types';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import PublicReviewCard from './PublicReviewCard';
import PublicReviewDetail from './PublicReviewDetail';

export default function ReviewsPage({ initialPage, initialSummary }: { initialPage: PublicReviewPage; initialSummary: PublicReviewSummary }) {
  const [reviews, setReviews] = useState<ExperienceReview[]>(initialPage.reviews);
  const [nextCursor, setNextCursor] = useState<PublicReviewCursor | null>(initialPage.nextCursor);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<ExperienceReview | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [clock, setClock] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => { setClock(Date.now()); }, []);
  useEffect(() => {
    const id = window.location.hash.replace('#review-', '');
    if (id) setSelected(reviews.find((item) => item.id === id) ?? null);
  }, [reviews]);
  useEffect(() => {
    if (!selected) return;
    const previous = { bodyOverflow: document.body.style.overflow, bodyTouchAction: document.body.style.touchAction, bodyOverscroll: document.body.style.overscrollBehavior, htmlOverflow: document.documentElement.style.overflow };
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous.bodyOverflow; document.body.style.touchAction = previous.bodyTouchAction; document.body.style.overscrollBehavior = previous.bodyOverscroll; document.documentElement.style.overflow = previous.htmlOverflow; };
  }, [selected]);

  const filtered = reviews.filter((review) => !rating || review.rating === rating);
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((value) => ({ value, count: initialSummary.distribution[value] ?? 0, percent: initialSummary.totalReviews ? (initialSummary.distribution[value] ?? 0) / initialSummary.totalReviews * 100 : 0 })), [initialSummary]);
  const featured = reviews.find((review) => review.is_featured) ?? reviews[0];
  const openReview = (review: ExperienceReview) => { setSelected(review); window.history.replaceState(null, '', `#review-${review.id}`); };
  const closeReview = () => { setSelected(null); window.history.replaceState(null, '', window.location.pathname); };
  const relativeTime = (value: string) => {
    const days = clock ? Math.max(0, Math.floor((clock - new Date(value).getTime()) / 86400000)) : 0;
    if (days < 1) return 'Hôm nay';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
    return `${Math.floor(days / 365)} năm trước`;
  };
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true); setLoadError('');
    try {
      const query = new URLSearchParams({ created_at: nextCursor.created_at, id: nextCursor.id });
      const response = await fetch(`/api/public/reviews?${query.toString()}`);
      if (!response.ok) throw new Error('Không thể tải thêm đánh giá.');
      const page = await response.json() as PublicReviewPage;
      setReviews((current) => [...current, ...(page.reviews ?? [])]);
      setNextCursor(page.nextCursor ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không thể tải thêm đánh giá.');
    } finally { setLoadingMore(false); }
  };

  return <PublicMotionRoot><main className="fin-reviews-page fin-site">
    <section className="fin-review-hero"><div className="fin-shell"><div className="fin-review-hero__copy"><p className="fin-kicker"><span /> Cảm nhận đã xác thực</p><h1>Trải nghiệm thật.<br /><em>Câu chuyện thật.</em></h1><p>Những chia sẻ từ khách hàng đã hoàn thành buổi chụp cùng FIN PHOTO — minh bạch, nguyên bản và không chỉnh sửa nội dung.</p></div><aside className="fin-review-score" aria-label={`Điểm đánh giá trung bình ${initialSummary.averageRating} trên 5`}><div><strong>{initialSummary.averageRating.toFixed(1)}</strong><span>/ 5.0</span></div><Stars rating={Math.round(initialSummary.averageRating)} size="lg" /><p>{initialSummary.totalReviews} trải nghiệm đã xác thực</p><small><CheckCircle2 /> 100% từ khách hàng đã chụp</small></aside></div></section>
    <section className="fin-review-overview"><div className="fin-shell"><div className="fin-review-distribution"><header><span>Phân bố đánh giá</span><strong>{initialSummary.totalReviews} phản hồi</strong></header>{distribution.map((item) => <div key={item.value}><span>{item.value} <Star /></span><i><b style={{ width: `${item.percent}%` }} /></i><small>{item.count}</small></div>)}</div>{featured && <article className="fin-review-featured" data-reveal><Quote /><span>Chia sẻ nổi bật</span><blockquote>“{featured.comment}”</blockquote><footer><div><strong>{featured.customer_name}</strong><small>{featured.service_title}</small></div><span><CheckCircle2 /> Đã xác thực</span></footer></article>}</div></section>
    <section className="fin-review-library"><div className="fin-shell"><header className="fin-review-library__head"><div><p className="fin-kicker"><span /> Customer stories</p><h2>Khách hàng nói gì<br />về FIN PHOTO.</h2></div><p>Mỗi đánh giá được liên kết với một lịch chụp đã hoàn thành. Bạn có thể lọc theo số sao hoặc mở từng câu chuyện để xem đầy đủ.</p></header>
      <div className="fin-review-filters" aria-label="Lọc đánh giá">{[0, 5, 4, 3, 2, 1].map((value) => <button key={value} type="button" className={rating === value ? 'is-active' : ''} onClick={() => setRating(value)}>{value ? <>{value}<Star /></> : 'Tất cả'}<span>{value ? initialSummary.distribution[value] ?? 0 : initialSummary.totalReviews}</span></button>)}</div>
      <div className="fin-review-grid">{filtered.map((review) => <PublicReviewCard key={review.id} review={review} expanded={expandedIds.includes(review.id)} relativeTime={relativeTime} onToggleExpanded={() => setExpandedIds((current) => expandedIds.includes(review.id) ? current.filter((id) => id !== review.id) : [...current, review.id])} onOpen={() => openReview(review)} />)}</div>
      {loadError && <p className="mt-6 text-center text-sm text-rose-700">{loadError}</p>}
      {nextCursor && <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="mx-auto mt-8 block rounded-xl border border-sky-300 px-5 py-3 text-sm font-bold disabled:opacity-60">{loadingMore ? 'Đang tải…' : 'Tải thêm đánh giá'}</button>}
      {!filtered.length && <p className="fin-review-empty">Chưa có đánh giá phù hợp với bộ lọc này.</p>}
    </div></section>
    <section className="fin-review-cta"><div className="fin-shell"><div><p className="fin-kicker"><span /> Trải nghiệm của riêng bạn</p><h2>Sẵn sàng tạo nên câu chuyện tiếp theo?</h2></div><Link href="/booking">Đặt lịch cùng FIN PHOTO <ArrowRight /></Link></div></section>
    {selected && typeof document !== 'undefined' && createPortal(<PublicReviewDetail review={selected} onClose={closeReview} />, document.body)}
  </main></PublicMotionRoot>;
}
