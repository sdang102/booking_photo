import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    const separator = value.indexOf('=');
    if (separator < 1) continue;
    const key = value.slice(0, separator).trim();
    const raw = value.slice(separator + 1).trim();
    if (!(key in process.env)) process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local.');
  process.exit(1);
}

const accounts = [
  {
    email: 'admin@chonphoto.test',
    password: 'ChonAdmin@2026',
    fullName: 'Chọn Photo Admin',
    phone: '0900000001',
    roles: ['admin', 'photographer'],
  },
  {
    email: 'photo@chonphoto.test',
    password: 'ChonPhoto@2026',
    fullName: 'Chọn Photo Photographer',
    phone: '0900000002',
    roles: ['photographer'],
  },
  {
    email: 'user@chonphoto.test',
    password: 'ChonUser@2026',
    fullName: 'Chọn Photo User',
    phone: '0900000003',
    roles: ['user'],
  },
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 200) return null;
  }
}

async function upsertAccount(account) {
  const appMetadata = { roles: account.roles };
  const userMetadata = { full_name: account.fullName, phone: account.phone };
  const existing = await findUserByEmail(account.email);
  const result = existing
    ? await supabase.auth.admin.updateUserById(existing.id, {
        password: account.password,
        email_confirm: true,
        app_metadata: appMetadata,
        user_metadata: userMetadata,
      })
    : await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        app_metadata: appMetadata,
        user_metadata: userMetadata,
      });

  if (result.error || !result.data.user) throw result.error || new Error(`Không tạo được ${account.email}`);
  const user = result.data.user;

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: account.email,
    full_name: account.fullName,
    phone: account.phone,
  });
  if (profileError) throw profileError;

  const { data: roleRows, error: roleError } = await supabase
    .from('roles')
    .select('id,name')
    .in('name', account.roles);
  if (roleError) throw roleError;
  if (!roleRows || roleRows.length !== account.roles.length) throw new Error('Chưa chạy migration tạo bảng roles.');

  const { error: deleteError } = await supabase.from('user_roles').delete().eq('user_id', user.id);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from('user_roles').insert(
    roleRows.map((role) => ({ user_id: user.id, role_id: role.id }))
  );
  if (insertError) throw insertError;

  console.log(`${existing ? 'Đã cập nhật' : 'Đã tạo'} ${account.email}: ${account.roles.join(', ')}`);
}

for (const account of accounts) {
  await upsertAccount(account);
}

console.log('Hoàn tất tạo 3 tài khoản test.');
