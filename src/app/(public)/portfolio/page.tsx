import FinPortfolioArchive from '@/components/FinPortfolioArchive';
import { getPublicAlbumCoverPage, getPublicCategories } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Portfolio',
    description: 'Tuyển tập chân dung, couple, pre-wedding và editorial photography được thực hiện bởi FIN PHOTO.',
    path: '/portfolio',
  });
}

export default async function PortfolioPage() {
  const [albumPage, categories] = await Promise.all([getPublicAlbumCoverPage(), getPublicCategories()]);
  return <FinPortfolioArchive albums={albumPage.albums} categories={categories} initialNextOffset={albumPage.nextOffset} initialTotal={albumPage.total} />;
}
