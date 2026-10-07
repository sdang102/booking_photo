import HomePageClient from '@/components/HomePageClient';
import { getPublicHomepageData } from '@/lib/services/publicContentService';

export default async function HomePage() {
  const { sections, albums } = await getPublicHomepageData();
  return <HomePageClient sections={sections} albums={albums} />;
}
