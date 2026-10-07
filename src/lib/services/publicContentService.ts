import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { MOCK_SERVICES, MOCK_REVIEWS } from '@/lib/data/mockData';
import type {
  ExperienceReview,
  HomepageSection,
  PortfolioAlbum,
  PortfolioImage,
  PublicReviewCursor,
  PublicReviewPage,
  PublicReviewSummary,
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

export async function getPublicAlbumCoverPage(offset = 0, limit = 24) {
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const safeLimit = Math.min(24, Math.max(1, Math.floor(limit) || 24));
  const client = publicClient();
  const { data, error, count } = await client
    .from('portfolio_albums')
    .select(ALBUM_COVER_SELECT, { count: 'exact' })
    .eq('is_public', true)
    .order('display_order')
    .range(safeOffset, safeOffset + safeLimit - 1);
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
  const media = new Map<string, string[]>();
  const avatars = new Map<string, string>();
  const likes = new Map<string, number>();
  try {
    const [{ data: images }, { data: authors }, { data: likeCounts }] = await Promise.all([
      client.from('review_images').select('review_id,image_url,display_order').in('review_id', reviewIds).order('display_order'),
      client.rpc('get_public_review_authors', { target_ids: userIds }),
      client.rpc('get_review_like_counts', { target_review_ids: reviewIds }),
    ]);
    (images ?? []).forEach((image) => media.set(image.review_id, [...(media.get(image.review_id) ?? []), image.image_url]));
    (authors ?? []).forEach((author: { id: string; avatar_url: string | null }) => { if (author.avatar_url) avatars.set(author.id, author.avatar_url); });
    (likeCounts ?? []).forEach((like: { review_id: string; like_count: number | string }) => { likes.set(like.review_id, Number(like.like_count ?? 0)); });
  } catch { /* Optional review media/avatar/like migrations may not exist yet. */ }
  return data.map((row) => ({ ...mapReview(row), avatar_url: row.user_id ? avatars.get(row.user_id) : undefined, photos: media.get(row.id) ?? [], likes: likes.get(row.id) ?? 0 }));
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
      const last = data[data.length - 1];
      return { reviews, nextCursor: data.length === safeLimit ? { created_at: String(last.created_at), id: String(last.id) } : null };
    }
  } catch {
    // Fall through to local fixtures in development.
  }
  const fallback = process.env.NODE_ENV !== 'production' ? MOCK_REVIEWS.filter((review) => review.is_public) : [];
  const safeOffset = cursor ? fallback.findIndex((review) => review.id === cursor.id) + 1 : 0;
  const reviews = safeOffset > 0 ? fallback.slice(safeOffset, safeOffset + limit) : fallback.slice(0, limit);
  const last = reviews[reviews.length - 1];
  return { reviews, nextCursor: reviews.length === limit && last ? { created_at: last.created_at, id: last.id } : null };
}

export function getPublicReviewPage(cursor?: PublicReviewCursor | null, limit = PUBLIC_REVIEW_PAGE_SIZE) {
  const cursorKey = cursor ? `${cursor.created_at}:${cursor.id}` : 'first';
  return unstable_cache(
    () => queryReviewPage(cursor, limit),
    ['public-reviews-page', cursorKey, String(limit)],
    { revalidate: 300, tags: [CONTENT_TAG] },
  )();
}

export async function getPublicReviews() {
  return (await getPublicReviewPage()).reviews;
}

export async function getPublicReviewSummary(): Promise<PublicReviewSummary> {
  try {
    const { data, error } = await publicClient().rpc('get_public_review_summary');
    if (!error && data) {
      const rows = data as Array<{ average_rating: number | string; total_reviews: number | string; rating: number; rating_count: number | string }>;
      const first = rows[0];
      return {
        averageRating: Number(first?.average_rating ?? 0),
        totalReviews: Number(first?.total_reviews ?? 0),
        distribution: Object.fromEntries(rows.map((row) => [Number(row.rating), Number(row.rating_count)])),
      };
    }
  } catch { /* Fall through to the local development summary. */ }
  const reviews = process.env.NODE_ENV !== 'production' ? MOCK_REVIEWS.filter((review) => review.is_public) : [];
  return {
    averageRating: reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : 0,
    totalReviews: reviews.length,
    distribution: Object.fromEntries([1, 2, 3, 4, 5].map((rating) => [rating, reviews.filter((review) => review.rating === rating).length])),
  };
}
