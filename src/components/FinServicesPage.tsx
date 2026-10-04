'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, Images, Plus } from 'lucide-react';
import type { Service } from '@/types';
import { MOCK_SERVICES } from '@/lib/data/mockData';
import { getServices } from '@/lib/services/bookingService';
import { formatVND } from './ServiceCard';
import PublicSiteHeader from './PublicSiteHeader';
import { FinFooter } from './FinPhotoSections';
import PublicMotionRoot from './motion/PublicMotionRoot';

const extras = [
  ['Thêm giờ sáng tác', 'Mở rộng thời gian chụp cho concept nhiều bối cảnh.', 'Từ 800.000đ / giờ'],
  ['Makeup & Hair Artist', 'Chuyên viên đồng hành và dặm chỉnh suốt buổi chụp.', 'Từ 600.000đ / layout'],
  ['Photobook mỹ thuật', 'In album cao cấp trên giấy fine-art bền màu.', 'Từ 1.200.000đ'],
];

const faqs = [
  ['Cần đặt lịch trước thời điểm dự kiến bao lâu?', 'Bạn nên đặt trước 1–2 tuần; cuối tuần và mùa cưới nên đặt trước 3–4 tuần.'],
  ['Quy trình chỉnh sửa và bàn giao ảnh mất bao lâu?', 'Ảnh xem trước được gửi trong 3 ngày; ảnh hoàn thiện bàn giao trong 10–15 ngày làm việc.'],
  ['Tôi có thể mang theo trang phục cá nhân không?', 'Có. FIN PHOTO sẽ tư vấn cách phối và ưu tiên những trang phục thể hiện đúng phong cách của bạn.'],
];

export default function FinServicesPage() {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [open, setOpen] = useState(0);
  useEffect(() => { getServices().then(items => { if (items.length) setServices(items); }); }, []);
  const plans = services.slice(0, 3);

  return <PublicMotionRoot><main className="fin-services-page fin-site">
    <PublicSiteHeader />
    <section className="fin-services-hero"><div className="fin-shell"><p className="fin-kicker"><span /> Gói chụp & đầu tư</p><h1>Đầu tư cho những ký ức<br /><em>vượt thời gian.</em></h1><p>Mỗi khuôn hình là một tác phẩm được chuẩn bị kỹ từ ý tưởng, ánh sáng đến phần hậu kỳ thủ công.</p></div></section>
    <section className="fin-services-plans"><div className="fin-shell"><div className="fin-services-plans__grid">{plans.map((service, index) => <article key={service.id} className={index === 1 ? 'is-featured' : ''}>
      <div className="fin-services-card__top"><span>Gói 0{index + 1}</span>{index === 1 && <b>Được yêu thích</b>}</div><h2>{service.title}</h2><p>{service.description}</p><div className="fin-services-card__price"><small>Chi phí đầu tư</small><strong>{formatVND(service.price)}</strong></div>
      <div className="fin-services-card__facts"><span><Clock3 />{Math.max(1, Math.round(service.duration_minutes / 60))} giờ chụp</span><span><Images />{service.edited_photos || 15}+ ảnh hậu kỳ</span></div>
      <ul>{service.features.map(feature => <li key={feature}><Check />{feature}</li>)}</ul><Link href={`/booking?service=${service.id}`}>Chọn gói này & đặt lịch <ArrowRight /></Link>
    </article>)}</div></div></section>
    <section className="fin-services-editorial"><div className="fin-shell"><div><p className="fin-kicker"><span /> Tuyên ngôn nghệ thuật</p><h2>Ánh sáng khắc họa cảm xúc chân thực nhất.</h2><p>FIN PHOTO không chụp những bức ảnh sáo rỗng. Chúng tôi lưu trữ khí chất, sự rung cảm và tinh hoa của từng khoảnh khắc bằng kỹ thuật ánh sáng được kiểm soát chính xác.</p><div><strong>100%</strong><span>Hậu kỳ thủ công</span><strong>500+</strong><span>Câu chuyện đã lưu</span></div></div><figure><Image src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=88" alt="Chân dung nghệ thuật của FIN PHOTO" fill sizes="(max-width: 720px) 100vw, 50vw" /></figure></div></section>
    <section className="fin-compare"><div className="fin-shell"><header className="fin-heading"><p className="fin-kicker"><span /> Phân tích chi tiết</p><h2>So sánh quyền lợi các gói chụp.</h2></header><div className="fin-compare__table"><div className="fin-compare__row fin-compare__head"><strong>Hạng mục</strong>{plans.map(plan => <strong key={plan.id}>{plan.title}</strong>)}</div>{[
      ['Thời lượng', ...plans.map(p => `${Math.max(1, Math.round(p.duration_minutes / 60))} giờ`)],
      ['Ảnh hậu kỳ', ...plans.map(p => `${p.edited_photos || 15}+ ảnh`)],
      ['Số quyền lợi', ...plans.map(p => `${p.features.length} quyền lợi`)],
      ['Tư vấn moodboard', ...plans.map(() => 'Có')],
      ['Hướng dẫn tạo dáng', ...plans.map(() => 'Xuyên suốt')],
    ].map(row => <div className="fin-compare__row" key={row[0]}>{row.map((cell, i) => <span key={`${cell}-${i}`}>{cell}</span>)}</div>)}</div></div></section>
    <section className="fin-extras"><div className="fin-shell"><header className="fin-heading fin-heading--split"><div><p className="fin-kicker"><span /> Tùy biến trải nghiệm</p><h2>Dịch vụ bổ sung.</h2></div><p>Linh hoạt nâng cấp các chi tiết sáng tạo để buổi chụp trở thành một trải nghiệm trọn vẹn hơn.</p></header><div>{extras.map(([title, copy, price]) => <article key={title}><Plus /><h3>{title}</h3><p>{copy}</p><strong>{price}</strong></article>)}</div></div></section>
    <section className="fin-service-faq"><div className="fin-shell"><header><p className="fin-kicker"><span /> Giải đáp thắc mắc</p><h2>Những câu hỏi<br />thường gặp.</h2></header><div>{faqs.map(([question, answer], index) => <article className={open === index ? 'is-open' : ''} key={question}><button onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><Plus /></button><p>{answer}</p></article>)}</div></div></section>
    <section className="fin-service-cta"><div className="fin-shell"><div><p className="fin-kicker"><span /> Direct booking</p><h2>Sẵn sàng cho kiệt tác của riêng bạn?</h2><p>Chia sẻ ý tưởng và thời gian mong muốn. FIN PHOTO sẽ tư vấn gói chụp phù hợp nhất.</p></div><Link href="/booking">Gửi yêu cầu giữ lịch <ArrowRight /></Link></div></section>
    <FinFooter />
  </main></PublicMotionRoot>;
}
