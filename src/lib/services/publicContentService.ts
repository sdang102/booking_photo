import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import type {
  ExperienceReview,
  FaqItem,
  HomepageSection,
  PortfolioAlbum,
  PortfolioImage,
  PublicReviewCursor,
  PublicReviewPage,
  PublicReviewSummary,
  Service,
  ServiceAddon,
} from '@/types';
import { getCatalogFallbackServices, mapServiceRow } from './serviceCatalog';
import { getReviewPageCursor } from '../reviewPagination';

/**
 * Public reads intentionally use an anonymous, server-side Supabase client.
 * Keeping these queries here prevents browser auth state from making public
 * pages dynamic and gives all public routes one cache/revalidation boundary.
 */
const CONTENT_TAG = 'public-content';
const PUBLIC_IMAGE_FALLBACK = '/fin-hero-bg.jpg';
const MAX_PUBLIC_IMAGE_VALUE_LENGTH = 512_000;
const ALBUM_COVER_SELECT = 'id,slug,title,shoot_date,location_text,cover_image,cover_image_mobile,display_order,is_public,categories(slug),locations(name)';
const ALBUM_IMAGE_SELECT = 'id,image_url,thumb_url,alt_text,width,height,display_order';
const PUBLIC_REVIEW_PAGE_SIZE = 12;

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

interface ReviewRow {
  id: string;
  booking_id: string;
  user_id?: string | null;
  rating: number;
  comment: string;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  bookings?: { customer_name?: string | null; service_name_snapshot?: string | null } | Array<{ customer_name?: string | null; service_name_snapshot?: string | null }> | null;
  portfolio_albums?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
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

function mapAlbumImage(image: Record<string, unknown>, fallbackAlt: string): PortfolioImage {
  return {
    id: String(image.id),
    url: safePublicImage(image.image_url),
    thumbnail_url: safePublicImage(image.thumb_url ?? image.image_url),
    alt: String(image.alt_text ?? fallbackAlt),
    width: Number(image.width) || 1200,
    height: Number(image.height) || 800,
  };
}

async function queryAlbums(limit?: number, offset = 0): Promise<PortfolioAlbum[]> {
  const query = publicClient()
    .from('portfolio_albums')
    .select(ALBUM_COVER_SELECT)
    .eq('is_public', true)
    .order('display_order');
  const { data, error } = limit ? await query.range(Math.max(0, offset), Math.max(0, offset) + limit - 1) : await query;
  if (error || !data) return [];
  return (data as unknown as AlbumRow[]).map(mapAlbum);
}

const getCachedAlbums = (limit?: number) => unstable_cache(
  () => queryAlbums(limit),
  ['public-albums', limit ? String(limit) : 'all'],
  { revalidate: 300, tags: [CONTENT_TAG] },
)();

async function queryAlbum(slug: string): Promise<PortfolioAlbum | null> {
  const { data, error } = await publicClient()
    .from('portfolio_albums')
    .select(ALBUM_COVER_SELECT)
    .eq('slug', slug)
    .eq('is_public', true)
    .single();
  return error || !data ? null : mapAlbum(data as AlbumRow);
}

export function getPublicAlbumCovers(limit?: number) {
  return getCachedAlbums(limit);
}

export async function getPublicAlbumCoverPage(offset = 0, limit = 24, category?: string) {
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const safeLimit = Math.min(24, Math.max(1, Math.floor(limit) || 24));
  const client = publicClient();
  const select = category ? ALBUM_COVER_SELECT.replace('categories(slug)', 'categories!inner(slug)') : ALBUM_COVER_SELECT;
  let query = client
    .from('portfolio_albums')
    .select(select, { count: 'exact' })
    .eq('is_public', true)
    .order('display_order');
  if (category) query = query.eq('categories.slug', category);
  const { data, error, count } = await query.range(safeOffset, safeOffset + safeLimit - 1);
  const albums = error || !data ? [] : (data as unknown as AlbumRow[]).map(mapAlbum);
  return { albums, nextOffset: albums.length === safeLimit ? safeOffset + albums.length : null, total: count ?? safeOffset + albums.length };
}

export function getPublicAlbumBySlug(slug: string) {
  return unstable_cache(
    () => queryAlbum(slug),
    ['public-album', slug],
    { revalidate: 300, tags: [CONTENT_TAG, `public-album:${slug}`] },
  )();
}

async function queryAlbumImagePage(slug: string, offset: number, limit: number) {
  const client = publicClient();
  const { data: album, error: albumError } = await client
    .from('portfolio_albums')
    .select('id,title')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  if (albumError || !album) return { images: [], nextOffset: null as number | null };

  const safeLimit = Math.min(18, Math.max(1, Math.floor(limit) || 18));
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const { data, error, count } = await client
    .from('portfolio_images')
    .select(ALBUM_IMAGE_SELECT, { count: 'exact' })
    .eq('album_id', album.id)
    .order('display_order', { ascending: true })
    .order('id', { ascending: true })
    .range(safeOffset, safeOffset + safeLimit - 1);
  if (error || !data) return { images: [], nextOffset: null as number | null, total: 0 };
  const images = (data as unknown as Array<Record<string, unknown>>).map((image) => mapAlbumImage(image, String(album.title)));
  return { images, nextOffset: images.length === safeLimit ? safeOffset + images.length : null, total: count ?? safeOffset + images.length };
}

export function getPublicAlbumImagePage(slug: string, offset = 0, limit = 18) {
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const safeLimit = Math.min(18, Math.max(1, Math.floor(limit) || 18));
  return unstable_cache(
    () => queryAlbumImagePage(slug, safeOffset, safeLimit),
    ['public-album-images', slug, String(safeOffset), String(safeLimit)],
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
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (!error && data) {
      return data.map((row, index) => {
        const category = relation(row.categories as { slug?: string } | Array<{ slug?: string }> | null);
        return mapServiceRow(row, index, category?.slug ?? 'portrait', safePublicImage(row.cover_image));
      }).filter((service): service is Service => service !== null);
    }
  } catch {
    // Fall through to the existing development fixtures when Supabase is unavailable.
  }
  return process.env.NODE_ENV !== 'production' ? getCatalogFallbackServices() : [];
}

export const getPublicServices = unstable_cache(queryServices, ['public-services'], { revalidate: 300, tags: [CONTENT_TAG] });

async function queryAddons(): Promise<ServiceAddon[]> {
  const { data, error } = await publicClient().from('service_addons').select('id,title,description,price,price_label').eq('is_active', true).order('display_order');
  return error || !data ? [] : data.map((item) => ({ id: String(item.id), title: String(item.title), description: String(item.description ?? ''), price: Number(item.price), price_label: String(item.price_label ?? '') }));
}

export const getPublicServiceAddons = unstable_cache(queryAddons, ['public-service-addons'], { revalidate: 300, tags: [CONTENT_TAG] });

async function queryFaqs(): Promise<FaqItem[] | null> {
  const { data, error } = await publicClient()
    .from('faqs')
    .select('id,question,answer,display_order')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error) return null;
  return (data ?? []).map((item) => ({
    id: String(item.id),
    question: String(item.question),
    answer: String(item.answer),
    display_order: Number(item.display_order ?? 0),
  }));
}

