import type { Metadata } from 'next';
import { getPublicSiteSettings } from '@/lib/services/siteSettingsService';

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const candidate = configured || (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000');

  try {
    return new URL(candidate);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export async function createPublicMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const resolvedTitle = title || settings.seoTitle;
  const resolvedDescription = description || settings.seoDescription;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: path,
      siteName: settings.websiteName,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [{ url: settings.ogImageUrl, alt: settings.websiteName }],
    },
  };
}
