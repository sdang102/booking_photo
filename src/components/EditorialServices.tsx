'use client';

import Image from 'next/image';
import { ArrowRight, Camera, Check, Clock3, Images, MapPin, Palette, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';
import type { Service } from '@/types';
import { formatVND } from './ServiceCard';

interface Props {
  services: Service[];
  onBook: (serviceId?: string) => void;
}

const journey = [
  {
    number: '01',
    icon: Palette,
    title: 'Trước buổi chụp',
    copy: 'Trao đổi 1:1 để thống nhất hình ảnh bạn muốn hướng tới, địa điểm và trang phục phù hợp.',
    points: ['Moodboard cá nhân', 'Gợi ý trang phục & màu sắc', 'Xác nhận lịch và địa điểm'],
  },
  {
    number: '02',
    icon: Camera,
    title: 'Trong buổi chụp',
    copy: 'Bạn không cần biết tạo dáng. Nhiếp ảnh gia hướng dẫn từng chuyển động, góc mặt và biểu cảm.',
    points: ['Hướng dẫn tạo dáng', 'Điều chỉnh ánh sáng liên tục', 'Xem thử ảnh ngay tại buổi chụp'],
  },
  {
    number: '03',
    icon: WandSparkles,
    title: 'Sau buổi chụp',
    copy: 'Những khung hình tốt nhất được tuyển chọn và hậu kỳ đồng nhất theo tinh thần Luxury Portrait.',
    points: ['Tuyển chọn ảnh nổi bật', 'Hậu kỳ màu và chi tiết', 'Bàn giao theo lịch đã thống nhất'],
  },
];

export default function EditorialServices({ services, onBook }: Props) {
  const service = services[0];
  if (!service) return null;
  const duration = Math.max(1, Math.round(service.duration_minutes / 60));

  return (
    <section id="services" className="experience-section" data-cinematic-section>
      <div className="experience-shell">
        <header className="experience-heading" data-reveal>
          <div><span><Sparkles /> Trải nghiệm từ đầu đến cuối</span><h2>Bạn không cần biết tạo dáng.<br /><em>Chúng tôi sẽ hướng dẫn.</em></h2></div>
          <div><p>Một buổi chụp tốt không bắt đầu từ lúc bấm máy. Nó bắt đầu từ việc hiểu bạn muốn nhìn thấy phiên bản nào của chính mình.</p><small>Phù hợp cả với người lần đầu chụp ảnh chuyên nghiệp.</small></div>
        </header>

        <div className="experience-journey">
          {journey.map((item) => {
            const Icon = item.icon;
            return <article key={item.number} data-reveal>
              <div><span>{item.number}</span><Icon /></div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <ul>{item.points.map((point) => <li key={point}><Check />{point}</li>)}</ul>
            </article>;
          })}
        </div>

        <div className="experience-offer">
          <figure>
            <Image src={service.image_url} alt={service.title} fill sizes="(max-width: 899px) 100vw, 50vw" className="object-cover" />
            <div />
            <figcaption><span>Luxury Signature</span><strong>Một buổi chụp dành riêng cho bạn</strong></figcaption>
          </figure>

          <article>
            <span className="experience-offer__eyebrow">Gói đang nhận lịch</span>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="experience-facts">
              <span><Clock3 /><b>{duration} giờ</b><small>Thời lượng chụp</small></span>
              <span><Images /><b>{service.edited_photos ?? 15} ảnh</b><small>Ảnh hậu kỳ</small></span>
              <span><MapPin /><b>{service.location_count ?? '1 địa điểm'}</b><small>Không gian chụp</small></span>
            </div>
            <ul className="experience-includes">
              {service.features.slice(0, 4).map((feature) => <li key={feature}><Check />{feature}</li>)}
            </ul>
            <div className="experience-booking">
              <div><span>Chi phí trọn gói</span><strong>{formatVND(service.price)}</strong><small><ShieldCheck /> Không cần đặt cọc trực tuyến</small></div>
              <button type="button" onClick={() => onBook(service.id)}>Chọn ngày chụp <ArrowRight /></button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
