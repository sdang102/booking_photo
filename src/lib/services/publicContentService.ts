import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { MOCK_SERVICES, MOCK_REVIEWS } from '@/lib/data/mockData';
import type {
  ExperienceReview,
  HomepageSection,
  PortfolioAlbum,
  PortfolioImage,
  Service,
  ServiceAddon,
} from '@/types';

/**
 * Public reads intentionally use an anonymous, server-side Supabase client.
 * Keeping these queries here prevents browser auth state from making public
 * pages dynamic and gives all public routes one cache/revalidation boundary.
 */
const CONTENT_TAG = 'public-content';
const PUBLIC_IMAGE_FALLBACK = '/fin-hero-bg.jpg';
const MAX_PUBLIC_IMAGE_VALUE_LENGTH = 512_000;
const ALBUM_COVER_SELECT = 'id,slug,title,shoot_date,location_text,cover_image,cover_image_mobile,display_order,is_public,categories(slug),locations(name)';
const ALBUM_DETAIL_SELECT = `${ALBUM_COVER_SELECT},portfolio_images(id,image_url,storage_path,thumb_url,thumb_path,alt_text,width,height,display_order)`;
const ALBUM_DETAIL_SELECT_LEGACY = `${ALBUM_COVER_SELECT},portfolio_images(id,image_url,storage_path,alt_text,width,height,display_order)`;

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

interface AlbumRow {
  id: string;
  slug: string;
  title: string;
  shoot_date?: string | null;
  location_text?: string | null;
  cover_image?: string | null;
  cover_image_mobile?: string | null;
  categories?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
  locations?: { name?: string | null } | Array<{ name?: string | null }> | null;
  portfolio_images?: Array<Record<string, unknown>>;
}

function relation<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

/**
 * Legacy rows can still contain multi-megabyte data URLs. Never put those
 * values in public RSC/ISR payloads: Vercel rejects fallback bodies over its
 * size limit. Storage URLs remain untouched, while legacy inline images use a
 * small local fallback until they are migrated to Supabase Storage.
 */
function safePublicImage(value: unknown): string {
  if (typeof value !== 'string') return PUBLIC_IMAGE_FALLBACK;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_PUBLIC_IMAGE_VALUE_LENGTH || normalized.toLowerCase().startsWith('data:')) {
    return PUBLIC_IMAGE_FALLBACK;
  }
  return normalized;
}

function optionalPublicImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_PUBLIC_IMAGE_VALUE_LENGTH || normalized.toLowerCase().startsWith('data:')) {
    return undefined;
  }
  return normalized;
}

function mapAlbum(row: AlbumRow): PortfolioAlbum {
  const category = relation(row.categories);
  const location = relation(row.locations);
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: (category?.slug ?? 'concept') as PortfolioAlbum['category'],
    location: row.location_text ?? location?.name ?? undefined,
    shoot_date: row.shoot_date ?? undefined,
    cover_url: safePublicImage(row.cover_image),
    mobile_cover_url: optionalPublicImage(row.cover_image_mobile),
    images: [],
  };
}

function mapAlbumDetail(row: AlbumRow): PortfolioAlbum {
  const album = mapAlbum(row);
  album.images = (row.portfolio_images ?? []).map((image): PortfolioImage => ({
    id: String(image.id),
    url: safePublicImage(image.image_url),
    thumbnail_url: safePublicImage(image.thumb_url ?? image.image_url),
    alt: String(image.alt_text ?? row.title),
    width: Number(image.width) || 1200,
    height: Number(image.height) || 800,
  }));
  return album;
}

async function queryAlbums(limit?: number): Promise<PortfolioAlbum[]> {
  const query = publicClient()
    .from('portfolio_albums')
    .select(ALBUM_COVER_SELECT)
    .eq('is_public', true)
    .order('display_order');
  const { data, error } = limit ? await query.limit(limit) : await query;
  if (error || !data) return [];
  return (data as unknown as AlbumRow[]).map(mapAlbum);
}

const getCachedAlbums = (limit?: number) => unstable_cache(
  () => queryAlbums(limit),
  ['public-albums', limit ? String(limit) : 'all'],
  { revalidate: 300, tags: [CONTENT_TAG] },
)();

async function queryAlbum(slug: string): Promise<PortfolioAlbum | null> {
  const client = publicClient();
  const primary = await client
    .from('portfolio_albums')
    .select(ALBUM_DETAIL_SELECT)
    .eq('slug', slug)
    .eq('is_public', true)
    .order('display_order', { referencedTable: 'portfolio_images', ascending: true })
    .single();
  let data: unknown = primary.data;
  let error = primary.error;
  if (error && /thumb_url|thumb_path|column/i.test(error.message)) {
    const legacy = await client
      .from('portfolio_albums')
      .select(ALBUM_DETAIL_SELECT_LEGACY)
      .eq('slug', slug)
      .eq('is_public', true)
      .order('display_order', { referencedTable: 'portfolio_images', ascending: true })
      .single();
    data = legacy.data;
    error = legacy.error;
  }
  return error || !data ? null : mapAlbumDetail(data as AlbumRow);
}

export function getPublicAlbumCovers(limit?: number) {
  return getCachedAlbums(limit);
}

export function getPublicAlbumBySlug(slug: string) {
  return unstable_cache(
    () => queryAlbum(slug),
    ['public-album', slug],
    { revalidate: 300, tags: [CONTENT_TAG, `public-album:${slug}`] },
  )();
}

