'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Camera, ChevronDown, MapPin, MessageCircle, Palette, PersonStanding } from 'lucide-react';
import type { FaqItem, HomepageSection, ShootingLocation } from '@/types';
import { formatVND } from './ServiceCard';
import BrandLogo from './BrandLogo';

const fallbackLocations: ShootingLocation[] = [];
const fallbackFaqs: FaqItem[] = [
  { id:'faq-1', question:'Cần đặt lịch trước bao lâu?', answer:'Bạn nên đặt trước 1–2 tuần; mùa cưới và cuối tuần nên đặt trước 3–4 tuần.', display_order:1 },
  { id:'faq-2', question:'Thanh toán như thế nào?', answer:'Bạn không cần đặt cọc và sẽ thanh toán toàn bộ tại nơi chụp.', display_order:2 },
  { id:'faq-3', question:'Tôi có thể đổi ngày chụp không?', answer:'Có. Bạn có thể yêu cầu đổi lịch trước tối thiểu 72 giờ, tùy lịch trống.', display_order:3 },
];

export function LocationsSection({ locations = fallbackLocations, section }: { locations?: ShootingLocation[]; section?: HomepageSection }) {
  if (section && !section.is_visible) return null;
  return <section id="locations" className="scroll-reveal bg-white/50 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><span className="section-kicker">Địa điểm</span><h2 className="section-title">{section?.title ?? 'Địa Điểm Tôi Nhận Chụp'}</h2><p className="section-copy">{section?.subtitle ?? 'Từ studio chủ động ánh sáng đến ngoại cảnh giàu cảm xúc, tôi sẽ cùng bạn chọn nơi phù hợp nhất với câu chuyện.'}</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{locations.map((location) => <article key={location.id} className="group overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm"><div className="relative aspect-[4/3] overflow-hidden">{location.image_url&&<Image src={location.image_url} alt={location.name} fill sizes="(max-width: 640px) 100vw, 50vw, 25vw" className="object-cover transition-transform duration-1000 group-hover:scale-105"/>}</div><div className="p-5"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-600"><MapPin className="h-3 w-3"/>{location.area}</span><h3 className="mt-2 text-lg font-bold">{location.name}</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">{location.description}</p><p className="mt-4 text-xs font-bold text-sky-700">{location.travel_fee ? `Phụ phí từ ${formatVND(location.travel_fee)}` : 'Không phụ phí di chuyển'}</p></div></article>)}</div></div></section>;
}

export function AboutPhotographer({ section }: { section?: HomepageSection }) {
  const content=section?.content??{};
  const trusts=Array.isArray(content.highlights)?content.highlights.map((value,index)=>({title:String(value),copy:'',icon:[MessageCircle,PersonStanding,Palette][index%3]})):[{icon:MessageCircle,title:'Trực tiếp trao đổi',copy:'Tôi lắng nghe và tư vấn concept riêng cho từng khách hàng.'},{icon:PersonStanding,title:'Hướng dẫn pose',copy:'Hướng dẫn cử chỉ, ánh mắt để bạn tự nhiên trước ống kính.'},{icon:Palette,title:'Hậu kỳ bởi chính tôi',copy:'Màu sắc được hoàn thiện đồng nhất với tinh thần bộ ảnh.'}];
  return <section id="about" className="scroll-reveal py-20 sm:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8"><div className="relative lg:col-span-5"><div className="relative aspect-[4/5] overflow-hidden rounded-3xl"><Image src={section?.image_url||'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=84'} alt="Nhiếp ảnh gia" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover"/></div></div><div className="lg:col-span-7"><span className="section-kicker">Về tôi</span><h2 className="section-title">{section?.title??'Không Qua Trung Gian, Tôi Trực Tiếp Bắt Trọn Thần Thái Của Bạn'}</h2><p className="section-copy">{section?.subtitle??'Từ tư vấn ý tưởng, thực hiện buổi chụp đến hậu kỳ, toàn bộ hành trình đều do tôi trực tiếp đồng hành.'}</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{trusts.map(({icon:Icon,title,copy})=><div key={title} className="rounded-2xl border border-sky-200 bg-white p-4"><Icon className="h-5 w-5 text-sky-600"/><h3 className="mt-3 text-sm font-bold">{title}</h3>{copy&&<p className="mt-1 text-xs leading-relaxed text-slate-600">{copy}</p>}</div>)}</div><a href="#faq" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-sky-700">Tìm Hiểu Về Tôi <ArrowRight className="h-4 w-4"/></a></div></div></section>;
}

