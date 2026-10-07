begin;

-- Keep the original image for the detail view and store a small WebP for review cards.
alter table public.review_images
  add column if not exists thumb_url text,
  add column if not exists thumb_path text;

create index if not exists review_images_review_order_id_idx
  on public.review_images(review_id, display_order, id);

-- Keep the visibility join correct for thumbnails if the bucket is made private later.
drop policy if exists "public_review_media_objects" on storage.objects;
create policy "public_review_media_objects" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'review-media'
    and exists (
      select 1
      from public.review_images image_row
      join public.reviews review_row on review_row.id = image_row.review_id
      where (image_row.storage_path = name or image_row.thumb_path = name)
        and review_row.is_public
    )
  );

commit;
