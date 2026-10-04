import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PublicSiteHeader from './PublicSiteHeader';
import { FinFooter, FinProcess, FinSelectedWorks } from './FinPhotoSections';
import PublicMotionRoot from './motion/PublicMotionRoot';

export default function FinAboutPage() {
  return <PublicMotionRoot><main className="fin-about-page fin-site">
    <PublicSiteHeader />
    <section className="fin-about-hero"><div className="fin-shell">
      <div className="fin-about-hero__copy"><p className="fin-kicker"><span /> Portfolio của tôi</p><h1>Mỗi khung hình là một cách tôi nhìn thế giới.</h1><p>FIN PHOTO là portfolio cá nhân ghi lại hành trình làm việc với ánh sáng, con người và những cảm xúc không thể dàn dựng lại lần thứ hai.</p><Link className="fin-button fin-button--gold" href="/portfolio">Xem bộ sưu tập <ArrowRight /></Link></div>
      <figure><Image src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=88" alt="Chân dung nghệ thuật tiêu biểu trong portfolio FIN PHOTO" fill preload sizes="(max-width: 720px) 100vw, 50vw" /></figure>
    </div></section>
    <section className="fin-about-statement"><div className="fin-shell"><span>01</span><h2>Tôi không tìm kiếm một công thức đẹp cho tất cả mọi người.</h2><p>Tôi quan sát cách bạn chuyển động, cách ánh sáng chạm lên gương mặt và điều khiến câu chuyện của bạn trở nên riêng biệt. Từ đó, mỗi bộ ảnh được xây dựng như một tác phẩm độc lập.</p></div></section>
    <section className="fin-about-profile"><div className="fin-shell"><figure><Image src="https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=1000&q=88" alt="Nhiếp ảnh gia của FIN PHOTO" fill sizes="(max-width: 720px) 100vw, 42vw" /></figure><div><p className="fin-kicker"><span /> Đằng sau ống kính</p><h2>Ánh sáng chân thật.<br />Cảm xúc có chiều sâu.</h2><p>Phong cách của tôi được hình thành từ sự tối giản, tương phản vừa đủ và nhịp kể chậm. Tôi trực tiếp đồng hành từ tư vấn concept, xây dựng moodboard đến hậu kỳ để tác phẩm cuối cùng luôn nhất quán.</p><dl><div><dt>08+</dt><dd>Năm theo đuổi nhiếp ảnh</dd></div><div><dt>500+</dt><dd>Câu chuyện đã thực hiện</dd></div><div><dt>01</dt><dd>Ngôn ngữ hình ảnh riêng</dd></div></dl></div></div></section>
    <FinSelectedWorks />
    <FinProcess />
    <section className="fin-about-cta"><div className="fin-shell"><p className="fin-kicker"><span /> Cùng tạo nên một câu chuyện</p><h2>Nếu hình ảnh này chạm đến bạn, hãy bắt đầu một dự án riêng.</h2><Link className="fin-button fin-button--gold" href="/booking">Đặt lịch tư vấn <ArrowRight /></Link></div></section>
    <FinFooter />
  </main></PublicMotionRoot>;
}
