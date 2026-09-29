begin;

insert into public.homepage_sections(section_key,title,subtitle,content,image_url,is_visible,display_order)
select 'motion_settings','Chọn Photo Sài Gòn','Cinematic photography experience',
       '{"intro_enabled":true,"intro_duration":1450,"progress_enabled":true,"grain_enabled":true,"page_transition":true}'::jsonb,
       (select logo_url from public.site_settings order by created_at limit 1),true,1
where not exists(select 1 from public.homepage_sections where section_key='motion_settings');

update public.homepage_sections
set content=content||jsonb_build_object(
  'background_mode',coalesce(content->>'background_mode','cinematic'),
  'images',case when jsonb_typeof(content->'images')='array' then content->'images' else jsonb_build_array(image_url) end,
  'autoplay',coalesce((content->>'autoplay')::boolean,true),
  'duration',coalesce((content->>'duration')::integer,6500),
  'overlay_strength',coalesce(content->>'overlay_strength','medium'),
  'headline_lines',coalesce(content->'headline_lines','["Bắt trọn khoảnh khắc,","định hình thần thái","độc bản."]'::jsonb)
)
where section_key='hero';

update public.homepage_sections set content=content||'{"dynamic_background":true,"custom_cursor":true}'::jsonb where section_key='portfolio';
update public.homepage_sections set content=content||'{"parallax":true,"cinematic_background":true}'::jsonb,
image_url=coalesce(image_url,(select image_url from public.homepage_sections where section_key='hero')) where section_key='final_cta';

insert into public.homepage_sections(section_key,title,subtitle,content,image_url,is_visible,display_order)
select 'photo_break','Những câu chuyện được kể bằng ánh sáng','CHỌN · PHOTO SÀI GÒN','{"enabled":true,"parallax":true}'::jsonb,image_url,true,25
from public.homepage_sections where section_key='hero'
on conflict(section_key) do nothing;

insert into public.homepage_sections(section_key,title,subtitle,content,is_visible,display_order)
values('marquee','Portrait · Couple · Pre-Wedding · Story · Emotion',null,'{"enabled":true,"text":"PORTRAIT • COUPLE • PRE-WEDDING • STORY • EMOTION •"}'::jsonb,true,65)
on conflict(section_key) do nothing;

commit;
