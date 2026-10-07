'use client';

/* eslint-disable @next/next/no-img-element -- review avatars/previews are small, user-generated media with fixed dimensions. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ExternalLink, Quote, Star, ThumbsUp, X } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import { getUserReviewLikes, toggleReviewLike as persistReviewLike } from '@/lib/services/reviewService';
import { useAuth } from '@/lib/context/AuthContext';
import type { ExperienceReview, PublicReviewCursor, PublicReviewPage, PublicReviewSummary } from '@/types';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';

export default function ReviewsPage({ initialPage, initialSummary }: { initialPage: PublicReviewPage; initialSummary: PublicReviewSummary }) {
  const [reviews, setReviews] = useState<ExperienceReview[]>(initialPage.reviews);
  const [nextCursor, setNextCursor] = useState<PublicReviewCursor | null>(initialPage.nextCursor);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<ExperienceReview | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => Object.fromEntries(initialPage.reviews.map((review) => [review.id, review.likes ?? 0])));
  const [clock, setClock] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { user } = useAuth();

  useEffect(() => { setClock(Date.now()); }, []);
  useEffect(() => {
    setLikeCounts(Object.fromEntries(reviews.map((review) => [review.id, review.likes ?? 0])));
    void getUserReviewLikes(reviews.map((review) => review.id)).then(setLikedIds);
  }, [reviews, user]);
  useEffect(() => {
    const id = window.location.hash.replace('#review-', '');
    if (id) setSelected(reviews.find((item) => item.id === id) ?? null);
  }, [reviews]);
  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    const previous = { bodyOverflow: document.body.style.overflow, bodyTouchAction: document.body.style.touchAction, bodyOverscroll: document.body.style.overscrollBehavior, htmlOverflow: document.documentElement.style.overflow };
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous.bodyOverflow; document.body.style.touchAction = previous.bodyTouchAction; document.body.style.overscrollBehavior = previous.bodyOverscroll; document.documentElement.style.overflow = previous.htmlOverflow; document.removeEventListener('keydown', close); };
  }, [selected]);

  const filtered = reviews.filter((review) => !rating || review.rating === rating);
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((value) => ({ value, count: initialSummary.distribution[value] ?? 0, percent: initialSummary.totalReviews ? (initialSummary.distribution[value] ?? 0) / initialSummary.totalReviews * 100 : 0 })), [initialSummary]);
  const featured = reviews.find((review) => review.is_featured) ?? reviews[0];
  const openReview = (review: ExperienceReview) => { setSelected(review); window.history.replaceState(null, '', `#review-${review.id}`); };
  const closeReview = () => { setSelected(null); window.history.replaceState(null, '', window.location.pathname); };
  const toggleLike = async (id: string) => {
    const wasLiked = likedIds.includes(id);
    setLikedIds((current) => wasLiked ? current.filter((value) => value !== id) : [...current, id]);
    setLikeCounts((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + (wasLiked ? -1 : 1)) }));
    const result = await persistReviewLike(id);
    if (result.success) {
      setLikedIds((current) => result.liked ? (current.includes(id) ? current : [...current, id]) : current.filter((value) => value !== id));
      setLikeCounts((current) => ({ ...current, [id]: result.likeCount }));
    } else if (user) {
      setLikedIds((current) => wasLiked ? [...current, id] : current.filter((value) => value !== id));
      setLikeCounts((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + (wasLiked ? 1 : -1)) }));
    }
  };
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
      <div className="fin-review-grid">{filtered.map((review) => {
        const expanded = expandedIds.includes(review.id);
        const photos = review.photos ?? [];
        const shownPhotos = photos.length > 3 ? photos.slice(0, 3) : photos;
        const likes = likeCounts[review.id] ?? review.likes ?? 0;
        return <article key={review.id} id={`review-${review.id}`} data-reveal><header className="fin-review-card__author"><div className="fin-review-card__identity"><span className="fin-review-card__avatar">{review.avatar_url ? <img src={review.avatar_url} alt="" width="44" height="44" loading="lazy" decoding="async" /> : review.customer_name.slice(0, 1)}</span><div><strong>{review.customer_name}</strong><small>{review.service_title}</small></div></div><time>{relativeTime(review.created_at)}</time></header><div className="fin-review-card__rating"><Stars rating={review.rating} /><span>{review.rating.toFixed(1)}</span><CheckCircle2 /></div><blockquote className={expanded ? 'is-expanded' : ''}>“{review.comment}”</blockquote>{review.comment.length > 210 && <button type="button" className="fin-review-card__more" onClick={() => setExpandedIds((current) => expanded ? current.filter((id) => id !== review.id) : [...current, review.id])}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}{shownPhotos.length > 0 && <div className="fin-review-grid__photos" aria-label={`Ảnh từ buổi chụp của ${review.customer_name}`}>{shownPhotos.map((photo, index) => { const overflow = index === 2 && photos.length > 3; return <button key={`${photo}-${index}`} type="button" className={overflow ? 'is-overflow' : ''} onClick={() => openReview(review)}><img src={photo} alt={`Ảnh buổi chụp ${index + 1}`} width="320" height="240" loading="lazy" decoding="async" />{overflow && <span>+{photos.length - 2}</span>}</button>; })}</div>}<footer><button type="button" className={likedIds.includes(review.id) ? 'is-liked' : ''} onClick={() => void toggleLike(review.id)} aria-label={`Thích đánh giá của ${review.customer_name}`}><ThumbsUp /> Thích ({likes})</button><button type="button" className="fin-review-card__read" onClick={() => openReview(review)}>Đọc đầy đủ <ArrowRight /></button></footer></article>;
      })}</div>
      {loadError && <p className="mt-6 text-center text-sm text-rose-700">{loadError}</p>}
      {nextCursor && <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="mx-auto mt-8 block rounded-xl border border-sky-300 px-5 py-3 text-sm font-bold disabled:opacity-60">{loadingMore ? 'Đang tải…' : 'Tải thêm đánh giá'}</button>}
      {!filtered.length && <p className="fin-review-empty">Chưa có đánh giá phù hợp với bộ lọc này.</p>}
    </div></section>
    <section className="fin-review-cta"><div className="fin-shell"><div><p className="fin-kicker"><span /> Trải nghiệm của riêng bạn</p><h2>Sẵn sàng tạo nên câu chuyện tiếp theo?</h2></div><Link href="/booking">Đặt lịch cùng FIN PHOTO <ArrowRight /></Link></div></section>
    {selected && <div className="review-detail" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeReview()}><section role="dialog" aria-modal="true" aria-labelledby="review-detail-title"><button type="button" className="review-detail__close" onClick={closeReview} aria-label="Đóng chi tiết đánh giá"><X /></button><Quote className="review-detail__quote-icon" aria-hidden="true" /><Stars rating={selected.rating} size="lg" /><blockquote id="review-detail-title">“{selected.comment}”</blockquote><div className="review-detail__author"><div><strong>{selected.customer_name}</strong><span><CheckCircle2 /> Đánh giá xác thực từ khách đã chụp</span></div><time>{new Date(selected.created_at).toLocaleDateString('vi-VN')}</time></div><p>{selected.service_title}</p>{(selected.photo_urls ?? selected.photos ?? []).length > 0 && <div className="review-detail__photos">{(selected.photo_urls ?? selected.photos ?? []).slice(0, 5).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`Ảnh buổi chụp ${index + 1}`} width="640" height="480" loading="lazy" decoding="async" />)}</div>}{selected.portfolio_slug ? <Link href={`/portfolio/${selected.portfolio_slug}`} className="review-detail__album">Xem bộ ảnh <ExternalLink /></Link> : <p className="review-detail__no-album">Bộ ảnh này chưa được chia sẻ công khai.</p>}</section></div>}
  </main></PublicMotionRoot>;
}
