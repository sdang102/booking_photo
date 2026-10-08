begin;

-- The remote legacy booking_photo table only contains (id bigint, created_at timestamptz).
-- It has no customer, service, schedule, or financial fields, so no truthful business
-- record can be reconstructed. Preserve it for audit instead of fabricating bookings.
do $$
begin
  if to_regclass('public.booking_photo') is not null then
    execute $comment$
      comment on table public.booking_photo is
        'LEGACY: contains only id/created_at and cannot be mapped to canonical bookings. Retained for audit.'
    $comment$;
  end if;
end $$;

commit;