async function queryHomepage(): Promise<HomepageSection[]> {
  const { data, error } = await publicClient()
    .from('homepage_sections')
    .select('id,section_key,title,subtitle,image_url,content,is_visible,display_order')
    .eq('is_visible', true)
    .order('display_order');
  if (error || !data) return [];
  return data.map((item) => ({
    id: String(item.id),
    section_key: String(item.section_key),
    title: item.title ?? undefined,
    subtitle: item.subtitle ?? undefined,
    image_url: optionalPublicImage(item.image_url),
    content: item.content && typeof item.content === 'object' ? item.content as Record<string, unknown> : {},
    is_visible: Boolean(item.is_visible),
    display_order: Number(item.display_order ?? 0),
  }));
}

const getCachedHomepage = unstable_cache(queryHomepage, ['public-homepage-sections'], { revalidate: 300, tags: [CONTENT_TAG] });

export async function getPublicHomepageData() {
  const [sections, albums] = await Promise.all([getCachedHomepage(), getPublicAlbumCovers(4)]);
  return { sections, albums };
}

async function queryCategories(): Promise<Array<{ slug: string; name: string }>> {
  const { data, error } = await publicClient().from('categories').select('slug,name').eq('is_active', true).order('display_order');
  return error || !data ? [] : data.map((item) => ({ slug: String(item.slug), name: String(item.name) }));
}

export const getPublicCategories = unstable_cache(queryCategories, ['public-categories'], { revalidate: 300, tags: [CONTENT_TAG] });

async function queryServices(): Promise<Service[]> {
  try {
    const { data, error } = await publicClient()
      .from('services')
      .select('id,name,slug,description,short_description,price,duration_minutes,features,cover_image,is_featured,edited_photo_count,concept_count,location_count,categories(slug)')
      .order('price', { ascending: true });
    if (!error && data?.length) {
      return data.map((row) => {
        const category = relation(row.categories as { slug?: string } | Array<{ slug?: string }> | null);
        return {
          id: row.id,
          title: row.name,
          slug: row.slug,
          category: (category?.slug ?? 'portrait') as Service['category'],
          description: row.description ?? row.short_description ?? '',
          price: Number(row.price),
          duration_minutes: row.duration_minutes,
          features: Array.isArray(row.features) ? row.features : [],
          image_url: safePublicImage(row.cover_image),
          is_popular: row.is_featured,
          edited_photos: row.edited_photo_count,
          concept_count: row.concept_count,
          location_count: row.location_count ? String(row.location_count) : undefined,
        } as Service;
      });
    }
  } catch {
    // Fall through to the existing development fixtures when Supabase is unavailable.
  }
  return process.env.NODE_ENV !== 'production' ? MOCK_SERVICES : [];
}

export const getPublicServices = unstable_cache(queryServices, ['public-services'], { revalidate: 300, tags: [CONTENT_TAG] });

async function queryAddons(): Promise<ServiceAddon[]> {
  const { data, error } = await publicClient().from('service_addons').select('id,title,description,price,price_label').eq('is_active', true).order('display_order');
  return error || !data ? [] : data.map((item) => ({ id: String(item.id), title: String(item.title), description: String(item.description ?? ''), price: Number(item.price), price_label: String(item.price_label ?? '') }));
}

export const getPublicServiceAddons = unstable_cache(queryAddons, ['public-service-addons'], { revalidate: 300, tags: [CONTENT_TAG] });

// Supabase relation payloads are intentionally untyped here; the mapper normalizes them below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: Record<string, any>): ExperienceReview {
  const booking = relation(row.bookings);
  const album = relation(row.portfolio_albums);
  return {
    id: row.id,
    booking_id: row.booking_id,
    user_id: row.user_id,
    customer_name: booking?.customer_name ?? 'Khách hàng',
    rating: row.rating,
    comment: row.comment,
    service_title: booking?.service_name_snapshot ?? '',
    portfolio_slug: album?.slug,
    is_public: row.is_public,
    is_featured: row.is_featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function queryReviews(): Promise<ExperienceReview[]> {
  try {
    const client = publicClient();
    const { data, error } = await client
      .from('reviews')
      .select('id,booking_id,user_id,rating,comment,is_public,is_featured,created_at,updated_at,bookings(customer_name,service_name_snapshot),portfolio_albums(slug)')
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) {
      const reviewIds = data.map((row) => row.id);
      const userIds = data.map((row) => row.user_id).filter((id): id is string => Boolean(id));
      const media = new Map<string, string[]>();
      const avatars = new Map<string, string>();
      const likes = new Map<string, number>();
      try {
        const [{ data: images }, { data: authors }, { data: likeRows }] = await Promise.all([
          client.from('review_images').select('review_id,image_url,display_order').in('review_id', reviewIds).order('display_order'),
          client.rpc('get_public_review_authors', { target_ids: userIds }),
          client.from('review_likes').select('review_id').in('review_id', reviewIds),
        ]);
        (images ?? []).forEach((image) => media.set(image.review_id, [...(media.get(image.review_id) ?? []), image.image_url]));
        (authors ?? []).forEach((author: { id: string; avatar_url: string | null }) => { if (author.avatar_url) avatars.set(author.id, author.avatar_url); });
        (likeRows ?? []).forEach((like) => likes.set(like.review_id, (likes.get(like.review_id) ?? 0) + 1));
      } catch { /* Optional review media/avatar/like migrations may not exist yet. */ }
      return data.map((row) => ({ ...mapReview(row), avatar_url: row.user_id ? avatars.get(row.user_id) : undefined, photos: media.get(row.id) ?? [], likes: likes.get(row.id) ?? 0 }));
    }
  } catch {
    // Fall through to local fixtures in development.
  }
  return process.env.NODE_ENV !== 'production' ? MOCK_REVIEWS.filter((review) => review.is_public) : [];
}

export const getPublicReviews = unstable_cache(queryReviews, ['public-reviews'], { revalidate: 300, tags: [CONTENT_TAG] });
