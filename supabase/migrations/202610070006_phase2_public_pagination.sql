begin;

-- Public calendar data is bounded to the booking horizon used by the UI.
create or replace function public.get_public_booking_schedule()
returns table(id uuid,booking_date date,booking_time text,service_title text,status public.booking_status,location_type text)
language sql stable security definer set search_path=public as $$
  select b.id,b.shoot_date,
    to_char(b.start_time,'HH24:MI')||' - '||to_char(b.end_time,'HH24:MI'),
    b.service_name_snapshot,b.status,'outdoor'::text
  from public.bookings b
  where b.status <> 'cancelled'
    and b.shoot_date between current_date and current_date + 90
  order by b.shoot_date,b.start_time,b.id
$$;
revoke all on function public.get_public_booking_schedule() from public;
grant execute on function public.get_public_booking_schedule() to anon,authenticated;

create or replace function public.get_public_availability()
returns table(id uuid,date date,start_time time,end_time time,reason text,created_at timestamptz)
language sql stable security definer set search_path=public as $$
  select a.id,a.date,a.start_time,a.end_time,a.reason,a.created_at
  from public.availability a
  where a.status in ('blocked','off')
    and a.date between current_date and current_date + 90
  order by a.date,a.start_time,a.id
$$;
revoke all on function public.get_public_availability() from public;
grant execute on function public.get_public_availability() to anon,authenticated;

-- Lightweight client preflight. The database trigger and exclusion/daily-limit
-- constraints remain the final source of truth for a booking write.
create or replace function public.check_booking_slot(
  target_date date,
  target_start_time time,
  target_photographer_id uuid default null
)
returns boolean
language plpgsql stable security definer set search_path=public as $$
declare
  target_end_time time := target_start_time + interval '2 hours';
begin
  if target_date < current_date or target_date > current_date + 90 then
    return false;
  end if;

  if exists (
    select 1 from public.availability a
    where a.date = target_date
      and (target_photographer_id is null or a.photographer_id is null or a.photographer_id = target_photographer_id)
      and a.status in ('blocked','off')
      and target_start_time < a.end_time
      and a.start_time < target_end_time
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.bookings b
    where b.shoot_date = target_date
      and (target_photographer_id is null or b.photographer_id = target_photographer_id)
      and b.status <> 'cancelled'
      and target_start_time < b.end_time
      and b.start_time < target_end_time
  ) then
    return false;
  end if;

  return true;
end;
$$;
revoke all on function public.check_booking_slot(date,time,uuid) from public;
grant execute on function public.check_booking_slot(date,time,uuid) to anon,authenticated;

-- Aggregate rating summary for the public review header and distribution bars.
create or replace function public.get_public_review_summary()
returns table(average_rating numeric,total_reviews bigint,rating integer,rating_count bigint)
language sql stable security definer set search_path=public as $$
  with visible as (
    select r.rating
    from public.reviews r
    where r.is_public
  ), totals as (
    select coalesce(avg(rating), 0)::numeric as average_rating, count(*)::bigint as total_reviews
    from visible
  ), distribution as (
    select rating, count(*)::bigint as rating_count
    from visible
    group by rating
  )
  select totals.average_rating, totals.total_reviews, distribution.rating, distribution.rating_count
  from totals cross join distribution
  order by distribution.rating desc
$$;
revoke all on function public.get_public_review_summary() from public;
grant execute on function public.get_public_review_summary() to anon,authenticated;

commit;
