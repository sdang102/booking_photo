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

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const rawCategory = (await searchParams).category;
  const requestedCategory = typeof rawCategory === 'string' && /^[a-z0-9-]{1,80}$/.test(rawCategory) ? rawCategory : undefined;
  const categories = await getPublicCategories();
  const category = requestedCategory && categories.some((item) => item.slug === requestedCategory) ? requestedCategory : undefined;
  const albumPage = await getPublicAlbumCoverPage(0, 24, category);
  return <FinPortfolioArchive key={category ?? 'all'} albums={albumPage.albums} categories={categories} initialCategory={category} initialNextOffset={albumPage.nextOffset} initialTotal={albumPage.total} />;
}
