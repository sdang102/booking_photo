'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import AuthForm, { type AuthMode } from '@/components/AuthForm';
import { useAuth } from '@/lib/context/AuthContext';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import { reportError } from '@/lib/reportError';

function destinationFor(requestedPath: string | null, roles: string[]) {
  if (requestedPath?.startsWith('/') && !requestedPath.startsWith('//')) return requestedPath;
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('photographer')) return '/photographer';
  return '/';
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, login, register, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<AuthMode>(params.get('tab') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(params.get('confirmed') === '1' ? 'Email đã được xác nhận. Bạn có thể đăng nhập ngay.' : '');
  const [messageSuccess, setMessageSuccess] = useState(params.get('confirmed') === '1');
  const [busy, setBusy] = useState(false);
  const requestedPath = params.get('next');

  useEffect(() => { if (user) router.replace(destinationFor(requestedPath, user.roles)); }, [user, router, requestedPath]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(''); setMessageSuccess(false);
    const normalizedPhone = mode === 'register' ? normalizeVietnameseMobile(phone) : null;
    if (mode === 'register' && !normalizedPhone) { setBusy(false); setMessage(VIETNAMESE_MOBILE_ERROR); return; }
    try {
      const result = mode === 'login' ? await login(email, password) : await register(email, password, fullName, normalizedPhone!);
      if (!result.success) { setMessage(result.message || 'Không thể xác thực tài khoản.'); return; }
      if (result.requiresEmailConfirmation) { setMode('login'); setPassword(''); setMessageSuccess(true); setMessage(result.message || 'Đã đăng ký. Hãy xác nhận email rồi đăng nhập.'); return; }
      router.replace(destinationFor(requestedPath, result.roles ?? []));
    } catch (error) {
      reportError(error, { area: 'auth', operation: mode });
      setMessage('Không thể xác thực tài khoản. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const changeMode = (nextMode: AuthMode) => { setMode(nextMode); setMessage(''); setMessageSuccess(false); };
  const resend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await resendConfirmation(email);
      setMessageSuccess(result.success); setMessage(result.message || '');
    } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-background p-4 text-slate-900 sm:p-8"><header className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/" className="flex items-center gap-2 text-sm font-bold text-sky-800"><ArrowLeft className="h-4 w-4" />Trang chủ</Link><BrandLogo compact /></header><section className="mx-auto mt-10 max-w-md rounded-3xl border border-sky-200 bg-elevated p-6 shadow-xl sm:p-8"><span className="section-kicker">Một form cho mọi tài khoản</span><h1 className="mt-2 text-3xl font-black">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1><p className="mt-2 text-sm text-slate-600">Hệ thống tự điều hướng theo quyền được lưu trong hồ sơ tài khoản.</p><div className="mt-6"><AuthForm mode={mode} onModeChange={changeMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone} showPassword={showPassword} setShowPassword={setShowPassword} isLoading={busy} message={message} messageSuccess={messageSuccess} onSubmit={submit} onResend={resend} /></div></section></main>;
}
