'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Minus, Plus, X } from 'lucide-react';
import type { PortfolioAlbum, PortfolioImage } from '@/types';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';

export default function PortfolioAlbumPage({ album }: { album: PortfolioAlbum }) {
  const [lightbox,setLightbox]=useState<PortfolioImage|null>(null);
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [drag,setDrag]=useState<{pointerId:number;startX:number;startY:number;panX:number;panY:number}|null>(null);
  const [naturalSize,setNaturalSize]=useState<{width:number;height:number}|null>(null);
  const [viewport,setViewport]=useState({width:0,height:0});
  const [visibleCount,setVisibleCount]=useState(18);
  const pointers=useRef(new Map<number,{x:number;y:number}>());
  const pinch=useRef<{distance:number;zoom:number}|null>(null);

  useEffect(()=>{
    if(!lightbox)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setLightbox(null)};
    const resize=()=>setViewport({width:window.innerWidth,height:window.innerHeight});
    resize();document.body.style.overflow='hidden';window.addEventListener('keydown',close);window.addEventListener('resize',resize);
    return()=>{document.body.style.overflow='';window.removeEventListener('keydown',close);window.removeEventListener('resize',resize)};
  },[lightbox]);
  const openLightbox=(image:PortfolioImage)=>{pointers.current.clear();pinch.current=null;setDrag(null);setNaturalSize(null);setZoom(1);setPan({x:0,y:0});setLightbox(image)};
  const changeZoom=(next:number)=>{const value=Math.min(4,Math.max(1,next));setZoom(value);if(value===1)setPan({x:0,y:0})};
  const pointerDistance=()=>{const values=[...pointers.current.values()];return values.length<2?0:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)};
  const fittedSize=naturalSize&&viewport.width&&viewport.height?(()=>{const availableWidth=Math.min(viewport.width*.94,1440);const availableHeight=viewport.height-32;const ratio=Math.min(availableWidth/naturalSize.width,availableHeight/naturalSize.height);return{width:Math.round(naturalSize.width*ratio),height:Math.round(naturalSize.height*ratio)}})():null;

  if (album === undefined) return <main className="fin-site min-h-screen bg-background"><PublicSiteHeader /><div className="grid min-h-screen place-items-center">Đang tải album…</div></main>;
  if (!album) return (
    <main className="fin-site min-h-screen bg-background">
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
        <Link href="/portfolio" className="album-back-fixed"><ArrowLeft />Quay lại Bộ sưu tập</Link>

        <section className="album-hero" data-cinematic-section>
          <div className="album-hero-media" data-parallax="42">
            {album.mobile_cover_url&&<Image src={album.mobile_cover_url} alt="" fill sizes="100vw" className="album-hero-image album-hero-image--mobile" aria-hidden="true" />}
            <Image src={album.cover_url} alt={album.title} fill sizes="100vw" preload quality={80} className="album-hero-image album-hero-image--desktop" />
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
            {album.images.slice(0,visibleCount).map((image, index) => <AlbumFrame key={image.id} image={image} index={index} total={album.images.length} onOpen={openLightbox} />)}
          </div>
          {visibleCount<album.images.length&&<button type="button" onClick={()=>setVisibleCount((count)=>Math.min(count+18,album.images.length))} className="mx-auto mt-8 block rounded-xl border border-sky-300 bg-white px-5 py-3 text-sm font-bold text-sky-800">Tải thêm ảnh ({album.images.length-visibleCount} ảnh)</button>}
          <div className="album-cta" data-reveal>
            <h2>Bạn muốn một bộ ảnh mang câu chuyện riêng?</h2>
            <Link href="/services">Xem Gói Chụp</Link>
          </div>
        </section>
        {lightbox&&<div className="album-lightbox" role="dialog" aria-modal="true" aria-label={`Xem ảnh ${lightbox.alt}`} onClick={()=>setLightbox(null)}>
          <div className="album-lightbox__toolbar" onClick={event=>event.stopPropagation()}>
            <button type="button" onClick={()=>changeZoom(zoom-.25)} disabled={zoom<=1} aria-label="Thu nhỏ ảnh"><Minus/></button>
            <span>{Math.round(zoom*100)}%</span>
            <button type="button" onClick={()=>changeZoom(zoom+.25)} disabled={zoom>=4} aria-label="Phóng to ảnh"><Plus/></button>
          </div>
          <button type="button" className="album-lightbox__close" onClick={()=>setLightbox(null)} aria-label="Đóng ảnh"><X/></button>
          <div className="album-lightbox__stage" onWheel={event=>{event.preventDefault();changeZoom(zoom+(event.deltaY<0?.25:-.25))}}>
            <Image src={lightbox.url} alt={lightbox.alt} width={lightbox.width||1200} height={lightbox.height||800} sizes="94vw" quality={90} className={`${fittedSize?'is-ready':''} ${zoom>1?'is-zoomed':''} ${drag?'is-dragging':''}`} style={{width:fittedSize?`${fittedSize.width}px`:undefined,height:fittedSize?`${fittedSize.height}px`:undefined,transform:`translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`}} onLoad={event=>setNaturalSize({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight})} onClick={event=>event.stopPropagation()}
              onDoubleClick={event=>{event.stopPropagation();changeZoom(zoom>1?1:2)}}
              onPointerDown={event=>{event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.current.size===2){pinch.current={distance:pointerDistance(),zoom};setDrag(null)}else if(zoom>1)setDrag({pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,panX:pan.x,panY:pan.y})}}
              onPointerMove={event=>{if(!pointers.current.has(event.pointerId))return;pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.current.size>=2&&pinch.current){const next=pinch.current.zoom*(pointerDistance()/Math.max(1,pinch.current.distance));changeZoom(next);return}if(drag&&drag.pointerId===event.pointerId)setPan({x:drag.panX+event.clientX-drag.startX,y:drag.panY+event.clientY-drag.startY})}}
              onPointerUp={event=>{pointers.current.delete(event.pointerId);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);if(pointers.current.size<2)pinch.current=null;setDrag(null)}}
              onPointerCancel={event=>{pointers.current.delete(event.pointerId);pinch.current=null;setDrag(null)}}/>
          </div>
        </div>}
      </main>
    </PublicMotionRoot>
  );
}

function AlbumFrame({image,index,total,onOpen}:{image:PortfolioImage;index:number;total:number;onOpen:(image:PortfolioImage)=>void}){
  const[orientation,setOrientation]=useState(image.height>image.width?'portrait':'landscape');
  return <figure className={`album-frame album-frame--${orientation}`} data-section-depth={index%2===0?'0.35':'0.65'} onClick={()=>onOpen(image)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen(image)}}} role="button" tabIndex={0} aria-label={`Xem lớn ảnh ${image.alt}`}>
    <Image src={image.thumbnail_url??image.url} alt={image.alt} fill sizes="(max-width:699px) 100vw,70vw" quality={75} onLoad={event=>setOrientation(event.currentTarget.naturalHeight>event.currentTarget.naturalWidth?'portrait':'landscape')}/>
    <figcaption>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</figcaption>
  </figure>
}
