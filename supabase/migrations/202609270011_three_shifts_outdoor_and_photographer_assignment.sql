begin;

alter table public.bookings add column if not exists shoot_address text;
update public.bookings set shoot_address='Chưa cập nhật địa chỉ ngoại cảnh' where nullif(trim(shoot_address),'') is null;
alter table public.bookings alter column shoot_address set not null;
alter table public.bookings drop constraint if exists bookings_shoot_address_valid;
alter table public.bookings add constraint bookings_shoot_address_valid
check(length(trim(shoot_address)) between 5 and 300);

-- Prefer a dedicated photographer account. An admin who also owns the
-- photographer role is only the fallback when no dedicated account exists.
create or replace function public.first_photographer_id()
returns uuid language sql stable security definer set search_path=public as $$
  select ur.user_id
  from public.user_roles ur
  join public.roles photographer_role on photographer_role.id=ur.role_id and photographer_role.name='photographer'
  order by exists(
    select 1 from public.user_roles admin_membership
    join public.roles admin_role on admin_role.id=admin_membership.role_id
    where admin_membership.user_id=ur.user_id and admin_role.name='admin'
  ),ur.created_at
  limit 1
$$;

update public.bookings booking
set photographer_id=public.first_photographer_id()
where public.first_photographer_id() is not null
  and (
    booking.photographer_id is null
    or exists(
      select 1 from public.user_roles membership
      join public.roles role on role.id=membership.role_id
      where membership.user_id=booking.photographer_id and role.name='admin'
    )
  );

update public.availability block
set photographer_id=public.first_photographer_id()
where public.first_photographer_id() is not null
  and (
    block.photographer_id is null
    or exists(
      select 1 from public.user_roles membership
      join public.roles role on role.id=membership.role_id
      where membership.user_id=block.photographer_id and role.name='admin'
    )
  );

create or replace function public.enforce_booking_shift_and_daily_limit()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not (
    (new.start_time='08:30'::time and new.end_time='10:30'::time)
    or (new.start_time='13:30'::time and new.end_time='15:30'::time)
    or (new.start_time='18:00'::time and new.end_time='20:00'::time)
  ) then
    raise exception using errcode='23514',message='Booking must use the morning, afternoon, or evening shift';
  end if;

  if new.status<>'cancelled' then
    perform pg_advisory_xact_lock(hashtextextended(coalesce(new.photographer_id::text,'unassigned')||':'||new.shoot_date::text,0));
    if (
      select count(*)
      from public.bookings existing
      where existing.id<>new.id
        and existing.shoot_date=new.shoot_date
        and existing.photographer_id is not distinct from new.photographer_id
        and existing.status<>'cancelled'
    )>=2 then
      raise exception using errcode='P0001',message='This photographer already has two bookings on the selected date';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists enforce_booking_shift_and_daily_limit_before_write on public.bookings;
create trigger enforce_booking_shift_and_daily_limit_before_write
before insert or update of shoot_date,start_time,end_time,status,photographer_id on public.bookings
for each row execute function public.enforce_booking_shift_and_daily_limit();

create or replace function public.get_public_booking_schedule()
returns table(id uuid,booking_date date,booking_time text,service_title text,status public.booking_status,location_type text)
language sql stable security definer set search_path=public as $$
  select b.id,b.shoot_date,to_char(b.start_time,'HH24:MI')||' - '||to_char(b.end_time,'HH24:MI'),
         b.service_name_snapshot,b.status,'outdoor'::text
  from public.bookings b
  where b.status<>'cancelled'
  order by b.shoot_date,b.start_time
$$;
revoke all on function public.get_public_booking_schedule() from public;
grant execute on function public.get_public_booking_schedule() to anon,authenticated;

commit;
