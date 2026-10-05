-- CMS additions for service extras and deterministic portfolio layouts.
alter table public.portfolio_images add column if not exists width integer;
alter table public.portfolio_images add column if not exists height integer;

create table if not exists public.service_addons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  price_label text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_addons enable row level security;
drop policy if exists "admin_all" on public.service_addons;
create policy "admin_all" on public.service_addons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public_service_addons" on public.service_addons;
create policy "public_service_addons" on public.service_addons for select to anon, authenticated
  using (is_active);

drop trigger if exists set_service_addons_updated_at on public.service_addons;
create trigger set_service_addons_updated_at before update on public.service_addons
for each row execute function public.set_updated_at();

insert into public.service_addons(title, description, price, price_label, display_order)
select * from (values
  ('Thêm giờ sáng tác', 'Mở rộng thời gian chụp cho concept nhiều bối cảnh.', 800000::numeric, 'Từ 800.000đ / giờ', 10),
  ('Makeup & Hair Artist', 'Chuyên viên đồng hành và dặm chỉnh suốt buổi chụp.', 600000::numeric, 'Từ 600.000đ / layout', 20),
  ('Photobook mỹ thuật', 'In album cao cấp trên giấy fine-art bền màu.', 1200000::numeric, 'Từ 1.200.000đ', 30)
) as seed(title, description, price, price_label, display_order)
where not exists (select 1 from public.service_addons);

insert into public.homepage_sections(section_key, title, subtitle, image_url, content, is_visible, display_order)
values
  ('craft_01', 'Chân dung nghệ thuật', 'Ánh sáng có chủ đích, tôn lên khí chất và câu chuyện rất riêng của bạn.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=88', '{}', true, 31),
  ('craft_02', 'Couple & Pre-wedding', 'Những khoảnh khắc tự nhiên được kể lại bằng ngôn ngữ điện ảnh tinh tế.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=88', '{}', true, 32),
  ('craft_03', 'Lookbook & Editorial', 'Hình ảnh thời trang giàu cá tính, được xây dựng trọn vẹn từ concept đến hậu kỳ.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88', '{}', true, 33),
  ('craft_04', 'Gia đình & Kỷ niệm', 'Giữ lại sự gần gũi, ấm áp và những kết nối thật trong từng khung hình.', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=88', '{}', true, 34)
on conflict(section_key) do nothing;
