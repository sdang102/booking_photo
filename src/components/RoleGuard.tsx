'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { AppRole } from '@/types';
import { hasRole } from '@/lib/auth/permissions';
import { useAuth } from '@/lib/context/AuthContext';

export default function RoleGuard({ allow, children }: { allow: AppRole[]; children: React.ReactNode }) {
  const { user, isLoading, isSigningOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isSigningOut && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isSigningOut, pathname, router, user]);

  if (isLoading || isSigningOut) return <main className="grid min-h-screen place-items-center bg-background text-sm text-slate-600">{isSigningOut ? 'Đang đăng xuất…' : 'Đang kiểm tra quyền truy cập…'}</main>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-background text-sm text-slate-600">Đang chuyển đến trang đăng nhập…</main>;
  if (!allow.some((role) => hasRole(user, role))) return <main className="grid min-h-screen place-items-center bg-background p-6 text-center"><div className="max-w-md rounded-3xl border border-sky-200 bg-elevated p-8"><p className="section-kicker">403 · Không có quyền</p><h1 className="mt-3 text-2xl font-black text-slate-900">Khu vực được bảo vệ</h1><p className="mt-3 text-sm text-slate-600">Tài khoản hiện tại không có quyền truy cập trang này.</p><Link href="/login" className="sky-button mt-6 inline-flex rounded-xl px-5 py-3 text-sm">Đăng nhập tài khoản phù hợp</Link></div></main>;
  return <>{children}</>;
}
