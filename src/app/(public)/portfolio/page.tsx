import FinPortfolioArchive from '@/components/FinPortfolioArchive';
import { getPublicAlbumCovers, getPublicCategories } from '@/lib/services/publicContentService';

export default async function PortfolioPage() {
  const [albums, categories] = await Promise.all([getPublicAlbumCovers(), getPublicCategories()]);
  return <FinPortfolioArchive albums={albums} categories={categories} />;
}
