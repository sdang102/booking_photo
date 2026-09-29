begin;

-- The studio collects the full amount at the shoot. Keep the legacy columns
-- for compatibility, but make every deposit value permanently zero.
update public.site_settings set default_deposit=0 where default_deposit<>0;
alter table public.site_settings alter column default_deposit set default 0;

update public.services set deposit_amount=0 where deposit_amount<>0;
alter table public.services alter column deposit_amount set default 0;
alter table public.services drop constraint if exists services_deposit_disabled;
alter table public.services add constraint services_deposit_disabled check(deposit_amount=0);

update public.bookings set deposit_amount=0 where deposit_amount<>0;
update public.bookings set payment_status='unpaid' where payment_status='deposit_paid';
alter table public.bookings alter column deposit_amount set default 0;
alter table public.bookings drop constraint if exists bookings_deposit_disabled;
alter table public.bookings add constraint bookings_deposit_disabled check(deposit_amount=0);

update public.homepage_sections
set content='{"steps":[{"title":"Chọn Gói"},{"title":"Chọn Ngày & Giờ"},{"title":"Chọn Địa Điểm"},{"title":"Xác Nhận Lịch"},{"title":"Thanh Toán Tại Nơi Chụp"}]}'::jsonb,
    updated_at=now()
where section_key='booking_process';

update public.faqs
set question='Thanh toán như thế nào?',
    answer='Bạn không cần đặt cọc và sẽ thanh toán toàn bộ tại nơi chụp.',
    updated_at=now()
where question ilike '%cọc%';

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

-- Reviews submitted by customers appear on the public homepage immediately.
update public.reviews set is_public=true where not is_public;

create or replace function public.review_completed_booking(
  target_booking uuid,
  target_rating int,
  target_comment text
)
returns public.reviews
language plpgsql
security definer
set search_path=public
as $$
declare
  result public.reviews;
begin
  if target_rating not between 1 and 5
     or length(trim(target_comment)) not between 10 and 800 then
    raise exception 'Invalid review';
  end if;

  insert into public.reviews(booking_id,user_id,rating,comment,is_public)
  select id,auth.uid(),target_rating,target_comment,true
  from public.bookings
  where id=target_booking
    and status='completed'
    and user_id=auth.uid()
  returning * into result;

  if result.id is null then raise exception 'Booking is not reviewable'; end if;
  return result;
end $$;

grant execute on function public.review_completed_booking(uuid,int,text) to authenticated;

commit;
