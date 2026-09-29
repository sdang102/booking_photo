'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, MapPin } from 'lucide-react';
import { getPortfolioAlbums } from '@/lib/services/contentService';
import type { PortfolioAlbum, PortfolioCategory } from '@/types';

const FILTERS: Array<{ id: 'all' | PortfolioCategory; label: string }> = [
  { id: 'all', label: 'Tất Cả' }, { id: 'couple', label: 'Couple' },
  { id: 'portrait', label: 'Chân Dung' }, { id: 'pre-wedding', label: 'Pre-Wedding' },
  { id: 'family', label: 'Gia Đình' }, { id: 'event', label: 'Sự Kiện' }, { id: 'concept', label: 'Concept' },
];

export default function PortfolioGallery() {
  const [filter, setFilter] = useState<'all' | PortfolioCategory>('all');
  const [showAll, setShowAll] = useState(false);
  const [allAlbums, setAllAlbums] = useState<PortfolioAlbum[]>([]);
  useEffect(() => { getPortfolioAlbums(true).then(setAllAlbums); }, []);
  const albums = filter === 'all' ? allAlbums : allAlbums.filter((album) => album.category === filter);
  const visibleAlbums = showAll ? albums : albums.slice(0, 3);

  return (
    <section id="portfolio" className="scroll-reveal bg-white/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Portfolio</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Những Khoảnh Khắc Tôi Đã Ghi Lại</h2>
          <p className="mt-4 text-slate-600">Khám phá những bộ ảnh và câu chuyện tôi đã thực hiện.</p>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Lọc portfolio">
          {FILTERS.map((item) => (
            <button key={item.id} onClick={() => { setFilter(item.id); setShowAll(false); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${filter === item.id ? 'bg-sky-600 text-white shadow-lg' : 'border border-sky-200 bg-white text-slate-600 hover:border-sky-400'}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {visibleAlbums.map((album, index) => (
            <Link key={album.id} href={`/portfolio/${album.slug}`} className="portfolio-tile group relative mb-5 block break-inside-avoid overflow-hidden rounded-2xl bg-slate-100">
              <div className={`relative ${index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
                <Image src={album.cover_url} alt={album.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/5 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">{FILTERS.find((item) => item.id === album.category)?.label}</span>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div><h3 className="text-lg font-bold text-white">{album.title}</h3>{album.location && <p className="mt-1 flex items-center gap-1 text-xs text-white/75"><MapPin className="h-3 w-3" />{album.location}</p>}</div>
                    <ArrowUpRight className="h-5 w-5 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {albums.length > 3 && <div className="mt-8 text-center"><button type="button" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll} className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sm font-bold text-sky-700 transition-all hover:bg-sky-50">{showAll ? 'Thu Gọn Portfolio' : `Xem Thêm ${albums.length - 3} Bộ Ảnh`} <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} /></button></div>}
      </div>
    </section>
  );
}

