'use client';

import Link from 'next/link';
import type { AppRole } from '@/types';
import { hasRole } from '@/lib/auth/permissions';
import { useAuth } from '@/lib/context/AuthContext';

export default function RoleGuard({ allow, children }: { allow: AppRole[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <main className="grid min-h-screen place-items-center bg-background text-sm text-slate-600">Đang kiểm tra quyền truy cập…</main>;
  if (!user || !allow.some((role) => hasRole(user, role))) return <main className="grid min-h-screen place-items-center bg-background p-6 text-center"><div className="max-w-md rounded-3xl border border-sky-200 bg-elevated p-8"><p className="section-kicker">403 · Không có quyền</p><h1 className="mt-3 text-2xl font-black text-slate-900">Khu vực được bảo vệ</h1><p className="mt-3 text-sm text-slate-600">Tài khoản hiện tại không có quyền truy cập trang này.</p><Link href="/login" className="sky-button mt-6 inline-flex rounded-xl px-5 py-3 text-sm">Đăng nhập tài khoản phù hợp</Link></div></main>;
  return <>{children}</>;
}
