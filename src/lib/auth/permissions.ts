import type { AppRole, Permission, UserProfile } from '@/types';

const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  user: ['booking:self:read', 'booking:create', 'review:create'],
  photographer: ['booking:all:read', 'booking:status:update', 'availability:manage'],
  admin: [
    'booking:all:read', 'service:manage', 'portfolio:manage', 'review:manage',
    'payment:manage', 'revenue:read', 'settings:manage',
  ],
};

export function normalizeRoles(value: unknown): AppRole[] {
  if (value === 'photographer_admin') return ['admin', 'photographer'];
  if (value === 'client') return ['user'];
  const source = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const roles = source.filter((role): role is AppRole => role === 'user' || role === 'photographer' || role === 'admin');
  return roles.length ? [...new Set(roles)] : ['user'];
}

export function hasRole(user: UserProfile | null, role: AppRole) {
  return Boolean(user?.roles.includes(role));
}

export function can(user: UserProfile | null, permission: Permission) {
  return Boolean(user?.roles.some((role) => ROLE_PERMISSIONS[role].includes(permission)));
}

export function rolesFromAuthMetadata(appMetadata: Record<string, unknown> = {}, userMetadata: Record<string, unknown> = {}) {
  return normalizeRoles(appMetadata.roles ?? appMetadata.role ?? userMetadata.roles ?? userMetadata.role);
}

export const NEXT_BOOKING_STATUS: Partial<Record<import('@/types').BookingStatus, import('@/types').BookingStatus>> = {
  pending: 'confirmed',
  confirmed: 'checked_in',
  checked_in: 'shooting',
  shooting: 'completed',
};
