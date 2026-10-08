// CẢNH BÁO: Chỉ dùng để tạo tài khoản kiểm thử trên local/staging; không chạy trên production.
import { randomBytes, randomInt } from 'node:crypto';
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

if (process.env.NODE_ENV === 'production') {
  console.error('Từ chối chạy: create-test-users.mjs không được phép chạy trong production.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong môi trường local/staging.');
  process.exit(1);
}

function generatedEmail(label) {
  return `${label}-${randomBytes(6).toString('hex')}@example.test`;
}

function generatedPassword() {
  return `T9!${randomBytes(18).toString('base64url')}`;
}

function generatedPhone() {
  return `09${randomInt(0, 100_000_000).toString().padStart(8, '0')}`;
}

function makeAccount({ label, envPrefix, roles }) {
  const emailFromEnv = process.env[`${envPrefix}_EMAIL`]?.trim();
  const passwordFromEnv = process.env[`${envPrefix}_PASSWORD`];
  const generatedSuffix = randomBytes(3).toString('hex');

  return {
    label,
    email: emailFromEnv || generatedEmail(label),
    password: passwordFromEnv || generatedPassword(),
    fullName:
      process.env[`${envPrefix}_FULL_NAME`]?.trim() ||
      `Tài khoản kiểm thử ${label} ${generatedSuffix}`,
    phone: process.env[`${envPrefix}_PHONE`]?.trim() || generatedPhone(),
    roles,
    generatedEmail: !emailFromEnv,
    generatedPassword: !passwordFromEnv,
  };
}

const accounts = [
  makeAccount({
    label: 'admin',
    envPrefix: 'TEST_ADMIN',
    roles: ['admin'],
  }),
  makeAccount({
    label: 'photographer',
    envPrefix: 'TEST_PHOTOGRAPHER',
    roles: ['photographer'],
  }),
  makeAccount({
    label: 'customer',
    envPrefix: 'TEST_CUSTOMER',
    roles: ['user'],
  }),
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

  if (result.error || !result.data.user) {
    throw result.error || new Error(`Không thể tạo/cập nhật tài khoản kiểm thử ${account.label}.`);
  }
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
  if (!roleRows || roleRows.length !== account.roles.length) {
    throw new Error('Chưa chạy migration tạo đủ ba role hệ thống.');
  }

  const { error: insertError } = await supabase.from('user_roles').upsert(
    roleRows.map((role) => ({ user_id: user.id, role_id: role.id })),
    { onConflict: 'user_id,role_id', ignoreDuplicates: true },
  );
  if (insertError) throw insertError;
}

for (const account of accounts) {
  await upsertAccount(account);
}

const oneTimeCredentials = accounts.map((account) => ({
  role: account.roles.join(','),
  email: account.email,
  password: account.generatedPassword ? account.password : '(đã đọc từ biến môi trường)',
  email_source: account.generatedEmail ? 'đã sinh ngẫu nhiên' : 'biến môi trường',
}));

console.log(
  'Đã tạo/cập nhật 3 tài khoản test. Lưu thông tin sinh ngẫu nhiên ngay; script chỉ in một lần:\n' +
    JSON.stringify(oneTimeCredentials, null, 2),
);
