# Phase 2 image migration

The migration script is intentionally dry-run by default and never deletes old database values or Storage objects.

Before running it:

1. Apply `supabase/migrations/202610070002_storage_image_variants.sql` in a reviewed Supabase migration/deploy.
2. Back up the database and confirm the `site-assets`, `portfolio`, `services`, `locations`, and `avatars` public buckets and admin Storage policies exist.
3. Use a short-lived Supabase service-role key only on a trusted local machine. Never expose it to the browser or commit it.

Commands from the repository root (PowerShell):

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
node scripts/migrate-base64-images.mjs
node scripts/migrate-base64-images.mjs --upload --output=artifacts/base64-image-manifest.json
node scripts/migrate-base64-images.mjs --apply --manifest=artifacts/base64-image-manifest.json --output=artifacts/base64-image-backup.json
```

The first command only reports the number and approximate size of Base64 rows. `--upload` creates Storage objects and a manifest while leaving database values unchanged. `--apply` writes a JSON backup of every still-Base64 value before replacing it with Storage URLs. Verify public pages, admin previews, album thumbnails, and lightboxes before manually deleting any old Base64 backup or old Storage object.
