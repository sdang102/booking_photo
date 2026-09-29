begin;

-- The remote legacy booking_photo table only contains (id bigint, created_at timestamptz).
-- It has no customer, service, schedule, or financial fields, so no truthful business
-- record can be reconstructed. Preserve it for audit instead of fabricating bookings.
comment on table public.booking_photo is
  'LEGACY: contains only id/created_at and cannot be mapped to canonical bookings. Retained for audit.';

commit;
