-- CHỈ ĐỌC, an toàn để chạy
-- Audit FIN PHOTO v2. Mỗi statement độc lập; nếu một statement báo thiếu bảng/cột,
-- giữ nguyên lỗi đó để đối chiếu migration drift. Không xuất email đầy đủ.

-- 1) Exact row count cho mọi bảng canonical public + auth users.
SELECT * FROM (
  SELECT 'profiles' AS table_name, count(*)::bigint AS exact_rows FROM public.profiles
  UNION ALL SELECT 'roles', count(*) FROM public.roles
  UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles
  UNION ALL SELECT 'site_settings', count(*) FROM public.site_settings
  UNION ALL SELECT 'homepage_sections', count(*) FROM public.homepage_sections
  UNION ALL SELECT 'categories', count(*) FROM public.categories
  UNION ALL SELECT 'services', count(*) FROM public.services
  UNION ALL SELECT 'service_addons', count(*) FROM public.service_addons
  UNION ALL SELECT 'locations', count(*) FROM public.locations
  UNION ALL SELECT 'portfolio_albums', count(*) FROM public.portfolio_albums
  UNION ALL SELECT 'portfolio_images', count(*) FROM public.portfolio_images
  UNION ALL SELECT 'availability', count(*) FROM public.availability
  UNION ALL SELECT 'bookings', count(*) FROM public.bookings
  UNION ALL SELECT 'payments', count(*) FROM public.payments
  UNION ALL SELECT 'reviews', count(*) FROM public.reviews
  UNION ALL SELECT 'review_images', count(*) FROM public.review_images
  UNION ALL SELECT 'review_likes', count(*) FROM public.review_likes
  UNION ALL SELECT 'faqs', count(*) FROM public.faqs
  UNION ALL SELECT 'media', count(*) FROM public.media
  UNION ALL SELECT 'auth.users', count(*) FROM auth.users
) AS counts
ORDER BY table_name;

-- 2) Exact row count động cho MỌI bảng public đang tồn tại, gồm legacy/drift.
-- query_to_xml chỉ thực thi SELECT count(*); format(%I) quote an toàn schema/table identifier.
SELECT t.table_schema, t.table_name,
  ((xpath('/row/exact_rows/text()', query_to_xml(
    format('SELECT count(*) AS exact_rows FROM %I.%I', t.table_schema, t.table_name),
    false, true, ''
  )))[1]::text)::bigint AS exact_rows
FROM information_schema.tables AS t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 2a) Mọi bảng public thật sự đang tồn tại, gồm legacy ngoài danh sách canonical.
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3) User count theo role; NO_ROLE giúp phát hiện account/profile/membership lệch.
SELECT coalesce(r.name::text, 'NO_ROLE') AS role, count(DISTINCT u.id)::bigint AS user_count
FROM auth.users AS u
LEFT JOIN public.user_roles AS ur ON ur.user_id = u.id
LEFT JOIN public.roles AS r ON r.id = ur.role_id
GROUP BY coalesce(r.name::text, 'NO_ROLE')
ORDER BY role;

