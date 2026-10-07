import PublicSiteHeader from '@/components/PublicSiteHeader';
import { FinFooter } from '@/components/FinPhotoSections';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    <PublicSiteHeader />
    {children}
    <FinFooter />
  </>;
}
