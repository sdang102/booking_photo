begin;

-- Keep review reactions independent from the review row so every signed-in
-- user can react once and toggle their own reaction safely.
create table if not exists public.review_likes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index if not exists review_likes_review_id_idx on public.review_likes(review_id);
alter table public.review_likes enable row level security;

drop policy if exists "public_review_like_counts" on public.review_likes;
create policy "public_review_like_counts" on public.review_likes
  for select to anon, authenticated using (true);

drop policy if exists "user_review_like_insert" on public.review_likes;
create policy "user_review_like_insert" on public.review_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.reviews r where r.id = review_id and r.is_public)
  );

drop policy if exists "user_review_like_delete" on public.review_likes;
create policy "user_review_like_delete" on public.review_likes
  for delete to authenticated using (user_id = auth.uid());

-- Return only the small public author projection needed by review cards. The
-- security-definer function avoids exposing the complete profiles table.
create or replace function public.get_public_review_authors(target_ids uuid[])
returns table(id uuid, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select profile.id, profile.avatar_url
  from public.profiles profile
  where profile.id = any(coalesce(target_ids, '{}'::uuid[]));
$$;
grant execute on function public.get_public_review_authors(uuid[]) to anon, authenticated;

create or replace function public.get_my_review_likes(target_review_ids uuid[])
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select like_row.review_id
  from public.review_likes like_row
  where like_row.user_id = auth.uid()
    and like_row.review_id = any(coalesce(target_review_ids, '{}'::uuid[]));
$$;
grant execute on function public.get_my_review_likes(uuid[]) to authenticated;

create or replace function public.toggle_review_like(target_review uuid)
returns table(liked boolean, like_count bigint)
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not exists (select 1 from public.reviews r where r.id = target_review and r.is_public) then
    raise exception 'Review not found';
  end if;

  if exists (select 1 from public.review_likes where review_id = target_review and user_id = auth.uid()) then
    delete from public.review_likes where review_id = target_review and user_id = auth.uid();
    liked := false;
  else
    insert into public.review_likes(review_id, user_id) values (target_review, auth.uid())
      on conflict (review_id, user_id) do nothing;
    liked := true;
  end if;

  select count(*) into like_count from public.review_likes where review_id = target_review;
  return next;
end;
$$;
grant execute on function public.toggle_review_like(uuid) to authenticated;

commit;