-- 4) Thống kê NULL/rỗng/distinct cho MỌI cột canonical.
-- empty_or_null gồm SQL NULL, chuỗi rỗng/whitespace, JSON [] và {}.
WITH all_rows(table_name, row_data) AS (
  SELECT 'profiles', to_jsonb(t) FROM public.profiles t
  UNION ALL SELECT 'roles', to_jsonb(t) FROM public.roles t
  UNION ALL SELECT 'user_roles', to_jsonb(t) FROM public.user_roles t
  UNION ALL SELECT 'site_settings', to_jsonb(t) FROM public.site_settings t
  UNION ALL SELECT 'homepage_sections', to_jsonb(t) FROM public.homepage_sections t
  UNION ALL SELECT 'categories', to_jsonb(t) FROM public.categories t
  UNION ALL SELECT 'services', to_jsonb(t) FROM public.services t
  UNION ALL SELECT 'service_addons', to_jsonb(t) FROM public.service_addons t
  UNION ALL SELECT 'locations', to_jsonb(t) FROM public.locations t
  UNION ALL SELECT 'portfolio_albums', to_jsonb(t) FROM public.portfolio_albums t
  UNION ALL SELECT 'portfolio_images', to_jsonb(t) FROM public.portfolio_images t
  UNION ALL SELECT 'availability', to_jsonb(t) FROM public.availability t
  UNION ALL SELECT 'bookings', to_jsonb(t) FROM public.bookings t
  UNION ALL SELECT 'payments', to_jsonb(t) FROM public.payments t
  UNION ALL SELECT 'reviews', to_jsonb(t) FROM public.reviews t
  UNION ALL SELECT 'review_images', to_jsonb(t) FROM public.review_images t
  UNION ALL SELECT 'review_likes', to_jsonb(t) FROM public.review_likes t
  UNION ALL SELECT 'faqs', to_jsonb(t) FROM public.faqs t
  UNION ALL SELECT 'media', to_jsonb(t) FROM public.media t
), expanded AS (
  SELECT a.table_name, e.key AS column_name, e.value
  FROM all_rows a
  CROSS JOIN LATERAL jsonb_each(a.row_data) e
), stats AS (
  SELECT table_name, column_name,
    count(*)::bigint AS row_count,
    count(*) FILTER (WHERE value = 'null'::jsonb)::bigint AS null_count,
    count(*) FILTER (WHERE value = 'null'::jsonb
      OR (jsonb_typeof(value) = 'string' AND btrim(value #>> '{}') = '')
      OR value = '[]'::jsonb OR value = '{}'::jsonb)::bigint AS empty_or_null_count,
    count(DISTINCT value) FILTER (WHERE value <> 'null'::jsonb)::bigint AS distinct_non_null
  FROM expanded
  GROUP BY table_name, column_name
)
SELECT c.table_name, c.ordinal_position, c.column_name, c.data_type, c.is_nullable,
  coalesce(s.row_count, 0) AS row_count,
  coalesce(s.null_count, 0) AS null_count,
  coalesce(s.empty_or_null_count, 0) AS empty_or_null_count,
  coalesce(s.distinct_non_null, 0) AS distinct_non_null
FROM information_schema.columns c
LEFT JOIN stats s ON s.table_name = c.table_name AND s.column_name = c.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 5) Kích thước table/index/toast tổng hợp chính xác tại thời điểm chạy.
SELECT c.relname AS table_name,
  pg_size_pretty(pg_relation_size(c.oid)) AS table_heap,
  pg_size_pretty(pg_indexes_size(c.oid)) AS all_indexes,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_with_toast_indexes,
  pg_total_relation_size(c.oid) AS total_bytes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
ORDER BY total_bytes DESC, table_name;

SELECT schemaname, relname AS tablename, indexrelname AS indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  pg_relation_size(indexrelid) AS index_bytes,
  idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY index_bytes DESC, relname, indexrelname;

-- 6) Độ dài image/text URL để tìm Base64 lớn còn sót.
WITH image_values AS (
  SELECT 'profiles.avatar_url' AS source, avatar_url AS value FROM public.profiles
  UNION ALL SELECT 'site_settings.logo_url', logo_url FROM public.site_settings
  UNION ALL SELECT 'site_settings.favicon_url', favicon_url FROM public.site_settings
  UNION ALL SELECT 'site_settings.og_image_url', og_image_url FROM public.site_settings
  UNION ALL SELECT 'homepage_sections.image_url', image_url FROM public.homepage_sections
  UNION ALL SELECT 'services.cover_image', cover_image FROM public.services
  UNION ALL SELECT 'locations.cover_image', cover_image FROM public.locations
  UNION ALL SELECT 'portfolio_albums.cover_image', cover_image FROM public.portfolio_albums
  UNION ALL SELECT 'portfolio_albums.cover_image_mobile', cover_image_mobile FROM public.portfolio_albums
  UNION ALL SELECT 'portfolio_images.image_url', image_url FROM public.portfolio_images
  UNION ALL SELECT 'portfolio_images.thumb_url', thumb_url FROM public.portfolio_images
  UNION ALL SELECT 'review_images.image_url', image_url FROM public.review_images
  UNION ALL SELECT 'review_images.thumb_url', thumb_url FROM public.review_images
  UNION ALL SELECT 'media.public_url', public_url FROM public.media
)
SELECT source, count(*) FILTER (WHERE value IS NOT NULL)::bigint AS non_null_rows,
  round(avg(octet_length(value)) FILTER (WHERE value IS NOT NULL), 1) AS avg_bytes,
  max(octet_length(value)) AS max_bytes,
  count(*) FILTER (WHERE value ~* '^data:image/[^;]+;base64,')::bigint AS base64_rows,
  count(*) FILTER (WHERE value ~* '^https?://' AND value NOT ILIKE '%/storage/v1/object/%')::bigint AS external_url_rows,
  count(*) FILTER (WHERE value ILIKE '%/storage/v1/object/%')::bigint AS storage_url_rows
FROM image_values
GROUP BY source
ORDER BY max_bytes DESC NULLS LAST, source;

-- 7) Ba bảng được yêu cầu: Base64/external URL theo row.
SELECT 'portfolio_images' AS table_name,
  count(*)::bigint AS total_rows,
  count(*) FILTER (WHERE image_url ~* '^data:image/[^;]+;base64,')::bigint AS base64_rows,
  count(*) FILTER (WHERE image_url ~* '^https?://' AND image_url NOT ILIKE '%/storage/v1/object/%')::bigint AS external_url_rows
FROM public.portfolio_images
UNION ALL
SELECT 'media', count(*),
  count(*) FILTER (WHERE public_url ~* '^data:image/[^;]+;base64,'),
  count(*) FILTER (WHERE public_url ~* '^https?://' AND public_url NOT ILIKE '%/storage/v1/object/%')
