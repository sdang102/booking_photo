'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ExternalLink, Quote, Star, X } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import { getReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import { FinFooter } from '@/components/FinPhotoSections';
import { MOCK_REVIEWS } from '@/lib/data/mockData';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ExperienceReview[]>(MOCK_REVIEWS);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<ExperienceReview | null>(null);

  useEffect(() => {
    getReviews({ publicOnly: true, featuredFirst: true }).then((items) => {
      const visibleItems = items.length ? items : MOCK_REVIEWS;
      setReviews(visibleItems);
      const id = window.location.hash.replace('#review-', '');
      if (id) setSelected(visibleItems.find((item) => item.id === id) ?? null);
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
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map(value => ({
    value,
    count: reviews.filter(review => review.rating === value).length,
    percent: reviews.length ? reviews.filter(review => review.rating === value).length / reviews.length * 100 : 0,
  })), [reviews]);
  const featured = reviews.find(review => review.is_featured) ?? reviews[0];
  const openReview = (review: ExperienceReview) => {
    setSelected(review);
    window.history.replaceState(null, '', `#review-${review.id}`);
  };
  const closeReview = () => {
    setSelected(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  return <PublicMotionRoot><main className="fin-reviews-page fin-site">
    <PublicSiteHeader />
    <section className="fin-review-hero"><div className="fin-shell">
      <div className="fin-review-hero__copy"><p className="fin-kicker"><span /> Cảm nhận đã xác thực</p><h1>Trải nghiệm thật.<br /><em>Câu chuyện thật.</em></h1><p>Những chia sẻ từ khách hàng đã hoàn thành buổi chụp cùng FIN PHOTO — minh bạch, nguyên bản và không chỉnh sửa nội dung.</p></div>
      <aside className="fin-review-score" aria-label={`Điểm đánh giá trung bình ${summary.averageRating} trên 5`}><div><strong>{summary.averageRating.toFixed(1)}</strong><span>/ 5.0</span></div><Stars rating={Math.round(summary.averageRating)} size="lg" /><p>{summary.totalReviews} trải nghiệm đã xác thực</p><small><CheckCircle2 /> 100% từ khách hàng đã chụp</small></aside>
    </div></section>

    <section className="fin-review-overview"><div className="fin-shell">
      <div className="fin-review-distribution"><header><span>Phân bố đánh giá</span><strong>{summary.totalReviews} phản hồi</strong></header>{distribution.map(item => <div key={item.value}><span>{item.value} <Star /></span><i><b style={{ width: `${item.percent}%` }} /></i><small>{item.count}</small></div>)}</div>
      {featured && <article className="fin-review-featured" data-reveal><Quote /><span>Chia sẻ nổi bật</span><blockquote>“{featured.comment}”</blockquote><footer><div><strong>{featured.customer_name}</strong><small>{featured.service_title}</small></div><span><CheckCircle2 /> Đã xác thực</span></footer></article>}
    </div></section>

    <section className="fin-review-library"><div className="fin-shell">
      <header className="fin-review-library__head"><div><p className="fin-kicker"><span /> Customer stories</p><h2>Khách hàng nói gì<br />về FIN PHOTO.</h2></div><p>Mỗi đánh giá được liên kết với một lịch chụp đã hoàn thành. Bạn có thể lọc theo số sao hoặc mở từng câu chuyện để xem đầy đủ.</p></header>
      <div className="fin-review-filters" aria-label="Lọc đánh giá">{[0, 5, 4, 3, 2, 1].map(value => <button key={value} type="button" className={rating === value ? 'is-active' : ''} onClick={() => setRating(value)}>{value ? <>{value}<Star /></> : 'Tất cả'}<span>{value ? reviews.filter(review => review.rating === value).length : reviews.length}</span></button>)}</div>
      <div className="fin-review-grid">{filtered.map(review => <article key={review.id} id={`review-${review.id}`} data-reveal>
        <header><Stars rating={review.rating} /><span><CheckCircle2 /> Đã xác thực</span></header>
        <Quote className="fin-review-grid__quote" />
        <blockquote>“{review.comment}”</blockquote>
        <footer><div><strong>{review.customer_name}</strong><small>{review.service_title} · {new Date(review.created_at).toLocaleDateString('vi-VN')}</small></div><button type="button" onClick={() => openReview(review)} aria-label={`Đọc đầy đủ đánh giá của ${review.customer_name}`}><ArrowRight /></button></footer>
      </article>)}</div>
      {!filtered.length && <p className="fin-review-empty">Chưa có đánh giá phù hợp với bộ lọc này.</p>}
    </div></section>
    <section className="fin-review-cta"><div className="fin-shell"><div><p className="fin-kicker"><span /> Trải nghiệm của riêng bạn</p><h2>Sẵn sàng tạo nên câu chuyện tiếp theo?</h2></div><Link href="/booking">Đặt lịch cùng FIN PHOTO <ArrowRight /></Link></div></section>
    <FinFooter />
  </main>

  {selected && <div className="review-detail" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeReview()}><section role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
    <button type="button" className="review-detail__close" onClick={closeReview} aria-label="Đóng chi tiết đánh giá"><X /></button><Quote className="review-detail__quote-icon" aria-hidden="true" /><Stars rating={selected.rating} size="lg" /><blockquote id="review-detail-title">“{selected.comment}”</blockquote>
    <div className="review-detail__author"><div><strong>{selected.customer_name}</strong><span><CheckCircle2 /> Đánh giá xác thực từ khách đã chụp</span></div><time>{new Date(selected.created_at).toLocaleDateString('vi-VN')}</time></div><p>{selected.service_title}</p>
    {selected.portfolio_slug ? <Link href={`/portfolio/${selected.portfolio_slug}`} className="review-detail__album">Xem bộ ảnh <ExternalLink /></Link> : <p className="review-detail__no-album">Bộ ảnh này chưa được chia sẻ công khai.</p>}
  </section></div>}
  </PublicMotionRoot>;
}
