'use client';

import Image from 'next/image';
import { ArrowRight, Check, Gem, Sparkles } from 'lucide-react';

const details = [
  'Tư vấn moodboard và trang phục trước ngày chụp',
  'Hướng dẫn biểu cảm, tạo dáng trong suốt buổi chụp',
  'Màu ảnh sang trọng, tinh giản và đồng nhất',
  'Ảnh được tuyển chọn và hậu kỳ thủ công',
];

export default function LuxuryExperience({ onBook }: { onBook: () => void }) {
  return (
    <section id="luxury" className="luxury-story" data-cinematic-section>
      <div className="luxury-story__intro" data-reveal>
        <span className="section-kicker">Một concept duy nhất · Luxury Portrait</span>
        <h2>Không chạy theo số lượng.<br /><em>Chỉ theo đuổi một chất riêng.</em></h2>
        <p>
          Luxury không nằm ở phông nền cầu kỳ. Đó là ánh sáng có chủ đích, thần thái tự tin
          và từng chi tiết được chuẩn bị để tạo nên một bộ ảnh sang trọng nhưng vẫn là chính bạn.
        </p>
      </div>

      <div className="luxury-story__visuals" aria-label="Phong cách Luxury Portrait">
        <figure className="luxury-story__image luxury-story__image--main" data-reveal>
          <Image
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=88"
            alt="Chân dung Luxury với ánh sáng tinh tế"
            fill
            sizes="(max-width: 899px) 82vw, 42vw"
            className="object-cover"
          />
          <figcaption>01 · Quiet confidence</figcaption>
        </figure>
        <figure className="luxury-story__image luxury-story__image--detail" data-reveal>
          <Image
            src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88"
            alt="Chi tiết chân dung phong cách sang trọng"
            fill
            sizes="(max-width: 899px) 48vw, 22vw"
            className="object-cover"
          />
          <figcaption>02 · Timeless detail</figcaption>
        </figure>
        <div className="luxury-story__seal" aria-hidden="true"><Gem /><span>Luxury<br />only</span></div>
      </div>

      <div className="luxury-story__details" data-reveal>
        <div className="luxury-story__label"><Sparkles /> Trải nghiệm bạn nhận được</div>
        <ul>
          {details.map((detail) => <li key={detail}><Check />{detail}</li>)}
        </ul>
        <button type="button" onClick={onBook}>Xem lịch và đặt chụp <ArrowRight /></button>
      </div>
    </section>
  );
}
