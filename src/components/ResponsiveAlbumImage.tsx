/* eslint-disable @next/next/no-img-element -- getImageProps keeps the archive card on the mobile cover asset at every viewport. */
import type { PortfolioAlbum } from '@/types';
import { getImageProps } from 'next/image';

export default function ResponsiveAlbumImage({album,alt,className=''}:{album:PortfolioAlbum;alt?:string;className?:string}){
  const cover = getImageProps({
    src: album.mobile_cover_url ?? album.cover_url,
    alt: alt ?? album.title,
    width: 900,
    height: 1200,
    quality: 80,
    loading: 'lazy',
    sizes: '(max-width:699px) 100vw, 33vw',
  });

  return <div className={`responsive-album-image ${className}`}>
    <img {...cover.props} alt={cover.props.alt} className="responsive-album-image__image" />
  </div>;
}
