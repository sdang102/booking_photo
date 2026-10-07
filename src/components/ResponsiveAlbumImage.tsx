import type { PortfolioAlbum } from '@/types';
import { getImageProps } from 'next/image';

export default function ResponsiveAlbumImage({album,alt,className=''}:{album:PortfolioAlbum;alt?:string;className?:string}){
  const desktop = getImageProps({
    src: album.cover_url,
    alt: alt ?? album.title,
    width: 1600,
    height: 1100,
    quality: 80,
    loading: 'lazy',
    sizes: '(max-width:699px) 100vw, 50vw',
  });
  const mobile = album.mobile_cover_url ? getImageProps({
    src: album.mobile_cover_url,
    alt: '',
    width: 900,
    height: 1200,
    quality: 78,
    loading: 'lazy',
    sizes: '100vw',
  }) : null;

  return <div className={`responsive-album-image ${className}`}>
    <picture>
      {mobile && <source media="(max-width:699px)" srcSet={mobile.props.srcSet} sizes={mobile.props.sizes} />}
      <img {...desktop.props} alt={desktop.props.alt} className="responsive-album-image__image" />
    </picture>
  </div>;
}
