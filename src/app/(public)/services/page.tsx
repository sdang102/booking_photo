import FinServicesPage from '@/components/FinServicesPage';
import { getPublicFaqs, getPublicServiceAddons, getPublicServices } from '@/lib/services/publicContentService';

export default async function ServicesPage() {
  const [services, addons, faqs] = await Promise.all([getPublicServices(), getPublicServiceAddons(), getPublicFaqs()]);
  return <FinServicesPage initialServices={services} initialExtras={addons.length ? addons : undefined} initialFaqs={faqs} />;
}
