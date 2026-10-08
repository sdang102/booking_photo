begin;

-- Public visitors only need blocked time ranges. The private reason remains
-- available to the photographer through the RLS-protected availability table.
drop function if exists public.get_public_availability();
create function public.get_public_availability()
returns table(
  id uuid,
  date date,
  start_time time,
  end_time time,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.date, a.start_time, a.end_time, a.created_at
  from public.availability a
  where a.status in ('blocked', 'off')
    and a.date between current_date and current_date + 90
  order by a.date, a.start_time, a.id;
$$;
revoke all on function public.get_public_availability() from public;
grant execute on function public.get_public_availability() to anon, authenticated;

-- A supplied profile id is returned only when it owns at least one public
-- review. This prevents the SECURITY DEFINER helper becoming a profile oracle.
create or replace function public.get_public_review_authors(target_ids uuid[])
returns table(id uuid, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct profile.id, profile.avatar_url
  from public.profiles profile
  where profile.id = any(coalesce(target_ids[1:100], '{}'::uuid[]))
    and exists (
      select 1
      from public.reviews review_row
      where review_row.user_id = profile.id
        and review_row.is_public
    );
$$;
revoke all on function public.get_public_review_authors(uuid[]) from public;
grant execute on function public.get_public_review_authors(uuid[]) to anon, authenticated;

-- Public reaction totals must never reveal activity for a hidden review.
create or replace function public.get_review_like_counts(target_review_ids uuid[])
returns table(review_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select like_row.review_id, count(*)::bigint
  from public.review_likes like_row
  join public.reviews review_row on review_row.id = like_row.review_id
  where review_row.is_public
    and like_row.review_id = any(coalesce(target_review_ids[1:100], '{}'::uuid[]))
  group by like_row.review_id;
$$;
revoke all on function public.get_review_like_counts(uuid[]) from public;
grant execute on function public.get_review_like_counts(uuid[]) to anon, authenticated;

-- The booking flow already requires a session. Restrict this probing helper to
-- authenticated users and accept only the three fixed launch shifts.
create or replace function public.check_booking_slot(
  target_date date,
  target_start_time time,
  target_photographer_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_end_time time := target_start_time + interval '2 hours';
begin
  if auth.uid() is null then
    return false;
  end if;

  if target_date < current_date or target_date > current_date + 90 then
    return false;
  end if;

  if target_start_time not in (time '08:30', time '13:30', time '18:00') then
    return false;
  end if;

  if exists (
    select 1
    from public.availability availability_row
    where availability_row.date = target_date
      and (
        target_photographer_id is null
        or availability_row.photographer_id is null
        or availability_row.photographer_id = target_photographer_id
      )
      and availability_row.status in ('blocked', 'off')
      and target_start_time < availability_row.end_time
      and availability_row.start_time < target_end_time
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.bookings booking
    where booking.shoot_date = target_date
      and (target_photographer_id is null or booking.photographer_id = target_photographer_id)
      and booking.status <> 'cancelled'
      and target_start_time < booking.end_time
      and booking.start_time < target_end_time
  ) then
    return false;
  end if;

  return true;
end;
$$;
revoke all on function public.check_booking_slot(date, time, uuid) from public;
grant execute on function public.check_booking_slot(date, time, uuid) to authenticated;

-- Limit administrator mutation policies to buckets owned by this application.
drop policy if exists "admin_media_update" on storage.objects;
create policy "admin_media_update" on storage.objects
for update to authenticated
using (
  public.is_admin()
  and bucket_id in ('site-assets', 'portfolio', 'services', 'locations', 'avatars', 'review-media')
)
with check (
  public.is_admin()
  and bucket_id in ('site-assets', 'portfolio', 'services', 'locations', 'avatars', 'review-media')
);

drop policy if exists "admin_media_delete" on storage.objects;
create policy "admin_media_delete" on storage.objects
for delete to authenticated
using (
  public.is_admin()
  and bucket_id in ('site-assets', 'portfolio', 'services', 'locations', 'avatars', 'review-media')
);

commit;
