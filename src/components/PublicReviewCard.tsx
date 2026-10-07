/* eslint-disable @next/next/no-img-element -- review avatars/previews are small, user-generated media with fixed dimensions. */
import { ArrowRight, CheckCircle2, ThumbsUp } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import type { ExperienceReview } from '@/types';

export default function PublicReviewCard({ review, expanded, liked, likes, relativeTime, onToggleExpanded, onOpen, onToggleLike }: {
  review: ExperienceReview;
  expanded: boolean;
  liked: boolean;
  likes: number;
  relativeTime: (value: string) => string;
  onToggleExpanded: () => void;
  onOpen: () => void;
  onToggleLike: () => void;
}) {
  const photos = review.photos ?? [];
  const shownPhotos = photos.length > 3 ? photos.slice(0, 3) : photos;
  return <article id={`review-${review.id}`} data-reveal><header className="fin-review-card__author"><div className="fin-review-card__identity"><span className="fin-review-card__avatar">{review.avatar_url ? <img src={review.avatar_url} alt="" width="44" height="44" loading="lazy" decoding="async" /> : review.customer_name.slice(0, 1)}</span><div><strong>{review.customer_name}</strong><small>{review.service_title}</small></div></div><time>{relativeTime(review.created_at)}</time></header><div className="fin-review-card__rating"><Stars rating={review.rating} /><span>{review.rating.toFixed(1)}</span><CheckCircle2 /></div><blockquote className={expanded ? 'is-expanded' : ''}>“{review.comment}”</blockquote>{review.comment.length > 210 && <button type="button" className="fin-review-card__more" onClick={onToggleExpanded}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}{shownPhotos.length > 0 && <div className="fin-review-grid__photos" aria-label={`Ảnh từ buổi chụp của ${review.customer_name}`}>{shownPhotos.map((photo, index) => { const overflow = index === 2 && photos.length > 3; return <button key={`${photo}-${index}`} type="button" className={overflow ? 'is-overflow' : ''} onClick={onOpen}><img src={photo} alt={`Ảnh buổi chụp ${index + 1}`} width="320" height="240" loading="lazy" decoding="async" />{overflow && <span>+{photos.length - 2}</span>}</button>; })}</div>}<footer><button type="button" className={liked ? 'is-liked' : ''} onClick={onToggleLike} aria-label={`Thích đánh giá của ${review.customer_name}`}><ThumbsUp /> Thích ({likes})</button><button type="button" className="fin-review-card__read" onClick={onOpen}>Đọc đầy đủ <ArrowRight /></button></footer></article>;
}
