-- Run after creating/signing-up the single owner account in Supabase Auth.
-- Replace the UUID only; never identify privileges by email.
begin;
insert into public.user_roles(user_id,role_id)
select 'REPLACE_WITH_AUTH_USER_UUID'::uuid,id from public.roles where name in('admin','photographer')
on conflict do nothing;
delete from public.user_roles where user_id='REPLACE_WITH_AUTH_USER_UUID'::uuid and role_id=(select id from public.roles where name='user');
commit;
