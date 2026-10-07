-- Phase 1 query optimization. Apply manually after reviewing in Supabase.

create index if not exists portfolio_images_album_order_idx
  on public.portfolio_images(album_id, display_order);

create index if not exists reviews_public_featured_created_idx
  on public.reviews(is_featured desc, created_at desc)
  where is_public = true;

create index if not exists bookings_user_status_created_idx
  on public.bookings(user_id, status, created_at desc);

create index if not exists bookings_photographer_created_idx
  on public.bookings(photographer_id, created_at desc);

create index if not exists bookings_status_shoot_date_idx
  on public.bookings(status, shoot_date desc);

create or replace function public.get_current_user_context()
returns table(
  id uuid,
  email text,
  full_name text,
  phone text,
  roles public.app_role[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profile.id,
    profile.email,
    profile.full_name,
    profile.phone,
    coalesce(
      array_agg(distinct role.name) filter (where role.name is not null),
      array['user'::public.app_role]
    )::public.app_role[]
  from public.profiles profile
  left join public.user_roles membership on membership.user_id = profile.id
  left join public.roles role on role.id = membership.role_id
  where profile.id = auth.uid()
  group by profile.id, profile.email, profile.full_name, profile.phone;
$$;

revoke all on function public.get_current_user_context() from public;
grant execute on function public.get_current_user_context() to authenticated;

create or replace function public.get_admin_booking_revenue_summary()
returns table(
  total_active numeric,
  realized numeric,
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
    coalesce(sum(booking.total_price) filter (where booking.status not in ('cancelled', 'completed')), 0),
    count(*) filter (where booking.status not in ('cancelled', 'completed'))
  from public.bookings booking;
end;
$$;

revoke all on function public.get_admin_booking_revenue_summary() from public;
grant execute on function public.get_admin_booking_revenue_summary() to authenticated;
