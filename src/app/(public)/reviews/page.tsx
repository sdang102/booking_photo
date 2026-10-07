import PublicReviewsPage from '@/components/PublicReviewsPage';
import { getPublicReviews } from '@/lib/services/publicContentService';

export const metadata = {
  title: 'Đánh giá khách hàng | FIN PHOTO',
  description: 'Những trải nghiệm chân thật từ khách hàng đã thực hiện buổi chụp cùng FIN PHOTO.',
};

export default async function ReviewsPage() {
  const reviews = await getPublicReviews();
  return <PublicReviewsPage initialReviews={reviews} />;
}
