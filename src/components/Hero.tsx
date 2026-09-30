'use client';

import Image from 'next/image';
import { ArrowDownRight, CalendarDays } from 'lucide-react';

const fallbackImage = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=90';
const luxuryLayers = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=84',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1100&q=84',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=84',
];

export default function Hero({ onBook }: { onBook: () => void }) {
  const heroImage = fallbackImage;
  const intro = 'Một concept. Một dấu ấn không thể trộn lẫn.';
  const description = 'Luxury Portrait dành cho người muốn nhìn thấy phiên bản tự tin, sang trọng và chân thật nhất của chính mình.';

  return (
    <section className="memory-hero" data-hero-scene aria-label="Chọn Photo Sài Gòn">
      <div className="memory-hero__pin" data-hero-pin>
        <div className="memory-hero__stage" data-camera-stage>
          <div className="memory-hero__backdrop" data-depth-level="0.2">
            <Image src={heroImage} alt="" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="memory-hero__shade" aria-hidden="true" />

          <p className="memory-hero__eyebrow" data-depth-level="0.6">
            Luxury portrait photography <span /> Sài Gòn
          </p>

          <div className="memory-hero__type" data-hero-copy>
            <span className="memory-hero__line memory-hero__line--back" data-hero-word>LUXURY</span>
            <span className="memory-hero__line memory-hero__line--front">PORTRAIT</span>
            <span className="memory-hero__line memory-hero__line--italic">SAIGON.</span>
          </div>

          <div className="memory-hero__photo-field" aria-hidden="true">
            <figure className="memory-hero__side memory-hero__side--left" data-hero-side data-depth-level="1.4">
              <Image src={luxuryLayers[0]} alt="" fill sizes="22vw" className="object-cover" />
            </figure>
            <figure className="memory-hero__side memory-hero__side--right" data-hero-side data-depth-level="1.8">
              <Image src={luxuryLayers[1]} alt="" fill sizes="20vw" className="object-cover" />
            </figure>
            <figure className="memory-hero__primary" data-hero-primary data-depth-level="1.1">
              <Image src={heroImage} alt="Chân dung phong cách Luxury tại Sài Gòn" fill preload sizes="(max-width: 899px) 78vw, 36vw" className="object-cover" />
              <figcaption>
                <span>Frame 001</span>
                <span>35mm · f/1.8 · Saigon</span>
              </figcaption>
            </figure>
            <figure className="memory-hero__detail" data-hero-side data-depth-level="2.2">
              <Image src={luxuryLayers[2]} alt="" fill sizes="14vw" className="object-cover" />
            </figure>
          </div>

          <div className="memory-hero__note" data-depth-level="0.8">
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
