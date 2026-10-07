import type { PortfolioAlbum } from '@/types';
import Image from 'next/image';

export default function ResponsiveAlbumImage({album,alt,className=''}:{album:PortfolioAlbum;alt?:string;className?:string}){
  return <div className={`responsive-album-image ${className}`}>
    {album.mobile_cover_url&&<Image src={album.mobile_cover_url} alt="" fill sizes="(max-width:699px) 100vw, 50vw" className="responsive-album-image__mobile" aria-hidden="true"/>}
    <Image src={album.cover_url} alt={alt??album.title} fill loading="lazy" sizes="(max-width:699px) 100vw, 50vw" className="responsive-album-image__desktop"/>
  </div>;
}
