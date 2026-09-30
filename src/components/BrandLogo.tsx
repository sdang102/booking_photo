'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function BrandLogo({compact=false,className='',href}:{compact?:boolean;className?:string;href?:string}){
  const {isAdmin,isPhotographer}=useAuth();
  const homeHref=href??(isAdmin?'/admin':isPhotographer?'/photographer':'/');
  return <Link href={homeHref} aria-label="Chọn Photo Sài Gòn — về trang chủ" className={`group inline-flex shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${className}`}><span className={`brand-logo-mark relative block aspect-square shrink-0 overflow-hidden rounded-full transition-all duration-500 group-hover:-translate-y-0.5 ${compact?'h-12 sm:h-14 lg:h-[60px]':'h-14 sm:h-16 lg:h-[68px]'}`}><Image src="/chon-photo-saigon-logo-trimmed.jpg" alt="Chọn Photo Sài Gòn" fill loading="eager" sizes={compact?'(max-width: 640px) 48px, (max-width: 1024px) 56px, 60px':'(max-width: 640px) 56px, (max-width: 1024px) 64px, 68px'} className="object-contain p-1 transition-transform duration-500 group-hover:scale-[1.015]"/></span></Link>;
}
