begin;

-- Logged-in users need to read their own role assignment. Without these
-- policies, photographer accounts are normalized to "user" in both the app
-- and proxy, so a successful sign-in is immediately redirected as forbidden.
drop policy if exists "authenticated_roles_read" on public.roles;
create policy "authenticated_roles_read"
on public.roles for select to authenticated
using (true);

drop policy if exists "user_roles_self_read" on public.user_roles;
create policy "user_roles_self_read"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

commit;
