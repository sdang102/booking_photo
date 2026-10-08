import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { isAccountDisabled, validateAccountInput, type AdminAccount } from '@/lib/adminAccounts';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import type { AppRole } from '@/types';

export const dynamic = 'force-dynamic';

type ProfileRow = { id: string; email: string | null; full_name: string | null; phone: string | null; avatar_path: string | null };
type MembershipRow = { user_id: string; roles: { name: AppRole } | { name: AppRole }[] | null };
type RoleRow = { id: number; name: AppRole };

async function requireAdmin() {
  const session = await createSessionClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 }) };
  const { data: isAdmin, error: roleError } = await session.rpc('has_role', { required_role: 'admin' });
  if (roleError || !isAdmin) return { response: NextResponse.json({ error: 'Bạn không có quyền quản lý tài khoản.' }, { status: 403 }) };
  return { user };
}

async function listAuthUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return users;
}

function roleName(value: MembershipRow['roles']): AppRole | null {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value?.name ?? null;
}

async function loadAccounts(): Promise<AdminAccount[]> {
  const admin = createAdminClient();
  const [users, profilesResult, membershipsResult] = await Promise.all([
    listAuthUsers(),
    admin.from('profiles').select('id,email,full_name,phone,avatar_path'),
    admin.from('user_roles').select('user_id,roles(name)'),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const profiles = new Map((profilesResult.data as ProfileRow[]).map((profile) => [profile.id, profile]));
  const rolesByUser = new Map<string, AppRole[]>();
  for (const membership of membershipsResult.data as unknown as MembershipRow[]) {
    const name = roleName(membership.roles);
    if (name) rolesByUser.set(membership.user_id, [...(rolesByUser.get(membership.user_id) ?? []), name]);
  }

  return users.map((user) => {
    const profile = profiles.get(user.id);
    return {
      id: user.id,
      email: profile?.email || user.email || '',
      fullName: profile?.full_name || String(user.user_metadata?.full_name ?? ''),
      phone: profile?.phone || String(user.user_metadata?.phone ?? ''),
      roles: rolesByUser.get(user.id) ?? ['user'],
      disabled: isAccountDisabled(user.banned_until),
      bannedUntil: user.banned_until ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    };
  }).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

async function replaceRoles(userId: string, roles: AppRole[]) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('roles').select('id,name').in('name', roles);
  if (error) throw error;
  const rows = data as RoleRow[];
  if (rows.length !== roles.length) throw new Error('Không tìm thấy đầy đủ vai trò trong cơ sở dữ liệu.');
  const { error: deleteError } = await admin.from('user_roles').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  const { error: insertError } = await admin.from('user_roles').insert(rows.map((role) => ({ user_id: userId, role_id: role.id })));
  if (insertError) throw insertError;
}

function guardCriticalAccount(accounts: AdminAccount[], target: AdminAccount, nextRoles: AppRole[], willDisableOrDelete: boolean) {
  for (const role of ['admin', 'photographer'] as const) {
    if (!target.roles.includes(role) || (!willDisableOrDelete && nextRoles.includes(role))) continue;
    const enabledCount = accounts.filter((account) => !account.disabled && account.roles.includes(role)).length;
    if (!target.disabled && enabledCount <= 1) {
      return role === 'admin'
        ? 'Không thể vô hiệu hóa, xóa hoặc gỡ vai trò của quản trị viên cuối cùng.'
        : 'Không thể vô hiệu hóa, xóa hoặc gỡ vai trò của thợ chụp đang hoạt động cuối cùng.';
    }
  }
  return null;
}

function apiError(error: unknown) {
  console.error('[admin/accounts]', error);
  return NextResponse.json({ error: 'Không thể thực hiện thao tác tài khoản. Vui lòng thử lại.' }, { status: 500 });
}

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  try {
    return NextResponse.json({ accounts: await loadAccounts(), currentUserId: auth.user.id });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  try {
    const validation = validateAccountInput(await request.json(), true);
    if ('error' in validation) return NextResponse.json({ error: validation.error }, { status: 400 });
    const admin = createAdminClient();
    const { email, fullName, phone, roles, password } = validation.data;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message || 'Không thể tạo tài khoản.' }, { status: 400 });
    try {
      const { error: profileError } = await admin.from('profiles').upsert({ id: data.user.id, email, full_name: fullName, phone: phone || null });
      if (profileError) throw profileError;
      await replaceRoles(data.user.id, roles);
    } catch (error) {
      await admin.auth.admin.deleteUser(data.user.id, false);
      throw error;
    }
    return NextResponse.json({ message: 'Đã tạo tài khoản.' }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    const disabled = typeof body.disabled === 'boolean' ? body.disabled : undefined;
    if (!id) return NextResponse.json({ error: 'Thiếu mã tài khoản.' }, { status: 400 });
    const accounts = await loadAccounts();
    const target = accounts.find((account) => account.id === id);
    if (!target) return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    if (id === auth.user.id && disabled === true) return NextResponse.json({ error: 'Bạn không thể tự vô hiệu hóa tài khoản đang đăng nhập.' }, { status: 400 });

    if (disabled !== undefined && !('email' in body)) {
      const guardError = guardCriticalAccount(accounts, target, target.roles, disabled);
      if (guardError) return NextResponse.json({ error: guardError }, { status: 400 });
      const { error } = await createAdminClient().auth.admin.updateUserById(id, { ban_duration: disabled ? '876000h' : 'none' });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ message: disabled ? 'Đã vô hiệu hóa tài khoản.' : 'Đã kích hoạt lại tài khoản.' });
    }

    const validation = validateAccountInput(body, false);
    if ('error' in validation) return NextResponse.json({ error: validation.error }, { status: 400 });
    const { email, fullName, phone, roles } = validation.data;
    if (id === auth.user.id && !roles.includes('admin')) return NextResponse.json({ error: 'Bạn không thể tự gỡ vai trò quản trị viên.' }, { status: 400 });
    const guardError = guardCriticalAccount(accounts, target, roles, false);
    if (guardError) return NextResponse.json({ error: guardError }, { status: 400 });

    const admin = createAdminClient();
    const authUser = (await admin.auth.admin.getUserById(id)).data.user;
    if (!authUser) return NextResponse.json({ error: 'Không tìm thấy tài khoản xác thực.' }, { status: 404 });
    const { error: updateError } = await admin.auth.admin.updateUserById(id, {
      email,
      user_metadata: { ...(authUser.user_metadata ?? {}), full_name: fullName, phone },
    });
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    const { error: profileError } = await admin.from('profiles').update({ email, full_name: fullName, phone: phone || null }).eq('id', id);
    if (profileError) throw profileError;
    await replaceRoles(id, roles);
    return NextResponse.json({ message: 'Đã cập nhật tài khoản.' });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Thiếu mã tài khoản.' }, { status: 400 });
    if (id === auth.user.id) return NextResponse.json({ error: 'Bạn không thể tự xóa tài khoản đang đăng nhập.' }, { status: 400 });
    const accounts = await loadAccounts();
    const target = accounts.find((account) => account.id === id);
    if (!target) return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    const guardError = guardCriticalAccount(accounts, target, [], true);
    if (guardError) return NextResponse.json({ error: guardError }, { status: 400 });

    const admin = createAdminClient();
    const [{ data: profile }, { data: images }] = await Promise.all([
      admin.from('profiles').select('avatar_path').eq('id', id).maybeSingle(),
      admin.from('review_images').select('storage_path,thumb_path').eq('user_id', id),
    ]);
    const { error } = await admin.auth.admin.deleteUser(id, false);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const avatarPath = (profile as { avatar_path?: string | null } | null)?.avatar_path;
    const reviewPaths = (images as { storage_path: string; thumb_path: string | null }[] | null ?? [])
      .flatMap((image) => [image.storage_path, image.thumb_path]).filter((path): path is string => Boolean(path));
    const cleanup = await Promise.all([
      avatarPath ? admin.storage.from('avatars').remove([avatarPath]) : Promise.resolve({ error: null }),
      reviewPaths.length ? admin.storage.from('review-media').remove(reviewPaths) : Promise.resolve({ error: null }),
    ]);
    const cleanupWarning = cleanup.some((result) => result.error)
      ? ' Tài khoản đã xóa nhưng một số tệp cũ cần được dọn thủ công.'
      : '';
    return NextResponse.json({ message: `Đã xóa tài khoản.${cleanupWarning}` });
  } catch (error) { return apiError(error); }
}
