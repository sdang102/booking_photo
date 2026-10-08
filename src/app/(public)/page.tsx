import HomePageClient from '@/components/HomePageClient';
import { FinClosing, FinCraft, FinHero, FinProcess, FinSelectedWorks } from '@/components/FinPhotoSections';
import { getPublicHomepageData } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({ path: '/' });
}

export default async function HomePage() {
  const { sections, albums } = await getPublicHomepageData();
  const section = (key: string) => sections.find((item) => item.section_key === key);
  const craft = sections.filter((item) => item.section_key.startsWith('craft_')).map((item) => ({
    title: item.title ?? '', copy: item.subtitle ?? '', image: item.image_url ?? '',
  })).filter((item) => item.title && item.image);
  return <HomePageClient settings={section('motion_settings')}><FinHero /><FinCraft items={craft.length ? craft : undefined} /><FinSelectedWorks albums={albums} /><FinProcess /><FinClosing /></HomePageClient>;
}
