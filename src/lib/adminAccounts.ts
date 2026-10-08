import { normalizeVietnameseMobile } from '@/lib/phone';
import type { AppRole } from '@/types';

export const ACCOUNT_ROLES: readonly AppRole[] = ['user', 'photographer', 'admin'];

export const ACCOUNT_ROLE_LABELS: Record<AppRole, string> = {
  user: 'Khách hàng',
  photographer: 'Thợ chụp',
  admin: 'Quản trị viên',
};

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roles: AppRole[];
  disabled: boolean;
  bannedUntil: string | null;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AccountFormValues {
  email: string;
  fullName: string;
  phone: string;
  roles: AppRole[];
  password?: string;
}

export type ValidatedAccountInput = Omit<AccountFormValues, 'password'> & { password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAccountInput(value: unknown, creating: boolean):
  | { data: ValidatedAccountInput; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== 'object') return { error: 'Dữ liệu tài khoản không hợp lệ.' };
  const source = value as Record<string, unknown>;
  const email = typeof source.email === 'string' ? source.email.trim().toLowerCase() : '';
  const fullName = typeof source.fullName === 'string' ? source.fullName.trim() : '';
  const phoneInput = typeof source.phone === 'string' ? source.phone.trim() : '';
  const password = typeof source.password === 'string' ? source.password : undefined;
  const roles = Array.isArray(source.roles)
    ? [...new Set(source.roles.filter((role): role is AppRole => ACCOUNT_ROLES.includes(role as AppRole)))]
    : [];

  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: 'Email không hợp lệ.' };
  if (fullName.length < 2 || fullName.length > 100) return { error: 'Họ tên phải có từ 2 đến 100 ký tự.' };
  if (!roles.length) return { error: 'Tài khoản phải có ít nhất một vai trò.' };
  const phone = phoneInput ? normalizeVietnameseMobile(phoneInput) : '';
  if (phoneInput && !phone) return { error: 'Số điện thoại di động Việt Nam không hợp lệ.' };
  if (creating && (!password || password.length < 8)) return { error: 'Mật khẩu tạm thời phải có ít nhất 8 ký tự.' };

  return { data: { email, fullName, phone: phone || '', roles, ...(creating ? { password } : {}) } };
}

export function isAccountDisabled(bannedUntil: string | null | undefined, now = Date.now()): boolean {
  if (!bannedUntil) return false;
  const timestamp = Date.parse(bannedUntil);
  return Number.isFinite(timestamp) && timestamp > now;
}
