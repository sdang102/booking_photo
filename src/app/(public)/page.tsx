import HomePageClient from '@/components/HomePageClient';
import { getPublicHomepageData } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({ path: '/' });
}

export default async function HomePage() {
  const { sections, albums } = await getPublicHomepageData();
  return <HomePageClient sections={sections} albums={albums} />;
}
