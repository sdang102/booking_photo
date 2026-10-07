import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const targets = [
  ['homepage_sections', 'image_url', 'site-assets', 'image_path'],
  ['services', 'cover_image', 'services', 'cover_image_path'],
  ['portfolio_albums', 'cover_image', 'portfolio', 'cover_image_path'],
  ['portfolio_albums', 'cover_image_mobile', 'portfolio', 'cover_image_mobile_path'],
  ['portfolio_images', 'image_url', 'portfolio', null],
  ['locations', 'cover_image', 'locations', 'cover_image_path'],
  ['site_settings', 'logo_url', 'site-assets', 'logo_path'],
  ['site_settings', 'favicon_url', 'site-assets', 'favicon_path'],
  ['site_settings', 'og_image_url', 'site-assets', 'og_image_path'],
  ['profiles', 'avatar_url', 'avatars', 'avatar_path'],
  ['media', 'public_url', 'site-assets', null],
];
const args = new Set(process.argv.slice(2));
const manifestArg = process.argv.find((value) => value.startsWith('--manifest='))?.split('=')[1];
const outputArg = process.argv.find((value) => value.startsWith('--output='))?.split('=')[1];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) fail('Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY. Không dùng anon key cho công cụ này.');
if (args.has('--apply') && !manifestArg) fail('Bước --apply bắt buộc có --manifest=đường-dẫn.');

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

if (!args.has('--upload') && !args.has('--apply')) {
  const rows = await collectRows();
  console.log(`Dry-run: tìm thấy ${rows.length} ảnh Base64, tổng dữ liệu khoảng ${formatBytes(rows.reduce((sum, row) => sum + row.bytes, 0))}.`);
  console.log('Không thay đổi database hoặc Storage. Dùng --upload để tạo manifest upload, sau đó --apply --manifest=... để cập nhật URL.');
  process.exit(0);
}

if (args.has('--upload')) {
  const rows = await collectRows();
  const manifest = [];
  for (const row of rows) {
    const result = await uploadRow(row);
    manifest.push(result);
    console.log(`Đã upload ${row.table}.${row.column} ${row.id}`);
  }
  const output = outputArg ?? path.join('artifacts', `base64-image-manifest-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Đã ghi manifest ${output}. Database vẫn giữ nguyên Base64.`);
  process.exit(0);
}

const manifest = JSON.parse(await fs.readFile(manifestArg, 'utf8'));
if (!Array.isArray(manifest) || !manifest.length) fail('Manifest rỗng hoặc không hợp lệ.');
const backupPath = outputArg ?? path.join('artifacts', `base64-image-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
const backup = [];
for (const item of manifest) {
  const { data, error } = await supabase.from(item.table).select(`id,${item.column}`).eq('id', item.id).maybeSingle();
  if (error) fail(`${item.table}.${item.column}: ${error.message}`);
  const originalValue = data?.[item.column];
  if (!isDataUrl(originalValue)) {
    console.warn(`Bỏ qua ${item.table}.${item.column} ${item.id}: dữ liệu hiện tại không còn là Base64.`);
    continue;
  }
  backup.push({ table: item.table, id: item.id, column: item.column, originalValue });
}
await fs.mkdir(path.dirname(backupPath), { recursive: true });
await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
const ready = new Set(backup.map((item) => `${item.table}:${item.id}:${item.column}`));
for (const item of manifest) {
  if (!ready.has(`${item.table}:${item.id}:${item.column}`)) continue;
  const patch = item.table === 'portfolio_images'
    ? { image_url: item.fullUrl, storage_path: item.fullPath, thumb_url: item.thumbUrl, thumb_path: item.thumbPath, width: item.width, height: item.height }
    : item.table === 'media'
      ? { public_url: item.fullUrl, bucket: item.bucket, storage_path: item.fullPath, size_bytes: item.sizeBytes }
      : { [item.column]: item.fullUrl, ...(item.pathColumn ? { [item.pathColumn]: item.fullPath } : {}) };
  const { error } = await supabase.from(item.table).update(patch).eq('id', item.id);
  if (error) fail(`${item.table}.${item.column} ${item.id}: ${error.message}`);
}
console.log(`Đã cập nhật ${manifest.length} dòng. Backup Base64: ${backupPath}`);
console.log('Script không xóa Base64 backup hoặc object Storage cũ. Chỉ xóa sau khi kiểm tra production thủ công.');

async function collectRows() {
  const rows = [];
  for (const [table, column, bucket, pathColumn] of targets) {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await supabase.from(table).select(`id,${column}`).range(offset, offset + 99);
      if (error) fail(`${table}.${column}: ${error.message}`);
      const batch = (data ?? []).filter((row) => isDataUrl(row[column])).map((row) => ({ table, column, bucket, pathColumn, id: row.id, value: row[column], bytes: Buffer.byteLength(row[column], 'utf8') }));
      rows.push(...batch);
      if ((data ?? []).length < 100) break;
    }
  }
  return rows;
}

async function uploadRow(row) {
  const input = Buffer.from(row.value.split(',')[1], 'base64');
  const full = await sharp(input).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
  const thumb = row.table === 'portfolio_images'
    ? await sharp(input).rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true })
    : null;
  const token = `${row.table}/${row.id}/${row.column}-${crypto.randomUUID()}`;
  const fullPath = `migrated/${token}.webp`;
  await put(row.bucket, fullPath, full.data);
  let thumbPath;
  if (thumb) {
    thumbPath = `migrated/${token}-thumb.webp`;
    await put(row.bucket, thumbPath, thumb.data);
  }
  return { table: row.table, id: row.id, column: row.column, pathColumn: row.pathColumn, bucket: row.bucket, fullPath, fullUrl: publicUrl(row.bucket, fullPath), thumbPath, thumbUrl: thumbPath ? publicUrl(row.bucket, thumbPath) : undefined, width: full.info.width, height: full.info.height, sizeBytes: full.data.byteLength };
}

async function put(bucket, storagePath, data) {
  const { error } = await supabase.storage.from(bucket).upload(storagePath, data, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
  if (error) fail(`Storage ${bucket}/${storagePath}: ${error.message}`);
}

function publicUrl(bucket, storagePath) { return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl; }
function isDataUrl(value) { return typeof value === 'string' && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value); }
function formatBytes(value) { return value > 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.round(value / 1024)} KB`; }
function fail(message) { console.error(`Lỗi: ${message}`); process.exit(1); }
