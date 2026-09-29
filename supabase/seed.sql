begin;

insert into public.site_settings(id,website_name,photographer_name,logo_url,phone,email,default_deposit,seo_title,seo_description)
values('00000000-0000-0000-0000-000000000001','Chọn Photo Sài Gòn','S. Đặng','/chon-photo-saigon-logo-trimmed.jpg','','',0,'Chọn Photo Sài Gòn | Đặt lịch chụp ảnh','Photography cá nhân, cưới, gia đình và sự kiện tại TP.HCM.') on conflict(id) do update set website_name=excluded.website_name,logo_url=excluded.logo_url,default_deposit=0;

insert into public.homepage_sections(section_key,title,subtitle,content,image_url,is_visible,display_order) values
('hero','Bắt trọn khoảnh khắc, định hình thần thái độc bản.','Nhiếp ảnh cá nhân · S. Đặng','{"highlight":"độc bản.","description":"Tôi trực tiếp đồng hành từ ý tưởng, ánh sáng, hướng dẫn tạo dáng đến hậu kỳ để mỗi bộ ảnh thật sự mang câu chuyện của riêng bạn.","editorial_label":"Editorial story","editorial_title":"Cinematic & Moody Fine-Art","primary_cta":{"text":"Xem Gói Chụp","href":"#services"},"secondary_cta":{"text":"Xem Portfolio","href":"#portfolio"},"trust":["Giá minh bạch","Xem lịch trống trực tiếp","Đặt lịch online"]}','https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=84',true,10),
('services','Các Gói Dịch Vụ Của Tôi','Gói chụp','{"description":"Thông tin cô đọng, giá minh bạch để bạn dễ dàng so sánh và chọn đúng gói."}',null,true,20),
('portfolio','Những Khoảnh Khắc Tôi Đã Ghi Lại','Portfolio','{"description":"Khám phá những bộ ảnh và câu chuyện tôi đã thực hiện."}',null,true,30),
('calendar','Lịch Chụp Còn Trống','Lịch chụp','{"description":"Kiểm tra lịch và chọn ngày phù hợp cho buổi chụp của bạn."}',null,true,40),
('locations','Địa Điểm Tôi Nhận Chụp','Địa điểm','{"description":"Từ studio chủ động ánh sáng đến ngoại cảnh giàu cảm xúc, tôi sẽ cùng bạn chọn nơi phù hợp nhất với câu chuyện."}',null,true,50),
('about','Không Qua Trung Gian, Tôi Trực Tiếp Bắt Trọn Thần Thái Của Bạn','Về tôi','{"description":"Từ tư vấn ý tưởng, thực hiện buổi chụp đến hậu kỳ, toàn bộ hành trình đều do tôi trực tiếp đồng hành để giữ trọn tinh thần và cảm xúc của bạn.","highlights":["Trực tiếp trao đổi","Hướng dẫn pose","Hậu kỳ bởi chính tôi"]}','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=84',true,60),
('reviews','Khách Hàng Nói Gì Về Trải Nghiệm Chụp?','Trải nghiệm thật','{"description":"Những chia sẻ thật từ những khách hàng đã đồng hành cùng tôi trong các buổi chụp."}',null,true,70),
('booking_process','Đặt Lịch Chỉ Với 5 Bước','Quy trình','{"steps":[{"title":"Chọn Gói"},{"title":"Chọn Ngày & Giờ"},{"title":"Chọn Địa Điểm"},{"title":"Xác Nhận Lịch"},{"title":"Thanh Toán Tại Nơi Chụp"}]}',null,true,80),
('faq','Câu Hỏi Thường Gặp','FAQ','{}',null,true,90),
('final_cta','Sẵn sàng tạo nên bộ ảnh của riêng bạn?',null,'{"description":"Chọn gói phù hợp, kiểm tra lịch trống và đặt lịch chụp chỉ trong vài phút.","button_text":"Đặt Lịch Ngay","button_href":"#services"}',null,true,100),
('footer','Chọn Photo Sài Gòn',null,'{"description":"Cinematic & Editorial Photography","copyright":"© 2026 Chọn Photo Sài Gòn"}',null,true,110)
on conflict(section_key) do update set title=excluded.title,subtitle=excluded.subtitle,content=excluded.content,image_url=excluded.image_url;

insert into public.categories(id,name,slug,description,display_order) values
('10000000-0000-0000-0000-000000000001','Ảnh Cưới & Pre-Wedding','wedding','Ảnh cưới và pre-wedding',10),
('10000000-0000-0000-0000-000000000002','Chân Dung','portrait','Chân dung cá nhân và doanh nhân',20),
('10000000-0000-0000-0000-000000000003','Concept Nghệ Thuật','concept','Concept nghệ thuật',30),
('10000000-0000-0000-0000-000000000004','Gia Đình & Bé','family','Gia đình, mẹ bầu và bé',40),
('10000000-0000-0000-0000-000000000005','Sự Kiện','event','Sự kiện và kỷ niệm',50),
('10000000-0000-0000-0000-000000000006','Couple','couple','Ảnh cặp đôi',60)
on conflict(slug) do update set name=excluded.name,description=excluded.description;

