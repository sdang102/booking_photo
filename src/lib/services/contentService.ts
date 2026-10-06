import { createClient } from '@/lib/supabase/client';
import type { FaqItem, HomepageSection, PortfolioAlbum, ServiceAddon, ShootingLocation } from '@/types';
import { SHOOTING_LOCATIONS } from '@/lib/data/mockData';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function getPortfolioAlbums(publicOnly = true): Promise<PortfolioAlbum[]> {
  const supabase = createClient();
  let query = supabase.from('portfolio_albums').select('*, categories(slug), locations(name), portfolio_images(*)').order('display_order');
  if (publicOnly) query = query.eq('is_public', true);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((album) => ({ id: album.id, slug: album.slug, title: album.title,
    category: album.categories?.slug ?? 'concept', location: album.location_text ?? album.locations?.name,
    cover_url: album.cover_image ?? '', mobile_cover_url:album.cover_image_mobile??undefined, images: (album.portfolio_images ?? []).sort((a: { display_order:number }, b: { display_order:number }) => a.display_order-b.display_order).map((image: { id:string; image_url:string; alt_text?:string;width?:number;height?:number }) => ({ id:image.id,url:image.image_url,alt:image.alt_text ?? album.title,width:image.width||1200,height:image.height||800 })) })) as PortfolioAlbum[];
}

export async function getPortfolioAlbum(slug: string) {
  return (await getPortfolioAlbums(true)).find((album) => album.slug === slug) ?? null;
}

export async function getLocations(): Promise<ShootingLocation[]> {
  const { data, error } = await createClient().from('locations').select('*').eq('is_active', true).order('display_order');
  if (error || !data) return isDevelopment ? SHOOTING_LOCATIONS : [];
  return data.map((item) => ({ id:item.id,name:item.name,area:item.area,description:item.description ?? '',travel_fee:Number(item.travel_fee),image_url:item.cover_image ?? '' }));
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const { data, error } = await createClient().from('homepage_sections').select('*').eq('is_visible', true).order('display_order');
  if (error || !data) return [];
  return data.map((item) => ({
    id: String(item.id), section_key: String(item.section_key),
    title: item.title ?? undefined, subtitle: item.subtitle ?? undefined,
    image_url: item.image_url ?? undefined,
    content: item.content && typeof item.content === 'object' ? item.content as Record<string, unknown> : {},
    is_visible: Boolean(item.is_visible), display_order: Number(item.display_order ?? 0),
  }));
}

export async function getFaqs(): Promise<FaqItem[]> {
  const { data, error } = await createClient().from('faqs').select('id,question,answer,display_order').eq('is_visible', true).order('display_order');
  if (error || !data) return [];
  return data.map((item) => ({ id:String(item.id), question:String(item.question), answer:String(item.answer), display_order:Number(item.display_order ?? 0) }));
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
