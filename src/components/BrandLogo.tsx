'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function BrandLogo({compact=false,className='',href}:{compact?:boolean;className?:string;href?:string}){
  const {isAdmin,isPhotographer}=useAuth();
  const homeHref=href??(isAdmin?'/admin':isPhotographer?'/photographer':'/#top');
  return <Link href={homeHref} onClick={(event)=>{if(homeHref==='/#top'&&window.location.pathname==='/'){event.preventDefault();window.history.replaceState(null,'','/#top');window.scrollTo({top:0,behavior:'smooth'});}}} aria-label="FIN PHOTO — về trang chủ" className={`brand-lockup group inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}><span className={`brand-logo-mark relative block aspect-square shrink-0 overflow-hidden rounded-full transition-all duration-500 group-hover:-translate-y-0.5 ${compact?'h-10 sm:h-11':'h-11 sm:h-12'}`}><Image src="/chon-photo-saigon-logo-trimmed.jpg" alt="Biểu tượng FIN PHOTO" fill loading="eager" sizes={compact?'44px':'48px'} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></span><span className="brand-lockup__type"><strong>FIN PHOTO</strong><small>Editorial photography</small></span></Link>;
}
