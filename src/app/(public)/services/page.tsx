import FinServicesPage from '@/components/FinServicesPage';
import { getPublicFaqs, getPublicServiceAddons, getPublicServices } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Gói chụp ảnh',
    description: 'So sánh các gói chụp chân dung, couple và editorial với chi phí minh bạch tại FIN PHOTO.',
    path: '/services',
  });
}

export default async function ServicesPage() {
  const [services, addons, faqs] = await Promise.all([getPublicServices(), getPublicServiceAddons(), getPublicFaqs()]);
  return <FinServicesPage initialServices={services} initialExtras={addons.length ? addons : undefined} initialFaqs={faqs} />;
}
