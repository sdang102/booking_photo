'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { getPhotographerReviews, reviewSummary } from '@/lib/services/reviewService';
import type { ExperienceReview } from '@/types';

const PAGE_SIZE = 25;

export default function PhotographerReviewsPage() {
  const [items, setItems] = useState<ExperienceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const reviews = await getPhotographerReviews({ limit: PAGE_SIZE, offset: 0 });
      setItems(reviews); setHasMore(reviews.length === PAGE_SIZE);
    } catch { setError('Không thể tải đánh giá. Vui lòng kiểm tra kết nối và thử lại.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true); setError('');
    try {
      const reviews = await getPhotographerReviews({ limit: PAGE_SIZE, offset: items.length });
      setItems((current) => [...current, ...reviews]); setHasMore(reviews.length === PAGE_SIZE);
    } catch { setError('Không thể tải thêm đánh giá. Vui lòng thử lại.'); }
    finally { setLoadingMore(false); }
  };
  const summary = useMemo(() => reviewSummary(items), [items]);

  return <>
    <p className="section-kicker">Phản hồi khách hàng</p><h1 className="mt-2 text-3xl font-black">Đánh giá về buổi chụp của tôi</h1>
    {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{error}</p><button type="button" onClick={() => void load()} className="mt-2 font-bold underline">Thử lại từ đầu</button></div>}
    <div className="mt-5 flex gap-3"><div className="rounded-2xl border border-sky-200 bg-white p-4"><strong className="text-2xl">{summary.averageRating.toFixed(1)}</strong><p className="text-xs text-slate-500">Điểm trong danh sách đã tải</p></div><div className="rounded-2xl border border-sky-200 bg-white p-4"><strong className="text-2xl">{summary.totalReviews}</strong><p className="text-xs text-slate-500">Đánh giá công khai đã tải</p></div></div>
    <div className="mt-7 space-y-4" aria-busy={loading || loadingMore}>
      {loading && <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải đánh giá…</div>}
      {items.map((item) => <article key={item.id} className="rounded-2xl border border-sky-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{item.customer_name}</strong><p className="mt-1 text-xs text-slate-500">{item.service_title} · {new Date(item.created_at).toLocaleDateString('vi-VN')}</p></div><span className="flex text-amber-400" aria-label={`${item.rating} trên 5 sao`}>{Array.from({ length: item.rating }).map((_, index) => <Star aria-hidden="true" key={index} className="h-4 w-4 fill-current" />)}</span></div><p className="mt-4 text-sm leading-7 text-slate-700">{item.comment}</p></article>)}
      {!loading && !error && !items.length && <div className="rounded-2xl border border-dashed border-sky-300 bg-white p-10 text-center"><MessageSquare className="mx-auto h-8 w-8 text-sky-500" /><h2 className="mt-3 font-black">Chưa có đánh giá</h2><p className="mt-1 text-sm text-slate-500">Đánh giá của khách sau các booking được giao cho bạn sẽ xuất hiện tại đây.</p></div>}
      {hasMore && <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="mx-auto block rounded-xl border border-sky-300 px-5 py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60">{loadingMore ? 'Đang tải…' : 'Tải thêm đánh giá'}</button>}
    </div>
  </>;
}
