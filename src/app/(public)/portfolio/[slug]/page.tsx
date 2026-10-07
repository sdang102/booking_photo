import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioAlbumPageClient from '@/components/PortfolioAlbumPageClient';
import { getPublicAlbumBySlug } from '@/lib/services/publicContentService';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await getPublicAlbumBySlug(slug);
  if (!album) return { title: 'Album không tồn tại | FIN PHOTO' };
  return {
    title: `${album.title} | FIN PHOTO`,
    description: `Khám phá bộ ảnh ${album.title}${album.location ? ` tại ${album.location}` : ''} — FIN PHOTO.`,
    openGraph: { title: `${album.title} | FIN PHOTO`, description: `Bộ ảnh ${album.title} của FIN PHOTO.`, images: album.cover_url ? [{ url: album.cover_url, alt: album.title }] : undefined },
  };
}

export default async function PortfolioAlbumPage({ params }: Props) {
  const { slug } = await params;
  const album = await getPublicAlbumBySlug(slug);
  if (!album) notFound();
  return <PortfolioAlbumPageClient album={album} />;
}
