import type { MetadataRoute } from 'next';
import { getPublicAlbumSitemapRows } from '@/lib/services/siteSettingsService';
import { getSiteUrl } from '@/lib/siteMetadata';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const staticRoutes: Array<{
    path: string;
    changeFrequency: 'weekly' | 'monthly' | 'yearly';
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/portfolio', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/reviews', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/booking', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ];
  const albums = await getPublicAlbumSitemapRows();

  return [
    ...staticRoutes.map((route) => ({
      url: new URL(route.path, baseUrl).toString(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...albums.map((album) => ({
      url: new URL(`/portfolio/${encodeURIComponent(album.slug)}`, baseUrl).toString(),
      lastModified: new Date(album.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
