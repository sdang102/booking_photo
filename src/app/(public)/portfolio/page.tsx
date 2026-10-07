import FinPortfolioArchive from '@/components/FinPortfolioArchive';
import { getPublicAlbumCoverPage, getPublicCategories } from '@/lib/services/publicContentService';

export default async function PortfolioPage() {
  const [albumPage, categories] = await Promise.all([getPublicAlbumCoverPage(), getPublicCategories()]);
  return <FinPortfolioArchive albums={albumPage.albums} categories={categories} initialNextOffset={albumPage.nextOffset} initialTotal={albumPage.total} />;
}
