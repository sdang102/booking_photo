import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { reportError } from '@/lib/reportError';

export interface PublicSiteSettings {
  websiteName: string;
  photographerName: string;
  phone: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  threadsUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
}

export const SITE_SETTINGS_FALLBACK: PublicSiteSettings = {
  websiteName: 'FIN PHOTO',
  photographerName: 'FIN PHOTO',
  phone: '0392152816',
  email: '',
  facebookUrl: '',
  instagramUrl: 'https://www.instagram.com/finphoto.sgn',
  tiktokUrl: 'https://www.tiktok.com/@chonphoto.sgn',
  threadsUrl: '',
  seoTitle: 'FIN PHOTO | Editorial Photography Sài Gòn',
  seoDescription:
    'FIN PHOTO — chân dung, couple, pre-wedding và editorial photography được kể bằng ánh sáng và cảm xúc.',
  ogImageUrl: '/fin-hero-bg.jpg',
};

function publicClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const { data, error } = await publicClient()
      .from('site_settings')
      .select(
        'website_name,photographer_name,phone,email,facebook_url,instagram_url,tiktok_url,threads_url,seo_title,seo_description,og_image_url',
      )
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error) reportError(error, { area: 'site-settings', operation: 'read-public' });
      return SITE_SETTINGS_FALLBACK;
    }

    return {
      websiteName: data.website_name?.trim() || SITE_SETTINGS_FALLBACK.websiteName,
      photographerName:
        data.photographer_name?.trim() || SITE_SETTINGS_FALLBACK.photographerName,
      phone: data.phone?.trim() || SITE_SETTINGS_FALLBACK.phone,
      email: data.email?.trim() || SITE_SETTINGS_FALLBACK.email,
      facebookUrl: data.facebook_url?.trim() || SITE_SETTINGS_FALLBACK.facebookUrl,
      instagramUrl: data.instagram_url?.trim() || SITE_SETTINGS_FALLBACK.instagramUrl,
      tiktokUrl: data.tiktok_url?.trim() || SITE_SETTINGS_FALLBACK.tiktokUrl,
      threadsUrl: data.threads_url?.trim() || SITE_SETTINGS_FALLBACK.threadsUrl,
      seoTitle: data.seo_title?.trim() || SITE_SETTINGS_FALLBACK.seoTitle,
      seoDescription:
        data.seo_description?.trim() || SITE_SETTINGS_FALLBACK.seoDescription,
      ogImageUrl: data.og_image_url?.trim() || SITE_SETTINGS_FALLBACK.ogImageUrl,
    };
  } catch (error) {
    reportError(error, { area: 'site-settings', operation: 'read-public' });
    return SITE_SETTINGS_FALLBACK;
  }
}

async function loadPublicAlbumSitemapRows() {
  try {
    const { data, error } = await publicClient()
      .from('portfolio_albums')
      .select('slug,updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false });
    if (error || !data) {
      if (error) reportError(error, { area: 'sitemap', operation: 'read-albums' });
      return [];
    }
    return data
      .filter((row) => typeof row.slug === 'string' && row.slug.length > 0)
      .map((row) => ({ slug: String(row.slug), updatedAt: String(row.updated_at) }));
  } catch (error) {
    reportError(error, { area: 'sitemap', operation: 'read-albums' });
    return [];
  }
}

export const getPublicSiteSettings = unstable_cache(
  loadPublicSiteSettings,
  ['public-site-settings'],
  { revalidate: 300, tags: ['public-content'] },
);

export const getPublicAlbumSitemapRows = unstable_cache(
  loadPublicAlbumSitemapRows,
  ['public-album-sitemap'],
  { revalidate: 300, tags: ['public-content'] },
);
