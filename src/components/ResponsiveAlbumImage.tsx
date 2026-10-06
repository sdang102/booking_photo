import type { PortfolioAlbum } from '@/types';

export default function ResponsiveAlbumImage({album,alt,className=''}:{album:PortfolioAlbum;alt?:string;className?:string}){
  return <picture className={`responsive-album-image ${className}`}>
    {album.mobile_cover_url&&<source media="(max-width: 699px)" srcSet={album.mobile_cover_url}/>}
    <img src={album.cover_url} alt={alt??album.title} loading="lazy"/>
  </picture>;
}
