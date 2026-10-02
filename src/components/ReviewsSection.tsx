'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Quote, Star } from 'lucide-react';
import { getReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';

const luxuryReviewImages = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=86',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=86',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=86',
];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = () => getReviews({ publicOnly: true, featuredFirst: true }).then((items) => { if (mounted) { setReviews(items); setLoading(false); } });
    void load();
    window.addEventListener('review-created', load);
    return () => { mounted = false; window.removeEventListener('review-created', load); };
  }, []);

  if (!reviews.length) return <section id="reviews" className="review-story review-story--empty" data-cinematic-section>
    <div className="review-story__media"><Image src={luxuryReviewImages[0]} alt="Không gian chụp Luxury Portrait" fill sizes="(max-width: 899px) 100vw, 45vw" className="object-cover" /></div>
    <div className="review-story__copy">
      <div className="review-story__meta"><span>Đánh giá từ khách hàng</span><span>Trải nghiệm đã xác thực</span></div>
      <Quote aria-hidden="true" />
      <h2>{loading ? 'Đang tải những chia sẻ từ khách hàng…' : 'Những câu chuyện thật sẽ xuất hiện tại đây.'}</h2>
      <p>{loading ? 'Chỉ một chút nữa thôi.' : 'Hiện chưa có đánh giá công khai. Chỉ khách đã hoàn thành buổi chụp mới có thể để lại đánh giá.'}</p>
      <Link href="/reviews">Xem trang đánh giá <ArrowRight /></Link>
    </div>
  </section>;
  const item = reviews[active % reviews.length];
  const summary = reviewSummary(reviews);
  const image = luxuryReviewImages[active % luxuryReviewImages.length];
  const quote = item.comment.length > 220 ? `${item.comment.slice(0, 217).trimEnd()}…` : item.comment;
  const move = (direction: number) => setActive((current) => (current + direction + reviews.length) % reviews.length);

  return (
    <section id="reviews" className="review-story" data-cinematic-section>
      <div className="review-story__media" data-section-depth="0.25">
        <Image key={image} src={image} alt="Khoảnh khắc trong buổi chụp" fill sizes="(max-width: 899px) 100vw, 45vw" className="object-cover" />
      </div>
      <div className="review-story__copy" data-reveal data-reveal-type="mask">
        <div className="review-story__meta">
          <span>Cảm nhận từ khách hàng</span>
          <span>{summary.averageRating.toFixed(1)} / 5 · {summary.totalReviews} câu chuyện thật</span>
        </div>
        <Quote aria-hidden="true" />
        <div className="review-story__rating" aria-label={`${item.rating} trên 5 sao`}>
          {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={star <= item.rating ? 'is-filled' : ''} />)}
          <span><CheckCircle2 /> Đánh giá từ khách đã chụp</span>
        </div>
        <blockquote key={item.id}>“{quote}”</blockquote>
        <div className="review-story__person">
          <p>{item.customer_name}</p>
          <span>Luxury Signature Portrait · {new Date(item.created_at).getFullYear()}</span>
        </div>
        <div className="review-story__controls">
          <button onClick={() => move(-1)} aria-label="Cảm nhận trước"><ArrowLeft /></button>
          <span>{String(active + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}</span>
          <button onClick={() => move(1)} aria-label="Cảm nhận tiếp theo"><ArrowRight /></button>
          <Link href={`/reviews#review-${item.id}`}>Xem chi tiết</Link>
          <Link href="/reviews">Tất cả đánh giá</Link>
        </div>
      </div>
    </section>
  );
}
