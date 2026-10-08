begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin create type public.app_role as enum ('user','photographer','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.booking_status as enum ('pending','confirmed','checked_in','shooting','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('unpaid','deposit_paid','paid','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type public.availability_status as enum ('available','blocked','off'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path=public as $$ begin new.updated_at=now(); return new; end $$;

create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null default '',email text not null,phone text,avatar_url text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.roles(id smallserial primary key,name public.app_role unique not null,created_at timestamptz not null default now());
create table if not exists public.user_roles(user_id uuid references auth.users(id) on delete cascade,role_id smallint references public.roles(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,role_id));
insert into public.roles(name) values('user'),('photographer'),('admin') on conflict(name) do nothing;

create or replace function public.has_role(required_role public.app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=auth.uid() and r.name=required_role) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select public.has_role('admin') $$;
create or replace function public.is_photographer() returns boolean language sql stable security definer set search_path=public as $$ select public.has_role('photographer') or public.is_admin() $$;
grant execute on function public.has_role(public.app_role),public.is_admin(),public.is_photographer() to anon,authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,email,phone) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.email,''),new.raw_user_meta_data->>'phone') on conflict(id) do nothing;
 insert into public.user_roles(user_id,role_id) select new.id,id from public.roles where name='user' on conflict do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.site_settings(id uuid primary key default gen_random_uuid(),website_name text not null,photographer_name text not null,logo_url text,favicon_url text,phone text,email text,facebook_url text,instagram_url text,tiktok_url text,threads_url text,default_deposit numeric(12,2) not null default 30 check(default_deposit between 0 and 100),booking_notice text,cancellation_policy text,reschedule_policy text,seo_title text,seo_description text,og_image_url text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.homepage_sections(id uuid primary key default gen_random_uuid(),section_key text unique not null,title text,subtitle text,content jsonb not null default '{}'::jsonb,image_url text,is_visible boolean not null default true,display_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.categories(id uuid primary key default gen_random_uuid(),name text not null,slug text unique not null,description text,is_active boolean not null default true,display_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());

create table if not exists public.services(id uuid primary key default gen_random_uuid(),category_id uuid references public.categories(id) on delete restrict,name text not null,slug text unique not null,short_description text,description text,price numeric(12,2) not null check(price>=0),deposit_amount numeric(12,2) not null default 0 check(deposit_amount>=0),duration_minutes int not null check(duration_minutes>0),edited_photo_count int,concept_count int,location_count int,outfit_count int,cover_image text,features jsonb not null default '[]'::jsonb,terms text,is_featured boolean not null default false,is_active boolean not null default true,display_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.services add column if not exists category_id uuid references public.categories(id) on delete restrict;
alter table public.services add column if not exists name text;
alter table public.services add column if not exists short_description text;
alter table public.services add column if not exists deposit_amount numeric(12,2) not null default 0;
alter table public.services add column if not exists edited_photo_count int;
alter table public.services add column if not exists concept_count int;
alter table public.services add column if not exists location_count int;
alter table public.services add column if not exists outfit_count int;
alter table public.services add column if not exists cover_image text;
alter table public.services add column if not exists terms text;
alter table public.services add column if not exists is_featured boolean not null default false;
alter table public.services add column if not exists is_active boolean not null default true;
alter table public.services add column if not exists display_order int not null default 0;
alter table public.services add column if not exists updated_at timestamptz not null default now();
do $$ begin if exists(select 1 from information_schema.columns where table_schema='public' and table_name='services' and column_name='title') then execute 'update public.services set name=coalesce(name,title),cover_image=coalesce(cover_image,image_url),is_featured=coalesce(is_featured,is_popular,false)'; end if; end $$;
alter table public.services alter column name set not null;
create table if not exists public.locations(id uuid primary key default gen_random_uuid(),name text not null,area text,address text,description text,cover_image text,travel_fee numeric(12,2) not null default 0 check(travel_fee>=0),is_active boolean not null default true,display_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.portfolio_albums(id uuid primary key default gen_random_uuid(),category_id uuid references public.categories(id) on delete restrict,title text not null,slug text unique not null,description text,location_id uuid references public.locations(id) on delete set null,location_text text,shoot_date date,cover_image text,is_featured boolean not null default false,is_public boolean not null default true,display_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.portfolio_images(id uuid primary key default gen_random_uuid(),album_id uuid not null references public.portfolio_albums(id) on delete cascade,storage_path text,image_url text not null,caption text,alt_text text,display_order int not null default 0,created_at timestamptz not null default now());
create table if not exists public.availability(id uuid primary key default gen_random_uuid(),date date not null,start_time time not null,end_time time not null,status public.availability_status not null default 'blocked',reason text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(end_time>start_time));

do $$ begin if to_regclass('public.bookings') is not null and not exists(select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='booking_code') then alter table public.bookings rename to bookings_legacy; end if; end $$;
create table if not exists public.bookings(id uuid primary key default gen_random_uuid(),booking_code text unique not null default ('BK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),user_id uuid references auth.users(id) on delete set null,service_id uuid references public.services(id) on delete restrict,location_id uuid references public.locations(id) on delete set null,customer_name text not null,customer_phone text not null,customer_email text not null,shoot_date date not null,start_time time not null,end_time time not null,customer_note text,photographer_note text,service_name_snapshot text not null,service_price_snapshot numeric(12,2) not null check(service_price_snapshot>=0),travel_fee_snapshot numeric(12,2) not null default 0 check(travel_fee_snapshot>=0),subtotal numeric(12,2) not null check(subtotal>=0),travel_fee numeric(12,2) not null default 0 check(travel_fee>=0),discount numeric(12,2) not null default 0 check(discount>=0),total_price numeric(12,2) not null check(total_price>=0),deposit_amount numeric(12,2) not null default 0 check(deposit_amount>=0),status public.booking_status not null default 'pending',payment_status public.payment_status not null default 'unpaid',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(end_time>start_time),check(deposit_amount<=total_price));
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap exclude using gist (shoot_date with =,tsrange((shoot_date+start_time)::timestamp,(shoot_date+end_time)::timestamp,'[)') with &&) where(status in('pending','confirmed','checked_in','shooting'));

create table if not exists public.payments(id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id) on delete restrict,amount numeric(12,2) not null check(amount>0),payment_method text,transaction_code text,status public.payment_status not null default 'unpaid',paid_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
do $$ begin if to_regclass('public.reviews') is not null and not exists(select 1 from information_schema.columns where table_schema='public' and table_name='reviews' and column_name='portfolio_album_id') then alter table public.reviews rename to reviews_legacy; end if; end $$;
create table if not exists public.reviews(id uuid primary key default gen_random_uuid(),booking_id uuid unique not null references public.bookings(id) on delete restrict,user_id uuid references auth.users(id) on delete set null,portfolio_album_id uuid references public.portfolio_albums(id) on delete set null,rating int not null check(rating between 1 and 5),comment text not null check(length(trim(comment)) between 10 and 800),is_public boolean not null default true,is_featured boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.faqs(id uuid primary key default gen_random_uuid(),question text not null,answer text not null,is_visible boolean not null default true,display_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.media(id uuid primary key default gen_random_uuid(),uploaded_by uuid references auth.users(id) on delete set null,bucket text not null,storage_path text unique not null,public_url text,filename text not null,mime_type text,size_bytes bigint check(size_bytes>=0),category text not null default 'other',metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now());

create or replace function public.validate_booking_write() returns trigger language plpgsql security definer set search_path=public as $$
declare svc public.services; loc public.locations;
begin
 select * into svc from public.services where id=new.service_id and is_active=true;
 if not found then raise exception 'Service unavailable'; end if;
 if new.location_id is not null then select * into loc from public.locations where id=new.location_id and is_active=true; if not found then raise exception 'Location unavailable'; end if; end if;
 if exists(select 1 from public.availability a where a.date=new.shoot_date and a.status in('blocked','off') and new.start_time<a.end_time and a.start_time<new.end_time) then raise exception 'Selected time is unavailable'; end if;
 new.service_name_snapshot=svc.name; new.service_price_snapshot=svc.price; new.travel_fee_snapshot=coalesce(loc.travel_fee,0); new.subtotal=svc.price; new.travel_fee=coalesce(loc.travel_fee,0); new.total_price=greatest(0,new.subtotal+new.travel_fee-new.discount); new.deposit_amount=case when svc.deposit_amount>0 then svc.deposit_amount else round(new.total_price*coalesce((select default_deposit from public.site_settings limit 1),30)/100) end;
 return new;
end $$;
drop trigger if exists validate_booking_before_insert on public.bookings;
create trigger validate_booking_before_insert before insert on public.bookings for each row execute function public.validate_booking_write();

create or replace function public.photographer_advance_booking(target_id uuid,new_status public.booking_status,note text default null) returns public.bookings language plpgsql security definer set search_path=public as $$
declare current_booking public.bookings;
begin
 if not public.is_photographer() then raise exception 'Forbidden'; end if;
 select * into current_booking from public.bookings where id=target_id for update;
 if not found then raise exception 'Booking not found'; end if;
 if not ((current_booking.status='confirmed' and new_status='checked_in') or(current_booking.status='checked_in' and new_status='shooting')or(current_booking.status='shooting' and new_status='completed')) then raise exception 'Invalid status transition'; end if;
 update public.bookings set status=new_status,photographer_note=coalesce(note,photographer_note),updated_at=now() where id=target_id returning * into current_booking; return current_booking;
end $$;
grant execute on function public.photographer_advance_booking(uuid,public.booking_status,text) to authenticated;

create or replace function public.review_completed_booking(target_booking uuid,target_rating int,target_comment text) returns public.reviews language plpgsql security definer set search_path=public as $$
declare result public.reviews;
begin
 if target_rating not between 1 and 5 or length(trim(target_comment)) not between 10 and 800 then raise exception 'Invalid review'; end if;
 insert into public.reviews(booking_id,user_id,rating,comment) select id,auth.uid(),target_rating,target_comment from public.bookings where id=target_booking and status='completed' and user_id=auth.uid() returning * into result;
 if result.id is null then raise exception 'Booking is not reviewable'; end if; return result;
end $$;
grant execute on function public.review_completed_booking(uuid,int,text) to authenticated;

do $$ declare t text; begin foreach t in array array['profiles','roles','user_roles','site_settings','homepage_sections','categories','services','portfolio_albums','portfolio_images','locations','availability','bookings','payments','reviews','faqs','media'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;

do $$ declare t text; begin foreach t in array array['profiles','roles','user_roles','site_settings','homepage_sections','categories','services','portfolio_albums','portfolio_images','locations','availability','bookings','payments','reviews','faqs','media'] loop execute format('drop policy if exists "admin_all" on public.%I',t); execute format('create policy "admin_all" on public.%I for all to authenticated using(public.is_admin()) with check(public.is_admin())',t); end loop; end $$;
create policy "profile_self_read" on public.profiles for select to authenticated using(id=auth.uid());
create policy "profile_self_update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "public_settings" on public.site_settings for select to anon,authenticated using(true);
create policy "public_homepage" on public.homepage_sections for select to anon,authenticated using(is_visible);
create policy "public_categories" on public.categories for select to anon,authenticated using(is_active);
create policy "public_services" on public.services for select to anon,authenticated using(is_active);
create policy "public_albums" on public.portfolio_albums for select to anon,authenticated using(is_public);
create policy "public_album_images" on public.portfolio_images for select to anon,authenticated using(exists(select 1 from public.portfolio_albums a where a.id=album_id and a.is_public));
create policy "public_locations" on public.locations for select to anon,authenticated using(is_active);
create policy "public_faqs" on public.faqs for select to anon,authenticated using(is_visible);
create policy "public_reviews" on public.reviews for select to anon,authenticated using(is_public);
create policy "user_own_bookings" on public.bookings for select to authenticated using(user_id=auth.uid() or public.is_photographer());
create policy "user_create_booking" on public.bookings for insert to authenticated with check(user_id=auth.uid());
create policy "photographer_read_bookings" on public.bookings for select to authenticated using(public.is_photographer());
create policy "photographer_read_payments" on public.payments for select to authenticated using(public.is_photographer());
create policy "photographer_availability" on public.availability for all to authenticated using(public.is_photographer()) with check(public.is_photographer());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('site-assets','site-assets',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
('portfolio','portfolio',true,20971520,array['image/jpeg','image/png','image/webp','image/avif']),
('services','services',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
('locations','locations',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "public_media_read" on storage.objects for select to anon,authenticated using(bucket_id in('site-assets','portfolio','services','locations','avatars'));
create policy "admin_media_insert" on storage.objects for insert to authenticated with check(public.is_admin() and bucket_id in('site-assets','portfolio','services','locations','avatars'));
create policy "admin_media_update" on storage.objects for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin_media_delete" on storage.objects for delete to authenticated using(public.is_admin());

do $$ declare t text; begin foreach t in array array['profiles','site_settings','homepage_sections','categories','services','portfolio_albums','locations','availability','bookings','payments','reviews','faqs','media'] loop execute format('drop trigger if exists set_%I_updated_at on public.%I',t,t); execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop; end $$;
commit;
