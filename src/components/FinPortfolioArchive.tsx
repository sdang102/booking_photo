'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, MapPin } from 'lucide-react';
import type { PortfolioAlbum } from '@/types';
import PublicMotionRoot from './motion/PublicMotionRoot';
import ResponsiveAlbumImage from './ResponsiveAlbumImage';

interface AlbumCoverPage {
  albums: PortfolioAlbum[];
  nextOffset: number | null;
  total: number;
}

export default function FinPortfolioArchive({
  albums: initialAlbums = [],
  categories: initialCategories = [],
  initialNextOffset = null,
  initialTotal = initialAlbums.length,
}: {
  albums?: PortfolioAlbum[];
  categories?: Array<{ slug: string; name: string }>;
  initialNextOffset?: number | null;
  initialTotal?: number;
}) {
  const [albums, setAlbums] = useState<PortfolioAlbum[]>(initialAlbums);
  const [categories] = useState<Array<{ slug: string; name: string }>>(initialCategories);
  const [filter, setFilter] = useState('all');
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const visible = filter === 'all' ? albums : albums.filter((item) => item.category === filter);
  const filters = [{ id: 'all', label: 'Tất cả tác phẩm' }, ...categories.map((item) => ({ id: item.slug, label: item.name }))];

  const loadMore = async () => {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    setLoadError('');
    try {
      const response = await fetch(`/api/public/albums?offset=${nextOffset}&limit=24`);
      if (!response.ok) throw new Error('Không thể tải thêm album.');
      const page = await response.json() as AlbumCoverPage;
      setAlbums((current) => [...current, ...(page.albums ?? [])]);
      setNextOffset(page.nextOffset ?? null);
      setTotal(page.total ?? total);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không thể tải thêm album.');
    } finally {
      setLoadingMore(false);
    }
  };

  return <PublicMotionRoot><main className="fin-archive fin-site">
    <section className="fin-archive__hero"><div className="fin-shell"><div><p className="fin-kicker"><span /> FIN PHOTO archive</p><h1>Lưu trữ tác phẩm<br /><em>&amp; dự án sáng tạo.</em></h1><p>Mỗi bộ ảnh là một cuộc đối thoại giữa ánh sáng, nhân vật và không gian — được tuyển chọn từ hành trình sáng tác của FIN PHOTO.</p></div><div className="fin-archive__count"><strong>{String(total).padStart(2, '0')}</strong><span>Tác phẩm lưu trữ</span><ArrowDown /></div></div></section>
    <section className="fin-archive__body"><div className="fin-shell">
      <div className="fin-archive__filters" aria-label="Lọc bộ sưu tập">{filters.map((item) => <button key={item.id} type="button" className={filter === item.id ? 'is-active' : ''} onClick={() => setFilter(item.id)}>{item.label}<span>{item.id === 'all' ? total : albums.filter((album) => album.category === item.id).length}</span></button>)}</div>
      <div className="fin-archive__grid">{visible.map((album, index) => <Link href={`/portfolio/${album.slug}`} key={album.id} className={`fin-project fin-project--${index % 6}`}>
        <div className="fin-project__media"><ResponsiveAlbumImage album={album} /></div>
        <div className="fin-project__copy"><span>{album.category.replace('-', ' ')} · 2026</span><h2>{album.title}</h2>{album.location && <p><MapPin /> {album.location}</p>}<i>Xem dự án <ArrowRight /></i></div>
      </Link>)}</div>
      {!visible.length && <p className="fin-archive__empty">Chưa có tác phẩm trong danh mục này.</p>}
      {loadError && <p className="mt-6 text-center text-sm text-rose-700">{loadError}</p>}
      {nextOffset !== null && <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="mx-auto mt-8 block rounded-xl border border-sky-300 bg-white px-5 py-3 text-sm font-bold text-sky-800 disabled:opacity-60">{loadingMore ? 'Đang tải…' : 'Tải thêm album'}</button>}
    </div></section>
  </main></PublicMotionRoot>;
}
