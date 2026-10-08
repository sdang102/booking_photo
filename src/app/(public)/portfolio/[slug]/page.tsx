import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioAlbumPageClient from '@/components/PortfolioAlbumPageClient';
import { getPublicAlbumBySlug, getPublicAlbumImagePage } from '@/lib/services/publicContentService';
import { createPublicMetadata } from '@/lib/siteMetadata';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await getPublicAlbumBySlug(slug);
  if (!album) return { title: 'Album không tồn tại', robots: { index: false, follow: false } };
  const description = `Khám phá bộ ảnh ${album.title}${album.location ? ` tại ${album.location}` : ''} — FIN PHOTO.`;
  const metadata = await createPublicMetadata({ title: album.title, description, path: `/portfolio/${slug}` });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: album.cover_url ? [{ url: album.cover_url, alt: album.title }] : metadata.openGraph?.images,
    },
  };
}

export default async function PortfolioAlbumPage({ params }: Props) {
  const { slug } = await params;
  const [album, imagePage] = await Promise.all([getPublicAlbumBySlug(slug), getPublicAlbumImagePage(slug)]);
  if (!album) notFound();
  return <PortfolioAlbumPageClient album={{ ...album, images: imagePage.images }} initialNextOffset={imagePage.nextOffset} initialTotal={imagePage.total} />;
}
