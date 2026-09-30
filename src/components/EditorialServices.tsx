'use client';

import Image from 'next/image';
import { ArrowRight, Check, Clock, Images, MapPin } from 'lucide-react';
import type { Service } from '@/types';
import { formatVND } from './ServiceCard';

interface Props {
  services: Service[];
  onBook: (serviceId?: string) => void;
}

export default function EditorialServices({ services, onBook }: Props) {
  const service = services[0];
  if (!service) return null;

  return (
    <section id="services" className="service-story service-story--single" data-cinematic-section>
      <div className="service-story__top" data-reveal>
        <span>Luxury Signature · Trọn gói</span>
        <h2>Một lựa chọn rõ ràng.<br />Mọi chi tiết đều được chăm chút.</h2>
        <p>
          Bạn không cần chọn giữa nhiều phong cách. Chúng tôi tập trung toàn bộ kinh nghiệm vào
          một concept Luxury nhất quán, sau đó cá nhân hoá ánh sáng, trang phục và thần thái cho riêng bạn.
        </p>
      </div>

      <div className="service-story__layout" data-sticky-story>
        <div className="service-story__visual" data-section-depth="0.35">
          <Image src={service.image_url} alt={service.title} fill sizes="(max-width: 899px) 100vw, 54vw" className="object-cover" />
          <div className="service-story__visual-shade" />
          <div className="service-story__visual-meta"><span>One signature concept</span><strong>Luxury</strong></div>
          <div className="service-story__price">Trọn gói <strong>{formatVND(service.price)}</strong></div>
        </div>

        <article className="service-story__package" data-reveal>
          <span className="section-kicker">The signature session</span>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <div className="service-story__facts">
            <span><Clock />{Math.max(1, Math.round(service.duration_minutes / 60))} giờ</span>
            <span><Images />{service.edited_photos ?? 15} ảnh chỉnh</span>
            <span><MapPin />{service.location_count ?? '1 địa điểm'}</span>
          </div>
          <ul>
            {service.features.map((feature) => <li key={feature}><Check />{feature}</li>)}
          </ul>
          <button type="button" onClick={() => onBook(service.id)}>
            Chọn ngày chụp <ArrowRight />
          </button>
          <small>Không cần đặt cọc · Thanh toán tại buổi chụp</small>
        </article>
      </div>
    </section>
  );
}
