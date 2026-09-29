begin;
insert into public.portfolio_albums(id,category_id,title,slug,location_text,cover_image,is_featured,is_public,display_order) values
('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Lời Hẹn Bên Biển','loi-hen-ben-bien','Vũng Tàu','https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=82',true,true,10),
('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','Nàng Thơ Mùa Hạ','nang-tho-mua-ha','Studio S. Đặng','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=82',true,true,20),
('40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Bản Lĩnh Doanh Nhân','ban-linh-doanh-nhan','TP.HCM','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=82',true,true,30),
('40000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','Nhà Là Nơi Để Về','nha-la-noi-de-ve','Thảo Điền','https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=82',false,true,40),
('40000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000006','Ngày Chung Đôi','ngay-chung-doi','Sài Gòn','https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=82',false,true,50),
('40000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000005','Đêm Đáng Nhớ','dem-dang-nho','Quận 1, TP.HCM','https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=82',false,true,60)
on conflict(slug) do update set title=excluded.title,location_text=excluded.location_text,cover_image=excluded.cover_image,is_public=excluded.is_public,display_order=excluded.display_order;

insert into public.portfolio_images(id,album_id,image_url,alt_text,display_order) values
('41000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=84','Cặp đôi trong bộ ảnh cưới bên biển',10),
('41000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=84','Khoảnh khắc lễ cưới tự nhiên',20),
('41000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=84','Chân dung nàng thơ',10),
('41000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=84','Chân dung doanh nhân',10),
('41000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=84','Gia đình bên nhau',10),
('41000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=84','Cặp đôi giữa thành phố',10),
('41000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=84','Không gian sự kiện',10)
on conflict(id) do update set image_url=excluded.image_url,alt_text=excluded.alt_text,display_order=excluded.display_order;
commit;
