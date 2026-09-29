begin;

-- Admin and photographer are separate jobs. A user may explicitly own both
-- roles, but admin no longer inherits photographer permissions.
create or replace function public.is_photographer()
returns boolean language sql stable security definer set search_path=public as $$
  select public.has_role('photographer')
$$;

alter table public.bookings
  add column if not exists photographer_id uuid references public.profiles(id) on delete set null;
alter table public.availability
  add column if not exists photographer_id uuid references public.profiles(id) on delete cascade;
create index if not exists bookings_photographer_date_idx on public.bookings(photographer_id,shoot_date,start_time);
create index if not exists availability_photographer_date_idx on public.availability(photographer_id,date,start_time);

create or replace function public.first_photographer_id()
returns uuid language sql stable security definer set search_path=public as $$
  select ur.user_id
  from public.user_roles ur join public.roles r on r.id=ur.role_id
  where r.name='photographer'
  order by ur.created_at
  limit 1
$$;

update public.bookings set photographer_id=public.first_photographer_id() where photographer_id is null;
update public.availability set photographer_id=public.first_photographer_id() where photographer_id is null;

create or replace function public.assign_default_photographer()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.photographer_id is null then new.photographer_id=public.first_photographer_id(); end if;
  return new;
end $$;
drop trigger if exists assign_default_photographer_before_insert on public.bookings;
create trigger assign_default_photographer_before_insert before insert on public.bookings
for each row execute function public.assign_default_photographer();
drop trigger if exists assign_availability_owner_before_insert on public.availability;
create trigger assign_availability_owner_before_insert before insert on public.availability
for each row execute function public.assign_default_photographer();

-- Admin may read bookings/payments for revenue reporting, but cannot operate
-- appointments or photographer availability.
drop policy if exists "admin_all" on public.bookings;
drop policy if exists "admin_all" on public.payments;
drop policy if exists "admin_all" on public.availability;
create policy "admin_booking_report" on public.bookings for select to authenticated using(public.is_admin());
create policy "admin_payment_report" on public.payments for select to authenticated using(public.is_admin());

drop policy if exists "user_own_bookings" on public.bookings;
drop policy if exists "photographer_read_bookings" on public.bookings;
create policy "user_own_bookings" on public.bookings for select to authenticated
using(user_id=auth.uid());
create policy "photographer_assigned_bookings" on public.bookings for select to authenticated
using(public.is_photographer() and photographer_id=auth.uid());

drop policy if exists "photographer_read_payments" on public.payments;
create policy "photographer_assigned_payments" on public.payments for select to authenticated
using(public.is_photographer() and exists(
  select 1 from public.bookings b where b.id=booking_id and b.photographer_id=auth.uid()
));

drop policy if exists "photographer_availability" on public.availability;
create policy "photographer_own_availability" on public.availability for all to authenticated
using(public.is_photographer() and photographer_id=auth.uid())
with check(public.is_photographer() and photographer_id=auth.uid());

drop policy if exists "photographer_assigned_reviews" on public.reviews;
create policy "photographer_assigned_reviews" on public.reviews for select to authenticated
using(public.is_photographer() and exists(
  select 1 from public.bookings b where b.id=booking_id and b.photographer_id=auth.uid()
));

create or replace function public.photographer_advance_booking(target_id uuid,new_status public.booking_status,note text default null)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare current_booking public.bookings;
begin
  if not public.is_photographer() then raise exception 'Forbidden'; end if;
  select * into current_booking from public.bookings where id=target_id and photographer_id=auth.uid() for update;
  if not found then raise exception 'Booking not found'; end if;
  if not (
    (current_booking.status='pending' and new_status in ('confirmed','cancelled')) or
    (current_booking.status='confirmed' and new_status in ('checked_in','cancelled')) or
    (current_booking.status='checked_in' and new_status='shooting') or
    (current_booking.status='shooting' and new_status='completed')
  ) then raise exception 'Invalid status transition'; end if;
  update public.bookings set status=new_status,photographer_note=coalesce(note,photographer_note),updated_at=now()
  where id=target_id returning * into current_booking;
  return current_booking;
end $$;

create or replace function public.update_photographer_note(p_booking_id uuid,p_note text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.is_photographer() then raise exception 'Forbidden'; end if;
  update public.bookings set photographer_note=nullif(trim(p_note),'')
  where id=p_booking_id and photographer_id=auth.uid();
  return found;
end $$;

-- Public visitors only receive anonymous schedule fields, never customer data.
create or replace function public.get_public_booking_schedule()
returns table(id uuid,booking_date date,booking_time text,service_title text,status public.booking_status,location_type text)
language sql stable security definer set search_path=public as $$
  select b.id,b.shoot_date,to_char(b.start_time,'HH24:MI')||' - '||to_char(b.end_time,'HH24:MI'),
         b.service_name_snapshot,b.status,'studio'::text
  from public.bookings b
  where b.status<>'cancelled'
  order by b.shoot_date,b.start_time
$$;
revoke all on function public.get_public_booking_schedule() from public;
grant execute on function public.get_public_booking_schedule() to anon,authenticated;

commit;
