import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteMetadata';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/photographer/', '/profile', '/my-bookings', '/login'],
    },
    sitemap: new URL('/sitemap.xml', baseUrl).toString(),
    host: baseUrl.origin,
  };
}
