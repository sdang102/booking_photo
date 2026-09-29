begin;

create or replace function public.get_public_availability()
returns table(id uuid,date date,start_time time,end_time time,reason text,created_at timestamptz)
language sql stable security definer set search_path=public as $$
  select a.id,a.date,a.start_time,a.end_time,a.reason,a.created_at
  from public.availability a
  where a.status in ('blocked','off') and a.date>=current_date
  order by a.date,a.start_time
$$;
revoke all on function public.get_public_availability() from public;
grant execute on function public.get_public_availability() to anon,authenticated;

commit;
