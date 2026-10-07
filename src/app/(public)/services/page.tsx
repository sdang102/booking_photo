import FinServicesPage from '@/components/FinServicesPage';
import { getPublicServiceAddons, getPublicServices } from '@/lib/services/publicContentService';

export default async function ServicesPage() {
  const [services, addons] = await Promise.all([getPublicServices(), getPublicServiceAddons()]);
  return <FinServicesPage initialServices={services} initialExtras={addons.length ? addons : undefined} />;
}