insert into public.services(id,category_id,name,slug,short_description,description,price,deposit_amount,duration_minutes,cover_image,features,is_featured,is_active,display_order) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Chụp Ảnh Cưới & Pre-Wedding Nghệ Thuật','wedding-pre-wedding','Trọn gói ảnh cưới cao cấp','Trọn gói chụp ảnh cưới cao cấp với phong cách Cinematic lãng mạn.',8900000,0,360,'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80','["Trang phục cao cấp","Makeup theo concept","Photobook 30 trang","File gốc và ảnh chỉnh"]',true,true,10),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Profile Doanh Nhân & Chân Dung Nghệ Thuật','business-portrait','Chân dung chuyên nghiệp','Định hình thương hiệu cá nhân với ánh sáng Studio.',1800000,0,90,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80','["2 tone Studio","Hỗ trợ makeup","Hướng dẫn tạo dáng","10 ảnh chỉnh"]',false,true,20),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','Concept Nàng Thơ & Vintage Cinematic','vintage-concept','Concept giàu cảm xúc','Concept hoa, ánh sáng nghệ thuật và gam màu phim.',2500000,0,150,'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=80','["Setup bối cảnh","Stylist hỗ trợ","15 ảnh chỉnh","Video highlight"]',true,true,30),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','Kỷ Niệm Gia Đình & Mẹ Bầu / Bé Yêu','family-memories','Khoảnh khắc gia đình tự nhiên','Lưu giữ khoảnh khắc sum vầy ấm cúng.',3200000,0,120,'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80','["Tối đa 6 thành viên","Không giới hạn shoot","Khung ảnh gỗ","25 ảnh chỉnh"]',false,true,40),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005','Sự Kiện, Sinh Nhật & Kỷ Yếu','event-celebration','Ghi trọn sự kiện','Ghi lại những diễn biến và khoảnh khắc quan trọng.',3500000,0,180,'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80','["01 nhiếp ảnh gia","Giao ảnh nhanh","Hơn 100 ảnh chỉnh","Lưu trữ online"]',false,true,50)
on conflict(slug) do update set name=excluded.name,price=excluded.price,cover_image=excluded.cover_image,features=excluded.features,deposit_amount=0,is_active=true;

update public.services set deposit_amount=0;

insert into public.locations(id,name,area,address,description,cover_image,travel_fee,is_active,display_order) values
('30000000-0000-0000-0000-000000000001','Studio','TP.HCM',null,'Không gian riêng, ánh sáng chủ động và đầy đủ phông nền.','https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80',0,true,10),
('30000000-0000-0000-0000-000000000002','Ngoại Cảnh Sài Gòn','TP.HCM',null,'Phố cổ, kiến trúc hiện đại hoặc không gian xanh theo concept.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',0,true,20),
('30000000-0000-0000-0000-000000000003','Vũng Tàu','Biển & ngoại cảnh',null,'Ánh hoàng hôn, bờ biển và những cung đường điện ảnh.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',500000,true,30),
('30000000-0000-0000-0000-000000000004','Các Tỉnh Lân Cận','Theo yêu cầu',null,'Linh hoạt di chuyển theo concept riêng.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',800000,true,40)
on conflict(id) do update set name=excluded.name,description=excluded.description,cover_image=excluded.cover_image,travel_fee=excluded.travel_fee;

insert into public.faqs(question,answer,display_order) values
('Cần đặt lịch trước bao lâu?','Bạn nên đặt trước 1–2 tuần; mùa cưới và cuối tuần nên đặt trước 3–4 tuần.',10),
('Thanh toán như thế nào?','Bạn không cần đặt cọc và sẽ thanh toán toàn bộ tại nơi chụp.',20),
('Tôi có thể đổi ngày chụp không?','Có. Bạn có thể yêu cầu đổi lịch trước tối thiểu 72 giờ, tùy lịch trống.',30),
('Bao lâu tôi nhận được ảnh?','Ảnh hoàn thiện được gửi trong 5–10 ngày làm việc tùy gói.',40),
('Nếu trời mưa thì xử lý thế nào?','Có thể đổi lịch miễn phí một lần hoặc chuyển sang studio phù hợp.',50);

update public.faqs
set question='Thanh toán như thế nào?',
    answer='Bạn không cần đặt cọc và sẽ thanh toán toàn bộ tại nơi chụp.'
where question ilike '%cọc%';

commit;
