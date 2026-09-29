begin;

create or replace function public.normalize_vietnamese_mobile(input_phone text)
returns text
language plpgsql
immutable
strict
set search_path=public
as $$
declare
  digits text;
begin
  if btrim(input_phone) !~ '^\+?[0-9 .()\-]+$' then
    return null;
  end if;

  digits := regexp_replace(input_phone, '[^0-9]', '', 'g');
  if left(digits,2)='84' and length(digits)=11 then
    digits := '0'||substr(digits,3);
  end if;

  if digits !~ '^0(3|5|7|8|9)[0-9]{8}$' then
    return null;
  end if;
  return digits;
end $$;

revoke all on function public.normalize_vietnamese_mobile(text) from public;
grant execute on function public.normalize_vietnamese_mobile(text) to anon,authenticated,service_role;

-- Reject invalid phone metadata even if sign-up bypasses the application UI.
create or replace function public.validate_new_auth_user_phone()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  normalized_phone text;
begin
  normalized_phone := public.normalize_vietnamese_mobile(new.raw_user_meta_data->>'phone');
  if normalized_phone is null then
    raise exception using
      errcode='23514',
      message='A valid Vietnamese mobile phone is required';
  end if;

  new.raw_user_meta_data := jsonb_set(
    coalesce(new.raw_user_meta_data,'{}'::jsonb),
    '{phone}',
    to_jsonb(normalized_phone),
    true
  );
  return new;
end $$;

drop trigger if exists validate_auth_user_phone_before_insert on auth.users;
create trigger validate_auth_user_phone_before_insert
before insert on auth.users
for each row execute function public.validate_new_auth_user_phone();

create or replace function public.normalize_profile_phone()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.phone is not null then
    new.phone := public.normalize_vietnamese_mobile(new.phone);
    if new.phone is null then
      raise exception using errcode='23514',message='Invalid Vietnamese mobile phone';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists normalize_profile_phone_before_write on public.profiles;
create trigger normalize_profile_phone_before_write
before insert or update of phone on public.profiles
for each row execute function public.normalize_profile_phone();

alter table public.profiles drop constraint if exists profiles_phone_is_vietnamese_mobile;
alter table public.profiles add constraint profiles_phone_is_vietnamese_mobile
check(phone is null or public.normalize_vietnamese_mobile(phone) is not null) not valid;

create or replace function public.normalize_booking_phone()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  new.customer_phone := public.normalize_vietnamese_mobile(new.customer_phone);
  if new.customer_phone is null then
    raise exception using errcode='23514',message='Invalid Vietnamese mobile phone';
  end if;
  return new;
end $$;

drop trigger if exists normalize_booking_phone_before_write on public.bookings;
create trigger normalize_booking_phone_before_write
before insert or update of customer_phone on public.bookings
for each row execute function public.normalize_booking_phone();

-- Reset only booking/test transaction data. Accounts, roles, services,
-- portfolios and photographer assignments remain intact.
delete from public.reviews;
delete from public.payments;
delete from public.bookings;

do $$
begin
  if to_regclass('public.reviews_legacy') is not null then
    execute 'delete from public.reviews_legacy';
  end if;
  if to_regclass('public.bookings_legacy') is not null then
    execute 'delete from public.bookings_legacy';
  end if;
  if to_regclass('public.booking_photo') is not null then
    execute 'delete from public.booking_photo';
  end if;
end $$;

alter table public.bookings drop constraint if exists bookings_phone_is_vietnamese_mobile;
alter table public.bookings add constraint bookings_phone_is_vietnamese_mobile
check(public.normalize_vietnamese_mobile(customer_phone) is not null);

commit;
