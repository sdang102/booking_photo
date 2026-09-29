begin;

-- Bookings already keep service name and price snapshots, so deleting a CMS
-- service must preserve historical bookings instead of blocking the delete.
alter table public.bookings drop constraint if exists bookings_service_id_fkey;
alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key(service_id) references public.services(id) on delete set null;

-- Categories are CMS taxonomy. Deleting one only detaches its services and
-- albums; it must not delete the actual content records.
alter table public.services drop constraint if exists services_category_id_fkey;
alter table public.services
  add constraint services_category_id_fkey
  foreign key(category_id) references public.categories(id) on delete set null;

alter table public.portfolio_albums drop constraint if exists portfolio_albums_category_id_fkey;
alter table public.portfolio_albums
  add constraint portfolio_albums_category_id_fkey
  foreign key(category_id) references public.categories(id) on delete set null;

commit;
