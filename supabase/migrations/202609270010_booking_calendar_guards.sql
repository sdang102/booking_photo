begin;

create or replace function public.validate_booking_schedule_window()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  local_now timestamp := now() at time zone 'Asia/Bangkok';
begin
  if new.shoot_date < local_now::date
     or (new.shoot_date=local_now::date and new.start_time<=local_now::time) then
    raise exception using errcode='23514',message='Cannot book a past date or time';
  end if;
  if new.start_time<'08:00'::time
     or new.end_time>'20:00'::time
     or new.end_time-new.start_time<interval '30 minutes' then
    raise exception using errcode='23514',message='Booking must be within working hours and at least 30 minutes';
  end if;
  return new;
end $$;

drop trigger if exists validate_booking_schedule_window_before_write on public.bookings;
create trigger validate_booking_schedule_window_before_write
before insert or update of shoot_date,start_time,end_time on public.bookings
for each row execute function public.validate_booking_schedule_window();

-- bookings_no_overlap already includes pending bookings. PostgreSQL's exclusion
-- constraint serializes competing inserts, so the first transaction keeps the
-- slot and every overlapping insert receives an exclusion violation.

commit;
