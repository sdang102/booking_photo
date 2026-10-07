'use client';

/* eslint-disable @next/next/no-img-element -- tiny admin review avatars are fixed-size and intentionally not optimized. */

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import { deleteReview, getReviews, updateReviewModeration } from '@/lib/services/reviewService';
import { DEFAULT_AVATAR_URL } from '@/lib/avatar';
import type { ExperienceReview } from '@/types';
import { refreshPublicContent } from '@/lib/client/revalidatePublicContent';

const PAGE_SIZE = 25;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    void getReviews({ limit: PAGE_SIZE }).then((items) => { setReviews(items); setHasMore(items.length === PAGE_SIZE); });
  }, []);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const items = await getReviews({ limit: PAGE_SIZE, offset: reviews.length });
      setReviews((current) => [...current, ...items]);
      setHasMore(items.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  const update = async (id: string, patch: Partial<Pick<ExperienceReview, 'is_public' | 'is_featured'>>) => {
    await updateReviewModeration(id, patch);
    setReviews((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    await refreshPublicContent();
  };

  const remove = async (review: ExperienceReview) => {
    if (!confirm(`Xóa vĩnh viễn đánh giá của “${review.customer_name}”?\n\nThao tác này không thể hoàn tác.`)) return;
    setMessage(''); setDeletingId(review.id);
    try {
      await deleteReview(review.id);
      setReviews((items) => items.filter((item) => item.id !== review.id));
      setMessage('Đã xóa đánh giá.');
      await refreshPublicContent();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể xóa đánh giá.');
    } finally { setDeletingId(''); }
  };

  return <>
    <p className="section-kicker">Admin</p>
    <h1 className="mt-2 text-3xl font-black">Quản lý đánh giá</h1>
    <p className="mt-2 text-sm text-slate-500">Ẩn/hiện, chọn nổi bật hoặc xóa vĩnh viễn. Nội dung khách viết không thể chỉnh sửa.</p>
    {message && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
    <div className="mt-8 space-y-4">
      {reviews.map((review) => <article key={review.id} className="rounded-2xl border border-sky-200 bg-white p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-amber-700"><img src={review.avatar_url || DEFAULT_AVATAR_URL} alt={`Ảnh đại diện của ${review.customer_name}`} width="40" height="40" loading="lazy" decoding="async" className="h-full w-full object-cover" /></span><h2 className="font-bold">{review.customer_name}</h2><span className="flex text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}</span><time className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</time></div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"><span>Service: {review.service_title}</span><span>Booking: {review.booking_id}</span></div>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-56">
            <button onClick={() => void update(review.id, { is_public: !review.is_public })} className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold">{review.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{review.is_public ? 'Đang công khai' : 'Đang ẩn'}</button>
            <button onClick={() => void update(review.id, { is_featured: !review.is_featured })} className={`rounded-xl px-3 py-2 text-xs font-bold ${review.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{review.is_featured ? '★ Đang nổi bật' : '☆ Chọn nổi bật'}</button>
            <button disabled={deletingId === review.id} onClick={() => void remove(review)} className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deletingId === review.id ? 'Đang xóa…' : 'Xóa đánh giá'}</button>
          </div>
        </div>
      </article>)}
      {!reviews.length && <div className="rounded-2xl border border-dashed border-sky-300 bg-white p-10 text-center text-sm text-slate-500">Chưa có đánh giá.</div>}
      {hasMore && <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="mx-auto block min-h-11 rounded-xl border border-sky-300 px-5 text-sm font-bold text-sky-800 disabled:opacity-60">{loadingMore ? 'Đang tải…' : 'Tải thêm đánh giá'}</button>}
    </div>
  </>;
}
