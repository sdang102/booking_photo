begin;

-- Review reactions: never expose user_id through anonymous/public reads.
drop policy if exists "public_review_like_counts" on public.review_likes;
drop policy if exists "user_review_like_select" on public.review_likes;
create policy "user_review_like_select" on public.review_likes
  for select to authenticated
  using (user_id = auth.uid());

-- Keep the existing own-like RPC restricted to signed-in users.
revoke all on function public.get_my_review_likes(uuid[]) from public;
grant execute on function public.get_my_review_likes(uuid[]) to authenticated;

-- Public pages need aggregate counts, not the underlying user rows.
create or replace function public.get_review_like_counts(target_review_ids uuid[])
returns table(review_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select like_row.review_id, count(*)::bigint
  from public.review_likes like_row
  where like_row.review_id = any(coalesce(target_review_ids, '{}'::uuid[]))
  group by like_row.review_id;
$$;
revoke all on function public.get_review_like_counts(uuid[]) from public;
grant execute on function public.get_review_like_counts(uuid[]) to anon, authenticated;

create index if not exists review_likes_user_review_idx
  on public.review_likes(user_id, review_id);

-- Keep the bucket public for backwards-compatible URLs, but align the policy
-- with parent review visibility when the storage policy is evaluated.
drop policy if exists "public_review_media_read" on storage.objects;
create policy "public_review_media_read" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'review-media'
    and exists (
      select 1
      from public.review_images image_row
      join public.reviews review_row on review_row.id = image_row.review_id
      where image_row.storage_path = name
        and review_row.is_public
    )
  );

-- NULL photographer_id means a global block. Otherwise the block only applies
-- to the photographer assigned to the booking.
create or replace function public.validate_booking_write()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  svc public.services;
  loc public.locations;
begin
  select * into svc from public.services where id=new.service_id and is_active=true;
  if not found then raise exception 'Service unavailable'; end if;

  if new.location_id is not null then
    select * into loc from public.locations where id=new.location_id and is_active=true;
    if not found then raise exception 'Location unavailable'; end if;
  end if;

  if exists(
    select 1 from public.availability a
    where a.date=new.shoot_date
      and (a.photographer_id is null or a.photographer_id = new.photographer_id)
      and a.status in('blocked','off')
      and new.start_time<a.end_time
      and a.start_time<new.end_time
  ) then
    raise exception 'Selected time is unavailable';
  end if;

  new.service_name_snapshot=svc.name;
  new.service_price_snapshot=svc.price;
  new.travel_fee_snapshot=coalesce(loc.travel_fee,0);
  new.subtotal=svc.price;
  new.travel_fee=coalesce(loc.travel_fee,0);
  new.total_price=greatest(0,new.subtotal+new.travel_fee-new.discount);
  new.deposit_amount=0;
  return new;
end $$;

commit;
