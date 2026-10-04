begin;

create or replace function public.prevent_availability_booking_conflict()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status in ('blocked','off') and exists(
    select 1
    from public.bookings booking
    where booking.shoot_date=new.date
      and booking.photographer_id is not distinct from new.photographer_id
      and booking.status in ('confirmed','checked_in','shooting','completed')
      and new.start_time<booking.end_time
      and booking.start_time<new.end_time
  ) then
    raise exception using errcode='P0001',message='Availability overlaps a confirmed booking';
  end if;
  return new;
end $$;

drop trigger if exists prevent_availability_booking_conflict_before_write on public.availability;
create trigger prevent_availability_booking_conflict_before_write
before insert or update of date,start_time,end_time,status,photographer_id on public.availability
for each row execute function public.prevent_availability_booking_conflict();

commit;
