import Image from 'next/image';
import type { HomepageSection } from '@/types';

export default function FullscreenPhotoBreak({section}:{section?:HomepageSection}){
  if(!section?.image_url||section.content.enabled===false)return null;
  return <section className="photo-break" data-motion="expand"><div className="photo-break-media" data-parallax="24"><Image src={section.image_url} alt={section.title??'Photography story'} fill sizes="100vw" className="object-cover"/></div><div className="photo-break-shade"/><div className="photo-break-copy"><span>{section.subtitle}</span><strong>{section.title}</strong></div></section>;
}
