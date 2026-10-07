import FinAboutPage from '@/components/FinAboutPage';
import { getPublicAlbumCovers } from '@/lib/services/publicContentService';

export default async function AboutPage() {
  const albums = await getPublicAlbumCovers(4);
  return <FinAboutPage albums={albums} />;
}
