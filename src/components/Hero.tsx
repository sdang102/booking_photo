'use client';

import Image from 'next/image';
import { ArrowDownRight, CalendarDays } from 'lucide-react';

const fallbackImage = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=90';
export default function Hero({ onBook }: { onBook: () => void }) {
  const heroImage = fallbackImage;
  const intro = 'Một concept. Một dấu ấn không thể trộn lẫn.';
  const description = 'Luxury Portrait dành cho người muốn nhìn thấy phiên bản tự tin, sang trọng và chân thật nhất của chính mình.';

  return (
    <section className="memory-hero" data-hero-scene aria-label="Chọn Photo Sài Gòn">
      <div className="memory-hero__pin" data-hero-pin>
        <div className="memory-hero__stage" data-camera-stage>
          <div className="memory-hero__backdrop">
            <Image src={heroImage} alt="" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="memory-hero__shade" aria-hidden="true" />

          <p className="memory-hero__eyebrow">
            Luxury portrait photography <span /> Sài Gòn
          </p>

          <div className="memory-hero__type">
            <span className="memory-hero__line memory-hero__line--back">LUXURY</span>
            <span className="memory-hero__line memory-hero__line--front">PORTRAIT</span>
            <span className="memory-hero__line memory-hero__line--italic">SAIGON.</span>
          </div>

          <div className="memory-hero__photo-field" aria-hidden="true">
            <figure className="memory-hero__primary">
              <Image src={heroImage} alt="Chân dung phong cách Luxury tại Sài Gòn" fill preload sizes="(max-width: 899px) 78vw, 36vw" className="object-cover" />
              <figcaption>
                <span>Frame 001</span>
                <span>35mm · f/1.8 · Saigon</span>
              </figcaption>
            </figure>
          </div>

          <div className="memory-hero__note">
            <p>{intro}</p>
            <span>{description}</span>
          </div>

          <div className="memory-hero__actions">
            <button type="button" className="editorial-link editorial-link--primary" onClick={onBook}>
              Xem lịch trống <CalendarDays />
            </button>
            <a href="#luxury" className="editorial-link editorial-link--quiet">
              Khám phá concept <ArrowDownRight />
            </a>
          </div>

          <p className="memory-hero__scroll"><span /> Cuộn để khám phá</p>
        </div>
      </div>
    </section>
  );
}
