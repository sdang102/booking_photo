-- Phase 2 image storage. Apply manually after reviewing in Supabase.
alter table public.portfolio_images
  add column if not exists thumb_url text,
  add column if not exists thumb_path text;

alter table public.homepage_sections add column if not exists image_path text;
alter table public.services add column if not exists cover_image_path text;
alter table public.portfolio_albums
  add column if not exists cover_image_path text,
  add column if not exists cover_image_mobile_path text;
alter table public.locations add column if not exists cover_image_path text;
alter table public.site_settings
  add column if not exists logo_path text,
  add column if not exists favicon_path text,
  add column if not exists og_image_path text;
alter table public.profiles add column if not exists avatar_path text;

create index if not exists portfolio_images_album_thumb_idx
  on public.portfolio_images(album_id, display_order, id);
