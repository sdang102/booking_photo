alter table public.site_settings add column if not exists display_order integer not null default 0;

create or replace function public.update_photographer_note(p_booking_id uuid,p_note text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.is_photographer() then raise exception 'Forbidden'; end if;
 update public.bookings set photographer_note=nullif(trim(p_note),'') where id=p_booking_id;
 return found;
end $$;
revoke all on function public.update_photographer_note(uuid,text) from public;
grant execute on function public.update_photographer_note(uuid,text) to authenticated;
