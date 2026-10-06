'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, Check, MoveUpRight, Music2, Phone, Sparkles } from 'lucide-react';
import { PORTFOLIO_ALBUMS } from '@/lib/data/mockData';
import type { PortfolioAlbum, Service } from '@/types';
import { formatVND } from './ServiceCard';
import ResponsiveAlbumImage from './ResponsiveAlbumImage';

const defaultCraft = [
  { title: 'Chân dung nghệ thuật', copy: 'Ánh sáng có chủ đích, tôn lên khí chất và câu chuyện rất riêng của bạn.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=88' },
  { title: 'Couple & Pre-wedding', copy: 'Những khoảnh khắc tự nhiên được kể lại bằng ngôn ngữ điện ảnh tinh tế.', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=88' },
  { title: 'Lookbook & Editorial', copy: 'Hình ảnh thời trang giàu cá tính, được xây dựng trọn vẹn từ concept đến hậu kỳ.', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88' },
  { title: 'Gia đình & Kỷ niệm', copy: 'Giữ lại sự gần gũi, ấm áp và những kết nối thật trong từng khung hình.', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=88' },
];

const process = [
  ['01', 'Tư vấn concept', 'Lắng nghe câu chuyện, phong cách và mục đích sử dụng bộ ảnh.'],
  ['02', 'Styling & moodboard', 'Chốt trang phục, bối cảnh, màu sắc và hướng ánh sáng phù hợp.'],
  ['03', 'Buổi chụp', 'Hướng dẫn tạo dáng và biểu cảm xuyên suốt để bạn luôn tự nhiên.'],
  ['04', 'Hậu kỳ & bàn giao', 'Tuyển chọn, chỉnh màu thủ công và bàn giao đúng thời gian cam kết.'],
];

export function FinHero({ onBook }: { onBook: () => void }) {
  return <section className="fin-hero">
    <Image src="/fin-hero-bg.jpg" alt="Khoảnh khắc nghệ thuật qua ống kính FIN PHOTO" fill priority sizes="100vw" className="fin-hero__image" />
    <div className="fin-hero__veil" />
    <div className="fin-shell fin-hero__content">
      <p className="fin-kicker"><span /> FIN PHOTO · SGN</p>
      <h1>Những khoảnh khắc <em>đẹp nhất</em><br />đôi khi chỉ cần được ghi lại<br />một cách thật <em>tinh tế.</em></h1>
      <div className="fin-actions">
        <button type="button" className="fin-button fin-button--gold" onClick={onBook}>Khám phá gói chụp <ArrowRight /></button>
        <Link className="fin-button fin-button--ghost" href="/about">Xem portfolio <MoveUpRight /></Link>
      </div>
    </div>
    <div className="fin-shell fin-stats">
      <div><strong>02+</strong><span>Năm theo đuổi ánh sáng</span></div>
      <div><strong>100+</strong><span>Câu chuyện đã lưu giữ</span></div>
      <div><strong>24h</strong><span>Phản hồi yêu cầu tư vấn</span></div>
      <div><strong>100%</strong><span>Trải nghiệm được cá nhân hóa</span></div>
    </div>
  </section>;
}

export function FinCraft({items=defaultCraft}:{items?:Array<{title:string;copy:string;image:string}>}) {
  return <section className="fin-section fin-craft">
    <div className="fin-shell">
      <header className="fin-heading fin-heading--split"><div><p className="fin-kicker"><span /> Chuyên môn của FIN PHOTO</p><h2>Thế giới hình ảnh<br />mang dấu ấn riêng.</h2></div><p>Mỗi thể loại là một cách kể chuyện khác nhau, nhưng luôn gặp nhau ở ánh sáng đẹp, cảm xúc thật và sự chỉn chu.</p></header>
      <div className="fin-craft__grid">{items.map((item, index) => <article key={item.title}>
        <div className="fin-craft__media"><Image src={item.image} alt={item.title} fill sizes="(max-width: 720px) 100vw, 25vw" /></div>
        <span>0{index + 1}</span><h3>{item.title}</h3><p>{item.copy}</p><Link href="/portfolio">Xem tác phẩm <ArrowRight /></Link>
      </article>)}</div>
    </div>
  </section>;
}

export function FinSelectedWorks({ albums = PORTFOLIO_ALBUMS }: { albums?: PortfolioAlbum[] }) {
  const works = albums.slice(0, 4);
  return <section id="collection" className="fin-section fin-works"><div className="fin-shell">
    <header className="fin-heading fin-heading--split"><div><p className="fin-kicker"><span /> Selected works</p><h2>Tác phẩm tiêu biểu<br />được tuyển chọn.</h2></div><Link className="fin-text-link" href="/portfolio">Xem toàn bộ bộ sưu tập <ArrowRight /></Link></header>
    <div className="fin-works__grid">{works.map((album, index) => <Link href={`/portfolio/${album.slug}`} key={album.id} className={`fin-work fin-work--${index + 1}`}>
      <div><ResponsiveAlbumImage album={album}/></div>
      <span>{album.category.replace('-', ' ')}</span><h3>{album.title}</h3><p>{album.location || 'Sài Gòn'} · Project 0{index + 1}</p>
    </Link>)}</div>
  </div></section>;
}

export function FinProcess() {
  return <section className="fin-section fin-process"><div className="fin-shell">
    <header className="fin-heading fin-heading--center"><p className="fin-kicker"><span /> Nghệ thuật được chuẩn bị kỹ</p><h2>Quy trình sáng tạo 4 bước.</h2><p>Mỗi bộ ảnh có một nhịp điệu riêng, nhưng luôn được dẫn dắt bằng một quy trình rõ ràng.</p></header>
    <ol>{process.map(([number, title, copy]) => <li key={number}><strong>{number}</strong><h3>{title}</h3><p>{copy}</p></li>)}</ol>
  </div></section>;
}

export function FinPackages({ services, onBook }: { services: Service[]; onBook: (id?: string) => void }) {
  const visible = services.slice(0, 3);
  if (!visible.length) return null;
  return <section id="services" className="fin-section fin-packages"><div className="fin-shell">
    <header className="fin-heading fin-heading--center"><p className="fin-kicker"><span /> Gói chụp & đầu tư</p><h2>Chọn trải nghiệm dành cho bạn.</h2><p>Chi phí minh bạch, quy trình rõ ràng và từng buổi chụp đều được cá nhân hóa.</p></header>
    <div className="fin-packages__grid">{visible.map((service, index) => <article key={service.id} className={index === 1 ? 'is-featured' : ''}>
      <span>Hạng mục 0{index + 1}</span><h3>{service.title}</h3><p>{service.description}</p><div className="fin-price"><small>Chi phí từ</small><strong>{formatVND(service.price)}</strong></div>
      <ul>{service.features.slice(0, 5).map(feature => <li key={feature}><Check />{feature}</li>)}</ul>
      <button type="button" onClick={() => onBook(service.id)}>Chọn gói & đặt lịch <ArrowRight /></button>
    </article>)}</div>
    <Link href="/services" className="fin-text-link fin-packages__more">Xem bảng so sánh chi tiết <ArrowRight /></Link>
  </div></section>;
}

export function FinPortfolioStory() {
  return <section id="portfolio-story" className="fin-section fin-portfolio-story"><div className="fin-shell">
    <div className="fin-portfolio-story__copy"><p className="fin-kicker"><span /> Portfolio của tôi</p><h2>Tôi kể câu chuyện bằng ánh sáng, không bằng khuôn mẫu.</h2><p>Portfolio là nơi lưu lại hành trình thị giác của FIN PHOTO — từ chân dung tĩnh lặng đến những ngày cưới đầy chuyển động. Mỗi bộ ảnh là một cuộc gặp gỡ, một cách quan sát và một dấu ấn riêng.</p><div className="fin-mini-stats"><span><strong>100%</strong>Hậu kỳ thủ công</span><span><strong>01</strong>Ngôn ngữ hình ảnh nhất quán</span><span><strong>∞</strong>Câu chuyện khác biệt</span></div><Link href="/portfolio" className="fin-button fin-button--gold">Khám phá portfolio <ArrowRight /></Link></div>
    <div className="fin-portfolio-story__images"><figure><Image src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=88" alt="Chân dung nghệ thuật trong portfolio FIN PHOTO" fill sizes="(max-width: 720px) 60vw, 30vw" /></figure><figure><Image src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=88" alt="Khoảnh khắc cưới trong portfolio FIN PHOTO" fill sizes="(max-width: 720px) 60vw, 30vw" /></figure></div>
  </div></section>;
}

export function FinClosing({ onBook }: { onBook: () => void }) {
  return <section className="fin-section fin-closing"><div className="fin-shell"><div><p className="fin-kicker"><span /> Bắt đầu một dự án riêng</p><h2>Bạn có ý tưởng cho bộ ảnh của riêng mình?</h2><p>Hãy để chúng tôi cùng bạn biến một cảm hứng thành những khung hình có chiều sâu và mang đúng dấu ấn cá nhân.</p><button className="fin-button fin-button--gold" type="button" onClick={onBook}>Đặt lịch tư vấn <ArrowRight /></button></div></div></section>;
}

export function FinFooter() {
  return <footer className="fin-footer"><div className="fin-shell"><div className="fin-footer__brand"><Camera /><div><strong>FIN PHOTO</strong><span>Editorial photography</span></div></div><p>Không gian hình ảnh dành cho những câu chuyện chân thật, thanh lịch và có chiều sâu.</p><nav><Link href="/">Trang chủ</Link><Link href="/portfolio">Bộ sưu tập</Link><Link href="/services">Gói chụp</Link><Link href="/about">Portfolio</Link><Link href="/reviews">Đánh giá</Link></nav><div className="fin-footer__contact" aria-label="Thông tin liên hệ">
    <a href="https://www.tiktok.com/@chonphoto.sgn" target="_blank" rel="noreferrer" aria-label="TikTok Chọn Photo Sài Gòn" title="TikTok"><Music2/></a>
    <a href="https://www.instagram.com/finphoto.sgn?stkn=MWl4anFndmN1cXF1OA%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram FIN PHOTO" title="Instagram"><InstagramMark/></a>
    <a href="tel:+84392152816" aria-label="Gọi số 0392 152 816" title="0392 152 816"><Phone/></a>
  </div><div className="fin-footer__bottom"><span>© 2026 FIN PHOTO. All rights reserved.</span><span>Made with light in Saigon <Sparkles /></span></div></div></footer>;
}

function InstagramMark(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>}
