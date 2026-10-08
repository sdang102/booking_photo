import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, Images, Plus } from 'lucide-react';
import type { FaqItem, Service, ServiceAddon } from '@/types';
import PublicMotionRoot from './motion/PublicMotionRoot';
import ServicesFaq from './ServicesFaq';

function formatVND(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

const defaultExtras: ServiceAddon[] = [
  {id:'extra-time',title:'Thêm giờ sáng tác',description:'Mở rộng thời gian chụp cho concept nhiều bối cảnh.',price:800000,price_label:'Từ 800.000đ / giờ'},
  {id:'extra-makeup',title:'Makeup & Hair Artist',description:'Chuyên viên đồng hành và dặm chỉnh suốt buổi chụp.',price:600000,price_label:'Từ 600.000đ / layout'},
  {id:'extra-book',title:'Photobook mỹ thuật',description:'In album cao cấp trên giấy fine-art bền màu.',price:1200000,price_label:'Từ 1.200.000đ'},
];

const defaultFaqs: Array<[string, string]> = [
  ['Cần đặt lịch trước thời điểm dự kiến bao lâu?', 'Bạn nên đặt trước 1–2 tuần; cuối tuần và mùa cưới nên đặt trước 3–4 tuần.'],
  ['Quy trình chỉnh sửa và bàn giao ảnh mất bao lâu?', 'Ảnh xem trước được gửi trong 3 ngày; ảnh hoàn thiện bàn giao trong 10–15 ngày làm việc.'],
  ['Tôi có thể mang theo trang phục cá nhân không?', 'Có. FIN PHOTO sẽ tư vấn cách phối và ưu tiên những trang phục thể hiện đúng phong cách của bạn.'],
];

export default function FinServicesPage({ initialServices = [], initialExtras = defaultExtras, initialFaqs }: { initialServices?: Service[]; initialExtras?: ServiceAddon[]; initialFaqs?: FaqItem[] | null }) {
  const services = initialServices;
  const extras = initialExtras;
  const faqs = initialFaqs === null || initialFaqs === undefined ? defaultFaqs : initialFaqs.map((faq) => [faq.question, faq.answer] as [string, string]);
  const plans = services;
  const comparisonRows = [
    { label: 'Giá', values: plans.map(plan => `${new Intl.NumberFormat('vi-VN').format(Math.round(plan.price / 1000))}K`) },
    { label: 'Thời gian', values: plans.map(plan => `${plan.duration_minutes} phút`) },
    { label: 'Địa điểm', values: plans.map(plan => plan.location_count || '1') },
    { label: 'Outfit', values: plans.map(plan => String(plan.outfit_count || 1)) },
    { label: 'Ảnh hoàn thiện', values: plans.map(plan => String(plan.edited_photos || 15)) },
    { label: 'Hướng dẫn tạo dáng', values: plans.map(() => '✓') },
    { label: 'Tư vấn concept', values: plans.map((plan, index) => plan.consultation_level || (index === 0 ? 'Cơ bản' : index === 1 ? 'Cá nhân hóa' : 'Chuyên sâu')) },
  ];

  return <PublicMotionRoot><main className="fin-services-page fin-site">
    <section className="fin-services-hero"><div className="fin-shell"><p className="fin-kicker"><span /> Gói chụp & đầu tư</p><h1>Đầu tư cho những ký ức<br /><em>vượt thời gian.</em></h1><p>Mỗi khuôn hình là một tác phẩm được chuẩn bị kỹ từ ý tưởng, ánh sáng đến phần hậu kỳ thủ công.</p></div></section>
    <section className="fin-services-plans"><div className="fin-shell"><div className="fin-services-plans__grid">{plans.map((service, index) => <article key={service.id} className={service.is_popular ? 'is-featured' : ''}>
      <div className="fin-services-card__top"><span>Gói {String(index + 1).padStart(2, '0')}{service.tier_label ? ` — ${service.tier_label}` : ''}</span>{service.is_popular && <b>Được yêu thích</b>}</div><h2>{service.title}</h2><p>{service.description}</p><div className="fin-services-card__price"><small>Chi phí đầu tư</small><strong>{formatVND(service.price)}</strong></div>
      <div className="fin-services-card__facts"><span><Clock3 />{service.duration_minutes} phút chụp</span><span><Images />{service.edited_photos || 15} ảnh hoàn thiện</span></div>
      <ul>{service.features.map(feature => <li key={feature}><Check />{feature}</li>)}</ul><Link href={`/booking?service=${service.id}`}>Chọn gói này & đặt lịch <ArrowRight /></Link>
    </article>)}</div></div></section>
    <section className="fin-services-editorial"><div className="fin-shell"><div><p className="fin-kicker"><span /> Tuyên ngôn nghệ thuật</p><h2>Ánh sáng khắc họa cảm xúc chân thực nhất.</h2><p>FIN PHOTO không chụp những bức ảnh sáo rỗng. Chúng tôi lưu trữ khí chất, sự rung cảm và tinh hoa của từng khoảnh khắc bằng kỹ thuật ánh sáng được kiểm soát chính xác.</p><div><strong>100%</strong><span>Hậu kỳ thủ công</span><strong>500+</strong><span>Câu chuyện đã lưu</span></div></div><figure><Image src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=88" alt="Chân dung nghệ thuật của FIN PHOTO" fill sizes="(max-width: 720px) 100vw, 50vw" /></figure></div></section>
    <section className="fin-compare"><div className="fin-shell"><header className="fin-heading"><p className="fin-kicker"><span /> Phân tích chi tiết</p><h2>So sánh quyền lợi các gói chụp.</h2></header><div className="fin-compare__table"><div className="fin-compare__row fin-compare__head" style={{gridTemplateColumns:`minmax(180px,1.2fr) repeat(${plans.length},minmax(180px,1fr))`}}><strong>Quyền lợi</strong>{plans.map(plan => <strong className={plan.is_popular?'is-featured':''} key={plan.id}>{plan.title.replace(/^The /, '')}</strong>)}</div>{comparisonRows.map(row => <div className="fin-compare__row" style={{gridTemplateColumns:`minmax(180px,1.2fr) repeat(${plans.length},minmax(180px,1fr))`}} key={row.label}><strong>{row.label}</strong>{row.values.map((cell, index) => <span className={row.label==='Hướng dẫn tạo dáng'?'is-check':''} key={`${row.label}-${plans[index]?.id}`}>{cell}</span>)}</div>)}</div></div></section>
    <section className="fin-extras"><div className="fin-shell"><header className="fin-heading fin-heading--split"><div><p className="fin-kicker"><span /> Tùy biến trải nghiệm</p><h2>Dịch vụ bổ sung.</h2></div><p>Linh hoạt nâng cấp các chi tiết sáng tạo để buổi chụp trở thành một trải nghiệm trọn vẹn hơn.</p></header><div>{extras.map(item => <article key={item.id}><Plus /><h3>{item.title}</h3><p>{item.description}</p><strong>{item.price_label||formatVND(item.price)}</strong></article>)}</div></div></section>
    <ServicesFaq faqs={faqs} />
    <section className="fin-service-cta"><div className="fin-shell"><div><p className="fin-kicker"><span /> Direct booking</p><h2>Sẵn sàng cho kiệt tác của riêng bạn?</h2><p>Chia sẻ ý tưởng và thời gian mong muốn. FIN PHOTO sẽ tư vấn gói chụp phù hợp nhất.</p></div><Link href="/booking">Gửi yêu cầu giữ lịch <ArrowRight /></Link></div></section>
  </main></PublicMotionRoot>;
}