FROM public.media
UNION ALL
SELECT 'portfolio_albums', count(*),
  count(*) FILTER (WHERE cover_image ~* '^data:image/[^;]+;base64,' OR cover_image_mobile ~* '^data:image/[^;]+;base64,'),
  count(*) FILTER (WHERE (cover_image ~* '^https?://' AND cover_image NOT ILIKE '%/storage/v1/object/%')
    OR (cover_image_mobile ~* '^https?://' AND cover_image_mobile NOT ILIKE '%/storage/v1/object/%'))
FROM public.portfolio_albums;

-- 8) Storage object count/dung lượng theo bucket.
SELECT b.id AS bucket_id, b.public, b.file_size_limit, b.allowed_mime_types,
  count(o.id)::bigint AS object_count,
  coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes,
  pg_size_pretty(coalesce(sum((o.metadata->>'size')::bigint), 0)) AS total_size
FROM storage.buckets b
LEFT JOIN storage.objects o ON o.bucket_id = b.id
GROUP BY b.id, b.public, b.file_size_limit, b.allowed_mime_types
ORDER BY b.id;

-- 9) Object theo prefix đầu để hỗ trợ lập manifest wipe; không trả owner/email.
SELECT bucket_id, coalesce((storage.foldername(name))[1], '(root)') AS top_folder,
  count(*)::bigint AS object_count,
  coalesce(sum((metadata->>'size')::bigint), 0)::bigint AS total_bytes
FROM storage.objects
GROUP BY bucket_id, coalesce((storage.foldername(name))[1], '(root)')
ORDER BY bucket_id, top_folder;

-- 10) RLS policies đang có thật.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public','storage')
ORDER BY schemaname, tablename, policyname;

-- 11) Triggers user-defined đang có thật.
SELECT event_object_schema, event_object_table, trigger_name,
  event_manipulation, action_timing, action_orientation, action_statement
FROM information_schema.triggers
WHERE trigger_schema IN ('public','auth','storage')
ORDER BY event_object_schema, event_object_table, trigger_name, event_manipulation;

-- 12) Functions/RPC thật: signature, security definer, volatility, ACL.
SELECT n.nspname AS schema_name, p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS result_type,
  p.prosecdef AS security_definer,
  p.provolatile AS volatility,
  p.proacl AS privileges,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname, identity_arguments;

-- 13) Index definitions + constraints/FK/delete action/exclusion.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname IN ('public','storage')
ORDER BY schemaname, tablename, indexname;

SELECT ns.nspname AS schema_name, rel.relname AS table_name, con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname IN ('public','auth','storage')
ORDER BY schema_name, table_name, constraint_name;

-- 14) Enum/extensions/views thực tế.
SELECT n.nspname AS schema_name, t.typname AS enum_name,
  e.enumsortorder, e.enumlabel
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
ORDER BY enum_name, e.enumsortorder;

SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

SELECT table_schema, table_name, view_definition
FROM information_schema.views
WHERE table_schema IN ('public','auth','storage')
ORDER BY table_schema, table_name;

-- 15) Migration đã áp dụng. Nếu schema/table này không tồn tại, gửi lại lỗi đó.
SELECT *
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 16) Tài khoản đã ẩn danh: hash 12 ký tự, timestamps, confirmation, roles.
-- Không trả email, phone, metadata hoặc UUID đầy đủ.
SELECT left(encode(digest(lower(coalesce(u.email,'')), 'sha256'), 'hex'), 12) AS account_hash,
  u.created_at,
  (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
  coalesce(array_agg(DISTINCT r.name::text) FILTER (WHERE r.name IS NOT NULL), ARRAY['NO_ROLE']) AS roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
GROUP BY u.id, account_hash, u.created_at, u.email_confirmed_at
ORDER BY u.created_at, account_hash;

-- 17) Orphan/required-data health checks, chỉ count.
SELECT
  (SELECT count(*) FROM public.roles) AS role_rows,
  (SELECT count(*) FROM public.services WHERE is_active) AS active_services,
  (SELECT count(*) FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='admin') AS admin_memberships,
  (SELECT count(*) FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='photographer') AS photographer_memberships,
  (SELECT count(*) FROM public.bookings WHERE photographer_id IS NULL AND status <> 'cancelled') AS active_unassigned_bookings,
  (SELECT count(*) FROM public.bookings b LEFT JOIN auth.users u ON u.id=b.user_id WHERE b.user_id IS NOT NULL AND u.id IS NULL) AS broken_booking_users,
  (SELECT count(*) FROM public.review_images ri LEFT JOIN public.reviews r ON r.id=ri.review_id WHERE r.id IS NULL) AS orphan_review_image_rows;

-- Câu hỏi cần chủ dự án trả lời:
-- 1) Cho phép gửi kết quả statement nào (đặc biệt function definitions) để audit drift?
-- 2) Có thể cung cấp thêm EXPLAIN (ANALYZE, BUFFERS) cho revenue/review/portfolio queries không?
-- 3) Account hash nào thuộc allowlist admin/photographer thật, hash nào là test cần xóa?
