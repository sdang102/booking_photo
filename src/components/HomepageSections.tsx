'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronDown, MapPin } from 'lucide-react';
import type { FaqItem, HomepageSection, ShootingLocation } from '@/types';
import { formatVND } from './ServiceCard';
import BrandLogo from './BrandLogo';

const fallbackFaqs: FaqItem[] = [
  { id: 'faq-1', question: 'Cần đặt lịch trước bao lâu?', answer: 'Bạn nên đặt trước 1–2 tuần; mùa cưới và cuối tuần nên đặt trước 3–4 tuần.', display_order: 1 },
  { id: 'faq-2', question: 'Thanh toán như thế nào?', answer: 'Bạn không cần đặt cọc và sẽ thanh toán toàn bộ tại nơi chụp.', display_order: 2 },
  { id: 'faq-3', question: 'Tôi có thể đổi ngày chụp không?', answer: 'Có. Bạn có thể yêu cầu đổi lịch trước tối thiểu 72 giờ, tùy lịch trống.', display_order: 3 },
];

export function LocationsSection({ locations = [], section }: { locations?: ShootingLocation[]; section?: HomepageSection }) {
  if ((section && !section.is_visible) || !locations.length) return null;
  return (
    <section id="locations" className="location-film" data-cinematic-section>
      <header data-reveal>
        <span>Địa điểm chụp · Ánh sáng &amp; chi phí</span>
        <h2>{section?.title ?? 'Mỗi nơi chốn mang một chất liệu ánh sáng.'}</h2>
      </header>
      <div className="location-film__rail">
        {locations.map((location, index) => (
          <article key={location.id} className="location-film__frame" data-section-depth={index % 2 ? '0.55' : '0.3'}>
            <div><Image src={location.image_url} alt={location.name} fill sizes="(max-width: 699px) 82vw, 38vw" className="object-cover" /></div>
            <span>{String(index + 1).padStart(2, '0')} · {location.area}</span>
            <h3>{location.name}</h3>
            <p>{location.description}</p>
            <small><MapPin />{location.travel_fee ? `Phụ phí từ ${formatVND(location.travel_fee)}` : 'Không phụ phí di chuyển'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AboutPhotographer({ section }: { section?: HomepageSection }) {
  const content = section?.content ?? {};
  const highlights = Array.isArray(content.highlights) ? content.highlights.map(String) : ['Trực tiếp trao đổi', 'Hướng dẫn tạo dáng', 'Tự tay hậu kỳ'];
  return (
    <section id="about" className="about-editorial" data-cinematic-section>
      <div className="about-editorial__word about-editorial__word--back" aria-hidden="true">BEHIND</div>
      <div className="about-editorial__portrait" data-section-depth="0.6">
        <Image src={section?.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=86'} alt="Nhiếp ảnh gia Chọn Photo Sài Gòn" fill sizes="(max-width: 899px) 82vw, 40vw" className="object-cover" />
        <span>Portrait of the artist · 2026</span>
      </div>
      <div className="about-editorial__word about-editorial__word--front" aria-hidden="true">THE LENS</div>
      <div className="about-editorial__copy" data-reveal data-reveal-type="split">
        <span>Người đứng sau ống kính</span>
        <h2>{section?.title ?? 'Tôi không chỉ chụp bạn. Tôi quan sát điều làm bạn trở nên riêng biệt.'}</h2>
        <p>{section?.subtitle ?? 'Từ ý tưởng, ánh sáng đến hậu kỳ, toàn bộ hành trình đều do tôi trực tiếp đồng hành để mỗi khung hình vẫn là chính bạn — ở phiên bản đẹp và chân thật nhất.'}</p>
        <ul>{highlights.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul>
      </div>
    </section>
  );
}

export function BookingProcess() {
  const steps = ['Chọn ngày & giờ', 'Điền địa điểm', 'Gửi thông tin', 'Xác nhận lịch'];
  return (
    <section className="booking-steps" data-cinematic-section>
      <header data-reveal><span>Đặt lịch trực tuyến</span><h2>Bốn bước ngắn. Một buổi chụp được chuẩn bị kỹ.</h2></header>
      <ol>{steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol>
    </section>
  );
}

export function FAQ({ items }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState(0);
  const faqs = items?.length ? items : fallbackFaqs;
  return (
    <section id="faq" className="faq-editorial" data-cinematic-section>
      <div className="faq-editorial__title" data-reveal><span>Câu hỏi thường gặp</span><h2>Một vài điều<br />bạn có thể muốn biết.</h2></div>
      <div className="faq-editorial__list">
        {faqs.map((item, index) => (
          <div key={item.id} className={open === index ? 'is-open' : ''}>
            <button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
              <span>{String(index + 1).padStart(2, '0')}</span>{item.question}<ChevronDown />
            </button>
            <div><p>{item.answer}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA({ onBook }: { onBook: () => void }) {
  const background = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1800&q=88';
  return (
    <section className="final-scene" data-cinematic-section>
      <div className="final-scene__media"><Image src={background} alt="" fill sizes="100vw" className="object-cover" /></div>
      <div className="final-scene__shade" />
      <div className="final-scene__copy" data-reveal data-reveal-type="mask">
        <span>Đặt lịch chụp</span>
        <h2>Phiên bản Luxury của bạn bắt đầu từ đây.</h2>
        <p>Chọn ngày phù hợp, để chúng tôi chuẩn bị phần còn lại thật chỉn chu.</p>
        <button onClick={onBook}>Xem lịch trống<ArrowRight /></button>
      </div>
      <p className="final-scene__index">END FRAME<br />BEGIN AGAIN</p>
    </section>
  );
}

export function Footer({ onBook }: { onBook: () => void }) {
  return (
    <footer className="editorial-footer">
      <div><BrandLogo compact /><p>Một concept Luxury. Một dấu ấn rất riêng.</p></div>
      <nav aria-label="Điều hướng cuối trang"><a href="#luxury">Concept Luxury</a><a href="#services">Trải nghiệm</a><a href="#availability">Lịch trống</a><a href="#about">Về tôi</a><Link href="/reviews">Cảm nhận</Link></nav>
      <button type="button" className="editorial-footer__book" onClick={onBook}>Đặt lịch chụp <ArrowRight /></button>
      <p>© 2026 Chọn Photo Sài Gòn<br />Made with light in Saigon</p>
    </footer>
  );
}
