import PublicSiteHeader from '@/components/PublicSiteHeader';
import { FinFooter } from '@/components/FinPhotoSections';
import { getPublicSiteSettings } from '@/lib/services/siteSettingsService';

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSiteSettings();
  return <>
    <PublicSiteHeader />
    {children}
    <FinFooter settings={settings} />
  </>;
}
