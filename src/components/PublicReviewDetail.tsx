/* eslint-disable @next/next/no-img-element -- full review media comes from Supabase Storage URLs. */
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ExternalLink, Quote, X } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '@/lib/avatar';
import { useDialogFocus } from '@/lib/hooks/useDialogFocus';
import { Stars } from '@/components/ReviewCard';
import type { ExperienceReview } from '@/types';

export default function PublicReviewDetail({ review, onClose }: { review: ExperienceReview; onClose: () => void }) {
  const photos = (review.photo_urls ?? review.photos ?? []).slice(0, 5);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const closeActiveDialog = () => selectedPhoto ? setSelectedPhoto(null) : onClose();
  const dialogRef = useDialogFocus<HTMLDivElement>(true, closeActiveDialog);

  return <div ref={dialogRef} tabIndex={-1} className="review-detail" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeActiveDialog()}>
    <section role="dialog" aria-modal="true" aria-labelledby="review-detail-title" inert={selectedPhoto ? true : undefined}>
      <button type="button" className="review-detail__close" onClick={onClose} aria-label="Đóng chi tiết đánh giá"><X /></button>
      <Quote className="review-detail__quote-icon" aria-hidden="true" />
      <Stars rating={review.rating} size="lg" />
      <blockquote id="review-detail-title">“{review.comment}”</blockquote>
      <div className="review-detail__author">
        <div className="review-detail__author-info">
          <img className="review-detail__avatar" src={review.avatar_url || DEFAULT_AVATAR_URL} alt={`Ảnh đại diện của ${review.customer_name}`} width="48" height="48" loading="lazy" decoding="async" />
          <div><strong>{review.customer_name}</strong><span><CheckCircle2 /> Đánh giá xác thực từ khách đã chụp</span></div>
        </div>
        <time>{new Date(review.created_at).toLocaleDateString('vi-VN')}</time>
      </div>
      <p>{review.service_title}</p>
      {photos.length > 0 && <div className="review-detail__photos" aria-label={`Ảnh từ buổi chụp của ${review.customer_name}`}>
        {photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" className="review-detail__photo" onClick={() => setSelectedPhoto(photo)} aria-label={`Xem ảnh buổi chụp ${index + 1}`}><img src={photo} alt={`Ảnh buổi chụp ${index + 1}`} width="640" height="480" loading="lazy" decoding="async" /></button>)}
      </div>}
      {review.portfolio_slug && <Link href={`/portfolio/${review.portfolio_slug}`} className="review-detail__album">Xem bộ ảnh <ExternalLink /></Link>}
    </section>
    {selectedPhoto && <div className="review-photo-lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh đánh giá" onMouseDown={(event) => event.target === event.currentTarget && setSelectedPhoto(null)}>
      <button autoFocus type="button" className="review-photo-lightbox__close" onClick={() => setSelectedPhoto(null)} aria-label="Đóng ảnh"><X /></button>
      <img src={selectedPhoto} alt={`Ảnh buổi chụp của ${review.customer_name}`} />
    </div>}
  </div>;
}
