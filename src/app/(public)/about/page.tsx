import FinAboutPage from '@/components/FinAboutPage';
import { getPublicAlbumCovers } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Về FIN PHOTO',
    description: 'Khám phá phong cách hình ảnh, quy trình sáng tạo và những câu chuyện đứng sau FIN PHOTO.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const albums = await getPublicAlbumCovers(4);
  return <FinAboutPage albums={albums} />;
}
