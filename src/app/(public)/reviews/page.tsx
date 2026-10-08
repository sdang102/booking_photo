import PublicReviewsPage from '@/components/PublicReviewsPage';
import { getPublicReviewPage, getPublicReviewSummary } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Đánh giá khách hàng',
    description: 'Những trải nghiệm chân thật từ khách hàng đã thực hiện buổi chụp cùng FIN PHOTO.',
    path: '/reviews',
  });
}

export default async function ReviewsPage() {
  const [initialPage, initialSummary] = await Promise.all([getPublicReviewPage(), getPublicReviewSummary()]);
  return <PublicReviewsPage initialPage={initialPage} initialSummary={initialSummary} />;
}
