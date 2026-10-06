'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, MapPin } from 'lucide-react';
import type { PortfolioAlbum } from '@/types';
import { getCategories, getPortfolioAlbums } from '@/lib/services/contentService';
import PublicSiteHeader from './PublicSiteHeader';
import { FinFooter } from './FinPhotoSections';
import PublicMotionRoot from './motion/PublicMotionRoot';
import ResponsiveAlbumImage from './ResponsiveAlbumImage';

export default function FinPortfolioArchive() {
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [categories, setCategories] = useState<Array<{slug:string;name:string}>>([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { Promise.all([getPortfolioAlbums(true),getCategories()]).then(([items,filters]) => { setAlbums(items); setCategories(filters); }); }, []);
  const visible = filter === 'all' ? albums : albums.filter(item => item.category === filter);
  const filters = [{id:'all',label:'Tất cả tác phẩm'},...categories.map(item=>({id:item.slug,label:item.name}))];

  return <PublicMotionRoot><main className="fin-archive fin-site">
    <PublicSiteHeader />
    <section className="fin-archive__hero"><div className="fin-shell"><div><p className="fin-kicker"><span /> FIN PHOTO archive</p><h1>Lưu trữ tác phẩm<br /><em>&amp; dự án sáng tạo.</em></h1><p>Mỗi bộ ảnh là một cuộc đối thoại giữa ánh sáng, nhân vật và không gian — được tuyển chọn từ hành trình sáng tác của FIN PHOTO.</p></div><div className="fin-archive__count"><strong>{String(albums.length).padStart(2, '0')}</strong><span>Tác phẩm lưu trữ</span><ArrowDown /></div></div></section>
    <section className="fin-archive__body"><div className="fin-shell">
      <div className="fin-archive__filters" aria-label="Lọc bộ sưu tập">{filters.map(item => <button key={item.id} type="button" className={filter === item.id ? 'is-active' : ''} onClick={() => setFilter(item.id)}>{item.label}<span>{item.id === 'all' ? albums.length : albums.filter(album => album.category === item.id).length}</span></button>)}</div>
      <div className="fin-archive__grid">{visible.map((album, index) => <Link href={`/portfolio/${album.slug}`} key={album.id} className={`fin-project fin-project--${index % 6}`}>
        <div className="fin-project__media"><ResponsiveAlbumImage album={album}/></div>
        <div className="fin-project__copy"><span>{album.category.replace('-', ' ')} · 2026</span><h2>{album.title}</h2>{album.location && <p><MapPin /> {album.location}</p>}<i>Xem dự án <ArrowRight /></i></div>
      </Link>)}</div>
      {!visible.length && <p className="fin-archive__empty">Chưa có tác phẩm trong danh mục này.</p>}
    </div></section>
    <FinFooter />
  </main></PublicMotionRoot>;
}