export const getPublicFaqs = unstable_cache(queryFaqs, ['public-faqs'], { revalidate: 300, tags: [CONTENT_TAG] });

function mapReview(row: ReviewRow): ExperienceReview {
  const booking = relation(row.bookings);
  const album = relation(row.portfolio_albums);
  return {
    id: row.id,
    booking_id: row.booking_id,
    user_id: row.user_id ?? undefined,
    customer_name: booking?.customer_name ?? 'Khách hàng',
    rating: row.rating,
    comment: row.comment,
    service_title: booking?.service_name_snapshot ?? '',
    portfolio_slug: album?.slug ?? undefined,
    is_public: row.is_public,
    is_featured: row.is_featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function enrichReviewRows(client: ReturnType<typeof publicClient>, data: ReviewRow[]): Promise<ExperienceReview[]> {
  if (!data.length) return [];
  const reviewIds = data.map((row) => row.id);
  const userIds = data.map((row) => row.user_id).filter((id): id is string => Boolean(id));
  const media = new Map<string, { thumbnails: string[]; full: string[] }>();
  const authors = new Map<string, { name?: string; avatar?: string; service?: string }>();
  try {
    const [{ data: images }, { data: profiles }] = await Promise.all([
      (async () => {
        const modern = await client.from('review_images').select('review_id,image_url,thumb_url,display_order').in('review_id', reviewIds).order('display_order');
        if (!modern.error) return modern;
        const legacy = await client.from('review_images').select('review_id,image_url,display_order').in('review_id', reviewIds).order('display_order');
        return { ...legacy, data: legacy.data?.map((row) => ({ ...row, thumb_url: null })) ?? null };
      })(),
      client.rpc('get_public_review_profiles', { target_ids: reviewIds }),
    ]);
    (images ?? []).forEach((image) => {
      if (!image.review_id || !image.image_url) return;
      const current = media.get(image.review_id) ?? { thumbnails: [], full: [] };
      current.thumbnails.push(image.thumb_url || image.image_url);
      current.full.push(image.image_url);
      media.set(image.review_id, current);
    });
    (profiles ?? []).forEach((profile: { review_id: string; full_name: string | null; avatar_url: string | null; service_title: string | null }) => {
      if (profile.review_id) authors.set(profile.review_id, { name: profile.full_name ?? undefined, avatar: profile.avatar_url ?? undefined, service: profile.service_title ?? undefined });
    });
  } catch { /* Optional review media/avatar/like migrations may not exist yet. */ }
  if (!authors.size && userIds.length) {
    try {
      const { data: legacyAuthors } = await client.rpc('get_public_review_authors', { target_ids: userIds });
      (legacyAuthors ?? []).forEach((author: { id: string; avatar_url: string | null }) => {
        const review = data.find((row) => row.user_id === author.id);
        if (review) authors.set(review.id, { avatar: author.avatar_url ?? undefined });
      });
    } catch { /* The legacy author helper is optional during migration rollout. */ }
  }
  return data.map((row) => {
    const mapped = mapReview(row);
    const author = authors.get(row.id);
    return { ...mapped, customer_name: author?.name || mapped.customer_name, service_title: author?.service || mapped.service_title, avatar_url: author?.avatar, photos: media.get(row.id)?.thumbnails ?? [], photo_urls: media.get(row.id)?.full ?? [] };
  });
}

async function queryReviewPage(cursor?: PublicReviewCursor | null, limit = PUBLIC_REVIEW_PAGE_SIZE): Promise<PublicReviewPage> {
  try {
    const client = publicClient();
    const safeLimit = Math.min(PUBLIC_REVIEW_PAGE_SIZE, Math.max(1, Math.floor(limit) || PUBLIC_REVIEW_PAGE_SIZE));
    let query = client
      .from('reviews')
      .select('id,booking_id,user_id,rating,comment,is_public,is_featured,created_at,updated_at,bookings(customer_name,service_name_snapshot),portfolio_albums(slug)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (cursor?.created_at && cursor.id) {
      query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    }
    query = query.order('id', { ascending: false }).limit(safeLimit);
    const { data, error } = await query;
    if (!error && data) {
      const reviews = await enrichReviewRows(client, data as unknown as ReviewRow[]);
      return { reviews, nextCursor: getReviewPageCursor(data as Array<{ created_at: string; id: string }>, safeLimit) };
    }
  } catch {
    // Fall through to local fixtures in development.
  }
  return { reviews: [], nextCursor: null };
}

export function getPublicReviewPage(cursor?: PublicReviewCursor | null, limit = PUBLIC_REVIEW_PAGE_SIZE) {
  const cursorKey = cursor ? `${cursor.created_at}:${cursor.id}` : 'first';
  return unstable_cache(
    () => queryReviewPage(cursor, limit),
    ['public-reviews-page', cursorKey, String(limit)],
    { revalidate: 300, tags: [CONTENT_TAG] },
  )();
}

export async function getPublicReviewSummary(): Promise<PublicReviewSummary> {
  try {
    const { data, error } = await publicClient().rpc('get_public_review_summary');
    if (!error && data) {
      const rows = data as Array<{ average_rating: number | string; total_reviews: number | string; rating: number; rating_count: number | string }>;
      const first = rows[0];
      if (first && Number(first.total_reviews ?? 0) > 0) {
        return {
          averageRating: Number(first.average_rating ?? 0),
          totalReviews: Number(first.total_reviews ?? 0),
          distribution: Object.fromEntries(rows.map((row) => [Number(row.rating), Number(row.rating_count)])),
        };
      }
    }
  } catch { /* Fall through to the local development summary. */ }
  try {
    const { data, error } = await publicClient().from('reviews').select('rating').eq('is_public', true);
    if (!error && data) {
      const ratings = data.map((row) => Number(row.rating)).filter((value) => value >= 1 && value <= 5);
      return summarizeRatings(ratings);
    }
  } catch { /* Fall through to local fixtures when the public table is unavailable. */ }
  return summarizeRatings([]);
}

function summarizeRatings(ratings: number[]): PublicReviewSummary {
  return {
    averageRating: ratings.length ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10 : 0,
    totalReviews: ratings.length,
    distribution: Object.fromEntries([1, 2, 3, 4, 5].map((rating) => [rating, ratings.filter((value) => value === rating).length])),
  };
}
