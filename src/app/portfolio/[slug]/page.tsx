'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { PortfolioAlbum } from '@/types';
import { getPortfolioAlbum } from '@/lib/services/contentService';
import BrandLogo from '@/components/BrandLogo';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';

export default function PortfolioAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [album, setAlbum] = useState<PortfolioAlbum | null>();

  useEffect(() => { getPortfolioAlbum(slug).then(setAlbum); }, [slug]);

  if (album === undefined) return <main className="grid min-h-screen place-items-center bg-background">Đang tải album…</main>;
  if (!album) return (
    <main className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-black">Album không tồn tại hoặc chưa công khai</h1>
        <Link href="/#portfolio" className="mt-4 inline-block text-sky-700">Quay lại Portfolio</Link>
      </div>
    </main>
  );

  return (
    <PublicMotionRoot>
      <main className="album-page min-h-screen">
        <header className="album-nav sticky top-0 z-50 border-b border-sky-200 bg-elevated/90 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/#portfolio" className="flex items-center gap-2 text-sm font-bold text-sky-700"><ArrowLeft className="h-4 w-4" />Quay lại Portfolio</Link>
            <BrandLogo compact />
          </div>
        </header>

        <section className="album-hero" data-cinematic-section>
          <div className="album-hero-media" data-parallax="42">
            <Image src={album.cover_url} alt={album.title} fill preload sizes="100vw" className="object-cover" />
          </div>
          <div className="album-hero-shade" />
          <div className="album-hero-copy" data-reveal>
            <span>{album.category.replace('-', ' ')}</span>
            <h1>{album.title}</h1>
            {album.location && <p><MapPin />{album.location}</p>}
          </div>
          <div className="album-hero-index" aria-hidden="true">A visual story<br />S. Đặng Studio</div>
        </section>

        <section className="album-story" data-cinematic-section>
          <div className="album-gallery">
            {album.images.map((image, index) => (
              <figure key={image.id} className={`album-frame album-frame--${index % 5}`} data-section-depth={index % 2 === 0 ? '0.35' : '0.65'}>
                <Image src={image.url} alt={image.alt} width={image.width} height={image.height} sizes="(max-width:699px) 100vw,70vw" className="h-auto w-full" />
                <figcaption>{String(index + 1).padStart(2, '0')} / {String(album.images.length).padStart(2, '0')}</figcaption>
              </figure>
            ))}
          </div>
          <div className="album-cta" data-reveal>
            <h2>Bạn muốn một bộ ảnh mang câu chuyện riêng?</h2>
            <Link href="/#services">Xem Gói Chụp</Link>
          </div>
        </section>
      </main>
    </PublicMotionRoot>
  );
}
