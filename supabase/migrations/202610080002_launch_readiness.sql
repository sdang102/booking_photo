begin;

-- Public booking may only proceed when at least one account still has the
-- operational photographer role. This exposes only a boolean, never identity data.
create or replace function public.has_operational_photographer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where r.name = 'photographer'
  );
$$;

revoke all on function public.has_operational_photographer() from public;
grant execute on function public.has_operational_photographer() to anon, authenticated;

-- Review photos are optional at launch. The review row and any supplied image
-- rows are still written atomically, with a hard maximum of five images.
create or replace function public.create_review_with_images(
  target_booking uuid,
  target_rating int,
  target_comment text,
  target_images jsonb
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.reviews;
  image_count int;
begin
  if target_images is null or jsonb_typeof(target_images) <> 'array' then
    raise exception 'Invalid review';
  end if;

  image_count := jsonb_array_length(target_images);
  if target_rating not between 1 and 5
     or length(trim(target_comment)) not between 10 and 800
     or image_count not between 0 and 5 then
    raise exception 'Invalid review';
  end if;

  insert into public.reviews(booking_id, user_id, rating, comment, is_public)
  select id, auth.uid(), target_rating, target_comment, true
  from public.bookings
  where id = target_booking
    and status = 'completed'
    and user_id = auth.uid()
  returning * into result;

  if result.id is null then
    raise exception 'Booking is not reviewable';
  end if;

  if image_count > 0 then
    insert into public.review_images(
      review_id, user_id, image_url, storage_path,
      thumb_url, thumb_path, display_order
    )
    select
      result.id,
      auth.uid(),
      item.image_url,
      item.storage_path,
      nullif(item.thumb_url, ''),
      nullif(item.thumb_path, ''),
      item.display_order
    from jsonb_to_recordset(target_images) as item(
      image_url text,
      storage_path text,
      thumb_url text,
      thumb_path text,
      display_order int
    )
    where item.image_url is not null
      and item.storage_path is not null
      and item.display_order between 0 and 4;

    if (select count(*) from public.review_images where review_id = result.id) <> image_count then
      raise exception 'Invalid review media';
    end if;
  end if;

  return result;
end;
$$;

revoke all on function public.create_review_with_images(uuid, int, text, jsonb) from public;
grant execute on function public.create_review_with_images(uuid, int, text, jsonb) to authenticated;

commit;
