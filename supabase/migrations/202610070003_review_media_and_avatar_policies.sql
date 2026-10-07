begin;

drop function if exists public.get_current_user_context();
create function public.get_current_user_context()
returns table(id uuid, email text, full_name text, phone text, avatar_url text, roles public.app_role[])
language sql stable security definer set search_path = public
as $$
  select profile.id, profile.email, profile.full_name, profile.phone, profile.avatar_url,
    coalesce(array_agg(distinct role.name) filter (where role.name is not null), array['user'::public.app_role])::public.app_role[]
  from public.profiles profile
  left join public.user_roles membership on membership.user_id = profile.id
  left join public.roles role on role.id = membership.role_id
  where profile.id = auth.uid()
  group by profile.id, profile.email, profile.full_name, profile.phone, profile.avatar_url;
$$;
grant execute on function public.get_current_user_context() to authenticated;

-- User-generated media for reviews. The parent review remains the source of truth
-- for public visibility, while storage paths are scoped to the uploader.
create table if not exists public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  display_order integer not null default 0 check (display_order between 0 and 4),
  created_at timestamptz not null default now(),
  unique(review_id, display_order),
  unique(storage_path)
);

create index if not exists review_images_review_id_idx on public.review_images(review_id, display_order);
alter table public.review_images enable row level security;

create policy "public_review_images_read" on public.review_images
  for select to anon, authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.is_public));

create policy "user_review_images_insert" on public.review_images
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));

create policy "user_review_images_delete" on public.review_images
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('review-media', 'review-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "user_avatar_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_avatar_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_avatar_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_review_media_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'review-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_review_media_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'review-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'review-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user_review_media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'review-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public_review_media_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'review-media');

commit;
