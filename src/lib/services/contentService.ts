import { createClient } from '@/lib/supabase/client';
import type { HomepageSection, PortfolioAlbum, ServiceAddon } from '@/types';

interface AlbumCoverOptions {
  publicOnly?: boolean;
  limit?: number;
}

const ALBUM_COVER_SELECT = 'id,slug,title,shoot_date,location_text,cover_image,cover_image_mobile,display_order,is_public,categories(slug),locations(name)';
const ALBUM_DETAIL_SELECT = `${ALBUM_COVER_SELECT},portfolio_images(id,image_url,alt_text,width,height,display_order)`;

interface AlbumQueryRow {
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

function mapAlbumCover(album: AlbumQueryRow): PortfolioAlbum {
  const category = Array.isArray(album.categories) ? album.categories[0] : album.categories;
  const location = Array.isArray(album.locations) ? album.locations[0] : album.locations;
  return {
    id: String(album.id),
    slug: String(album.slug),
    title: String(album.title),
    category: category?.slug ?? 'concept',
    location: album.location_text ?? location?.name ?? undefined,
    shoot_date: album.shoot_date ?? undefined,
    cover_url: album.cover_image ?? '',
    mobile_cover_url: album.cover_image_mobile ?? undefined,
    images: [],
  } as PortfolioAlbum;
}

export async function getAlbumCovers({ publicOnly = true, limit }: AlbumCoverOptions = {}): Promise<PortfolioAlbum[]> {
  const supabase = createClient();
  let query = supabase.from('portfolio_albums').select(ALBUM_COVER_SELECT).order('display_order');
  if (publicOnly) query = query.eq('is_public', true);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as unknown as AlbumQueryRow[]).map(mapAlbumCover);
}

export async function getAlbumBySlug(slug: string): Promise<PortfolioAlbum | null> {
  const { data, error } = await createClient()
    .from('portfolio_albums')
    .select(ALBUM_DETAIL_SELECT)
    .eq('slug', slug)
    .eq('is_public', true)
    .order('display_order', { referencedTable: 'portfolio_images', ascending: true })
    .single();
  if (error || !data) return null;
  const row = data as unknown as AlbumQueryRow;
  const album = mapAlbumCover(row);
  album.images = (row.portfolio_images ?? []).map((image) => ({
    id: String(image.id),
    url: String(image.image_url),
    alt: String(image.alt_text ?? row.title),
    width: Number(image.width) || 1200,
    height: Number(image.height) || 800,
  }));
  return album;
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const { data, error } = await createClient().from('homepage_sections').select('id,section_key,title,subtitle,image_url,content,is_visible,display_order').eq('is_visible', true).order('display_order');
  if (error || !data) return [];
  return data.map((item) => ({
    id: String(item.id), section_key: String(item.section_key),
    title: item.title ?? undefined, subtitle: item.subtitle ?? undefined,
    image_url: item.image_url ?? undefined,
    content: item.content && typeof item.content === 'object' ? item.content as Record<string, unknown> : {},
    is_visible: Boolean(item.is_visible), display_order: Number(item.display_order ?? 0),
  }));
}

export async function getCategories(): Promise<{slug:string;name:string}[]> {
  const {data,error}=await createClient().from('categories').select('slug,name').eq('is_active',true).order('display_order');
  if(error||!data)return[];
  return data.map(item=>({slug:String(item.slug),name:String(item.name)}));
}

export async function getServiceAddons(): Promise<ServiceAddon[]> {
  const {data,error}=await createClient().from('service_addons').select('id,title,description,price,price_label').eq('is_active',true).order('display_order');
  if(error||!data)return[];
  return data.map(item=>({id:String(item.id),title:String(item.title),description:String(item.description??''),price:Number(item.price),price_label:String(item.price_label??'')}));
}
