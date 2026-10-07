/* eslint-disable @next/next/no-img-element -- full review media comes from Supabase Storage URLs. */
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Quote, X } from 'lucide-react';
import { Stars } from '@/components/ReviewCard';
import type { ExperienceReview } from '@/types';

export default function PublicReviewDetail({ review, onClose }: { review: ExperienceReview; onClose: () => void }) {
  const photos = (review.photo_urls ?? review.photos ?? []).slice(0, 5);
  return <div className="review-detail" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="review-detail-title"><button type="button" className="review-detail__close" onClick={onClose} aria-label="Đóng chi tiết đánh giá"><X /></button><Quote className="review-detail__quote-icon" aria-hidden="true" /><Stars rating={review.rating} size="lg" /><blockquote id="review-detail-title">“{review.comment}”</blockquote><div className="review-detail__author"><div><strong>{review.customer_name}</strong><span><CheckCircle2 /> Đánh giá xác thực từ khách đã chụp</span></div><time>{new Date(review.created_at).toLocaleDateString('vi-VN')}</time></div><p>{review.service_title}</p>{photos.length > 0 && <div className="review-detail__photos">{photos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`Ảnh buổi chụp ${index + 1}`} width="640" height="480" loading="lazy" decoding="async" />)}</div>}{review.portfolio_slug ? <Link href={`/portfolio/${review.portfolio_slug}`} className="review-detail__album">Xem bộ ảnh <ExternalLink /></Link> : <p className="review-detail__no-album">Bộ ảnh này chưa được chia sẻ công khai.</p>}</section></div>;
}
