'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { PortfolioAlbum, PortfolioImage } from '@/types';
import { getPortfolioAlbum } from '@/lib/services/contentService';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';

export default function PortfolioAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [album, setAlbum] = useState<PortfolioAlbum | null>();

  useEffect(() => { getPortfolioAlbum(slug).then(setAlbum); }, [slug]);

  if (album === undefined) return <main className="fin-site min-h-screen bg-background"><PublicSiteHeader /><div className="grid min-h-screen place-items-center">Đang tải album…</div></main>;
  if (!album) return (
    <main className="fin-site min-h-screen bg-background">
      <PublicSiteHeader />
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <h1 className="text-2xl font-black">Album không tồn tại hoặc chưa công khai</h1>
          <Link href="/portfolio" className="mt-4 inline-block text-sky-700">Quay lại Bộ sưu tập</Link>
        </div>
      </div>
    </main>
  );

  return (
    <PublicMotionRoot>
      <main className="fin-site album-page min-h-screen">
        <PublicSiteHeader />
        <Link href="/portfolio" className="album-back-fixed"><ArrowLeft />Quay lại Bộ sưu tập</Link>

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
          <div className="album-hero-index" aria-hidden="true">A visual story<br />FIN PHOTO</div>
        </section>

        <section className="album-story" data-cinematic-section>
          <div className="album-gallery">
            {album.images.map((image, index) => <AlbumFrame key={image.id} image={image} index={index} total={album.images.length} />)}
          </div>
          <div className="album-cta" data-reveal>
            <h2>Bạn muốn một bộ ảnh mang câu chuyện riêng?</h2>
            <Link href="/services">Xem Gói Chụp</Link>
          </div>
        </section>
      </main>
    </PublicMotionRoot>
  );
}

function AlbumFrame({image,index,total}:{image:PortfolioImage;index:number;total:number}){
  const[orientation,setOrientation]=useState(image.height>image.width?'portrait':'landscape');
  return <figure className={`album-frame album-frame--${orientation}`} data-section-depth={index%2===0?'0.35':'0.65'}>
    <Image src={image.url} alt={image.alt} fill sizes="(max-width:699px) 100vw,70vw" onLoad={event=>setOrientation(event.currentTarget.naturalHeight>event.currentTarget.naturalWidth?'portrait':'landscape')}/>
    <figcaption>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</figcaption>
  </figure>
}
