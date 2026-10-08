begin;

-- Admin needs the Storage manifest before deleting hidden reviews. This policy
-- remains admin-only and does not change public or customer visibility.
drop policy if exists review_images_admin_select on public.review_images;
create policy review_images_admin_select
on public.review_images
for select
to authenticated
using (public.is_admin());

-- Aggregate revenue in PostgreSQL instead of downloading every booking into
-- the browser. All parameters are supplied explicitly by the application.
drop function if exists public.get_admin_booking_revenue_summary();
drop function if exists public.get_admin_booking_revenue_summary(public.booking_status, date, date);

create function public.get_admin_booking_revenue_summary(
  target_status public.booking_status,
  target_from date,
  target_to date
)
returns table(
  total_active numeric,
  realized numeric,
  expected numeric,
  at_venue numeric,
  active_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return query
  select
    coalesce(sum(booking.total_price) filter (where booking.status <> 'cancelled'), 0),
    coalesce(sum(booking.total_price) filter (where booking.status = 'completed'), 0),
    coalesce(sum(booking.total_price) filter (where booking.status = 'confirmed'), 0),
    coalesce(sum(booking.total_price) filter (where booking.status not in ('cancelled', 'completed')), 0),
    count(*) filter (where booking.status not in ('cancelled', 'completed'))
  from public.bookings booking
  where (target_status is null or booking.status = target_status)
    and (target_from is null or booking.shoot_date >= target_from)
    and (target_to is null or booking.shoot_date <= target_to);
end;
$$;

revoke all on function public.get_admin_booking_revenue_summary(public.booking_status, date, date) from public;
grant execute on function public.get_admin_booking_revenue_summary(public.booking_status, date, date) to authenticated;

commit;