export function BookingProcess({ section }: { section?: HomepageSection }) {
  const values=section?.content?.steps; const steps=Array.isArray(values)?values.map(value=>typeof value==='object'&&value&&'title' in value?String((value as {title:unknown}).title):String(value)):['Chọn Gói','Chọn Ngày & Giờ','Chọn Địa Điểm','Xác Nhận Lịch','Thanh Toán Tại Nơi Chụp'];
  return <section className="scroll-reveal bg-white/50 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><span className="section-kicker">Quy trình</span><h2 className="section-title">{section?.title??'Đặt Lịch Chỉ Với 5 Bước'}</h2>{section?.subtitle&&<p className="section-copy mx-auto">{section.subtitle}</p>}</div><div className="relative mt-12 grid gap-4 md:grid-cols-5 md:gap-2">{steps.map((step,index)=><div key={step} className="relative flex items-center gap-4 rounded-2xl border border-sky-200 bg-white p-4 md:block md:text-center"><span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-black text-white">{String(index+1).padStart(2,'0')}</span><h3 className="font-bold md:mt-4">{step}</h3></div>)}</div></div></section>;
}

export function FAQ({ items }: { items?: FaqItem[] }) {
  const [open,setOpen]=useState(0); const faqs=items?.length?items:fallbackFaqs;
  return <section id="faq" className="scroll-reveal py-20 sm:py-28"><div className="mx-auto max-w-3xl px-4 sm:px-6"><div className="text-center"><span className="section-kicker">FAQ</span><h2 className="section-title">Câu Hỏi Thường Gặp</h2></div><div className="mt-10 divide-y divide-sky-200 rounded-2xl border border-sky-200 bg-white px-5">{faqs.map((item,i)=><div key={item.id}><button className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-bold" onClick={()=>setOpen(open===i?-1:i)} aria-expanded={open===i}>{item.question}<ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open===i?'rotate-180':''}`}/></button><div className={`faq-answer grid transition-all ${open===i?'grid-rows-[1fr] pb-5':'grid-rows-[0fr]'}`}><p className="overflow-hidden text-sm leading-relaxed text-slate-600">{item.answer}</p></div></div>)}</div></div></section>;
}

export function FinalCTA({ onBook, section }: { onBook:()=>void; section?:HomepageSection }) {
  return <section className="scroll-reveal px-4 py-16 sm:px-6 sm:py-24"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-sky-200 bg-sky-100 px-6 py-14 text-center shadow-xl sm:px-12"><Camera className="mx-auto h-8 w-8 text-sky-600"/><h2 className="mt-5 text-3xl font-black sm:text-5xl">{section?.title??'Sẵn sàng tạo nên bộ ảnh của riêng bạn?'}</h2><p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">{section?.subtitle??'Chọn gói phù hợp, kiểm tra lịch trống và đặt lịch chụp chỉ trong vài phút.'}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={onBook} className="sky-button rounded-xl px-6 py-3 text-sm font-bold">{String(section?.content?.button_label??'Đặt Lịch Ngay')}</button><a href="#portfolio" className="rounded-xl border border-sky-400 bg-white/60 px-6 py-3 text-sm font-bold text-sky-800">Xem Portfolio</a></div></div></section>;
}

export function Footer(){return <footer className="border-t border-[#302b25] bg-[#1b1916]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 text-sm text-[#c8bba9] sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><BrandLogo compact/><p className="mt-2 text-xs">Cinematic & Editorial Photography</p></div><div className="flex flex-wrap gap-5"><Link href="/portfolio/loi-hen-ben-bien">Portfolio</Link><a href="#services">Gói chụp</a><a href="#availability">Lịch trống</a><a href="#locations">Địa điểm</a></div><p className="text-xs text-[#f8f3ea]">© 2026 Chọn Photo Sài Gòn</p></div></footer>}
