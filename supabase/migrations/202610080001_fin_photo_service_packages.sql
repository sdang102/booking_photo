-- FIN PHOTO package catalog. The first three active rows are the three public packages.
alter table public.services add column if not exists outfit_count int;

-- Keep historical bookings while allowing a package to be hard-deleted.
alter table public.bookings drop constraint if exists bookings_service_id_fkey;
alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id) references public.services(id) on delete set null;

-- The existing database may contain different legacy slugs. Use display order,
-- which is also the order shown by the admin catalog, as the source of truth.
do $$
declare
  package record;
  package_id uuid;
  package_index int := 0;
begin
  for package in
    select * from (values
      (10, 'The Essential', 'essential', 'Một chút sang trọng trong những khoảnh khắc thường ngày.', 699000::numeric, 45, 1, 1, 8, false, '["45 phút chụp", "1 địa điểm", "8 ảnh chỉnh màu và retouch", "1 outfit", "Phù hợp chụp cafe, street style, OOTD cá nhân"]'::jsonb),
      (20, 'The Signature', 'signature', 'Câu chuyện cá nhân qua từng khung hình.', 1199000::numeric, 90, 2, 2, 18, true, '["90 phút chụp", "Tối đa 2 địa điểm gần nhau", "18 ảnh chỉnh màu và retouch", "2 outfits", "Phù hợp lookbook cá nhân, Instagram, lifestyle editorial"]'::jsonb),
      (30, 'The Editorial', 'editorial', 'Một bộ ảnh mang dấu ấn thời trang và điện ảnh.', 1899000::numeric, 150, 3, 3, 30, false, '["150 phút chụp", "Tối đa 3 địa điểm gần nhau", "30 ảnh chỉnh màu và retouch", "3 outfits", "Phù hợp xây dựng hình ảnh cá nhân, fashion editorial, luxury lifestyle"]'::jsonb)
    ) as p(display_order, name, slug, description, price, duration_minutes, location_count, outfit_count, edited_photo_count, is_featured, features)
    order by display_order
  loop
    package_index := package_index + 1;
    select id into package_id
    from public.services
    where is_active = true
    order by display_order, created_at, id
    offset package_index - 1 limit 1;

    if package_id is not null then
      -- Clear the old slug first so this is safe when the migration is re-run.
      update public.services set slug = 'legacy-' || package_id::text where id = package_id;
      update public.services set
        name = package.name,
        slug = package.slug,
        short_description = package.description,
        description = package.description,
        price = package.price,
        duration_minutes = package.duration_minutes,
        location_count = package.location_count,
        outfit_count = package.outfit_count,
        edited_photo_count = package.edited_photo_count,
        concept_count = package.location_count,
        features = package.features,
        is_featured = package.is_featured,
        is_active = true,
        display_order = package.display_order
      where id = package_id;
    end if;
  end loop;

  -- Only these three packages are public after the catalog migration.
  update public.services
  set is_active = false
  where id not in (
    select id from public.services where is_active = true order by display_order, created_at, id limit 3
  );
end $$;
