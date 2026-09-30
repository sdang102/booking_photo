'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownRight, ArrowUpRight, MapPin } from 'lucide-react';
import gsap from 'gsap';
import { getPortfolioAlbums } from '@/lib/services/contentService';
import { PORTFOLIO_ALBUMS } from '@/lib/data/mockData';
import type { PortfolioAlbum, PortfolioCategory } from '@/types';

const FILTERS: Array<{ id: 'all' | PortfolioCategory; label: string }> = [
  { id: 'all', label: 'Tất cả' }, { id: 'couple', label: 'Couple' },
  { id: 'portrait', label: 'Chân dung' }, { id: 'pre-wedding', label: 'Pre-wedding' },
  { id: 'family', label: 'Gia đình' }, { id: 'event', label: 'Sự kiện' }, { id: 'concept', label: 'Concept' },
];

interface SharedTransition {
  album: PortfolioAlbum;
  rect: { top: number; left: number; width: number; height: number };
}

export default function PortfolioGallery() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | PortfolioCategory>('all');
  const [albums, setAlbums] = useState<PortfolioAlbum[]>(PORTFOLIO_ALBUMS);
  const [transition, setTransition] = useState<SharedTransition | null>(null);
  const transitionMedia = useRef<HTMLDivElement>(null);
  const transitionShade = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPortfolioAlbums(true).then((items) => { if (items.length) setAlbums(items); });
  }, []);

  const filtered = filter === 'all' ? albums : albums.filter((album) => album.category === filter);
  const roomAlbums = [...albums, ...PORTFOLIO_ALBUMS].filter((album, index, list) => list.findIndex((item) => item.slug === album.slug) === index).slice(0, 6);

  useLayoutEffect(() => {
    if (!transition || !transitionMedia.current || !transitionShade.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(`/portfolio/${transition.album.slug}`);
      return;
    }
    document.body.classList.add('shared-transition-active');
    const timeline = gsap.timeline({ onComplete: () => router.push(`/portfolio/${transition.album.slug}`) });
    timeline
      .fromTo(transitionShade.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, 0)
      .fromTo(transitionMedia.current, {
        top: transition.rect.top, left: transition.rect.left,
        width: transition.rect.width, height: transition.rect.height, borderRadius: 2,
      }, {
        top: 0, left: 0, width: window.innerWidth, height: window.innerHeight,
        borderRadius: 0, duration: 0.82, ease: 'power4.inOut',
      }, 0)
      .fromTo(transitionMedia.current.querySelector('img'), { scale: 1 }, { scale: 1.04, duration: 0.85, ease: 'power2.inOut' }, 0);
    return () => { timeline.kill(); document.body.classList.remove('shared-transition-active'); };
  }, [router, transition]);

  const beginTransition = (event: React.MouseEvent<HTMLAnchorElement>, album: PortfolioAlbum) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const media = event.currentTarget.querySelector<HTMLElement>('[data-shared-media]');
    if (!media) return;
    event.preventDefault();
    const rect = media.getBoundingClientRect();
    setTransition({ album, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } });
  };

  return (
    <section id="portfolio" className="portfolio-experience">
      <div className="floating-room" data-photo-room>
        <div className="floating-room__stage" data-photo-room-stage>
          <div className="floating-room__intro">
            <span>Portfolio chọn lọc</span>
            <h2>Đi giữa những<br /><em>khung hình.</em></h2>
            <p>Chọn một khung hình để mở trọn album.</p>
          </div>
          {roomAlbums.map((album, index) => (
            <Link
              href={`/portfolio/${album.slug}`}
              key={album.id}
              className={`floating-frame floating-frame--${index + 1}`}
              data-room-frame
              onClick={(event) => beginTransition(event, album)}
              aria-label={`Mở album ${album.title}`}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div data-shared-media><Image src={album.cover_url} alt={album.title} fill sizes="(max-width: 899px) 58vw, 30vw" className="object-cover" /></div>
              <strong>{album.title}</strong>
              <small>Mở album <ArrowUpRight /></small>
            </Link>
          ))}
        </div>
      </div>

      <div className="portfolio-indexed" data-cinematic-section>
        <header className="portfolio-indexed__header" data-reveal data-reveal-type="split">
          <div>
            <span className="section-kicker">Portfolio · Bộ ảnh đã thực hiện</span>
            <h2 className="section-title">Những câu chuyện<br />đã thành ký ức.</h2>
          </div>
          <div>
            <p>Không phải một bộ sưu tập. Đây là những khoảnh khắc còn hơi thở, ánh nhìn và nhịp tim của người trong ảnh.</p>
            <ArrowDownRight />
          </div>
        </header>

        <div className="portfolio-filters" aria-label="Lọc portfolio">
          {FILTERS.map((item) => (
            <button type="button" key={item.id} onClick={() => setFilter(item.id)} className={filter === item.id ? 'is-active' : ''} aria-pressed={filter === item.id}>
              {item.label}<span>{String((item.id === 'all' ? albums : albums.filter((album) => album.category === item.id)).length).padStart(2, '0')}</span>
            </button>
          ))}
        </div>

        <div className="editorial-gallery">
          {filtered.map((album, index) => (
            <Link key={album.id} href={`/portfolio/${album.slug}`} onClick={(event) => beginTransition(event, album)} className={`portfolio-tile portfolio-tile--${index % 6}`} aria-label={`Mở album ${album.title}`}>
              <article className="portfolio-card">
                <div className="portfolio-card-media" data-shared-media>
                  <Image src={album.cover_url} alt={album.title} fill sizes="(max-width: 699px) 92vw, (max-width: 1100px) 55vw, 42vw" className="object-cover" />
                </div>
                <div className="portfolio-card-copy">
                  <span>{String(index + 1).padStart(2, '0')} / {album.category.replace('-', ' ')}</span>
                  <div><h3>{album.title}</h3><span className="portfolio-card-cta">Mở album <ArrowUpRight /></span></div>
                  {album.location && <p><MapPin />{album.location}</p>}
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      <div className="contact-sheet" data-contact-sheet>
        <div className="contact-sheet__heading">
          <span>Contact sheet · Vol. 01</span>
          <h2>Những khoảng lặng<br />giữa hai lần bấm máy.</h2>
          <p>Di chuyển qua những thước phim. Chạm vào một khung để mở trọn câu chuyện.</p>
        </div>
        <div className="contact-sheet__rail" data-contact-rail>
          {[...albums, ...albums].slice(0, 10).map((album, index) => (
            <Link key={`${album.id}-${index}`} href={`/portfolio/${album.slug}`} onClick={(event) => beginTransition(event, album)} className="contact-frame" aria-label={`Mở album ${album.title}`}>
              <small>{String(index + 1).padStart(2, '0')}A</small>
              <div data-shared-media><Image src={album.cover_url} alt={album.title} fill sizes="(max-width: 700px) 62vw, 25vw" className="object-cover" /></div>
              <span>{album.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {transition && (
        <div className="shared-transition" aria-hidden="true">
          <div ref={transitionShade} className="shared-transition-shade" />
          <div ref={transitionMedia} className="shared-transition-media">
            <Image src={transition.album.cover_url} alt="" fill preload sizes="100vw" className="object-cover" />
            <div className="shared-transition-title">{transition.album.title}</div>
          </div>
        </div>
      )}
    </section>
  );
}
