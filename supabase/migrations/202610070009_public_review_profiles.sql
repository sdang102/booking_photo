begin;

create or replace function public.get_public_review_profiles(target_ids uuid[])
returns table(
  review_id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  service_title text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    review.id as review_id,
    review.user_id,
    coalesce(
      nullif(trim(profile.full_name), ''),
      nullif(trim(booking.customer_name), ''),
      'Khách hàng'
    ) as full_name,
    profile.avatar_url,
    booking.service_name_snapshot as service_title
  from public.reviews as review
  left join public.profiles as profile on profile.id = review.user_id
  left join public.bookings as booking on booking.id = review.booking_id
  where review.id = any(coalesce(target_ids, '{}'::uuid[]))
    and review.is_public = true;
$$;

revoke all on function public.get_public_review_profiles(uuid[]) from public;
grant execute on function public.get_public_review_profiles(uuid[]) to anon, authenticated;

commit;
