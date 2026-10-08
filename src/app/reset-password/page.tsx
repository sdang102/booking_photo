'use client';

/* eslint-disable react-hooks/set-state-in-effect -- token validity is only available from the browser recovery URL. */

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { createClient } from '@/lib/supabase/client';
import { reportError } from '@/lib/reportError';

type RecoveryState = 'checking' | 'ready' | 'invalid' | 'success';

export default function ResetPasswordPage() {
  const [state, setState] = useState<RecoveryState>('checking');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const hashError = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_description');
    if (hashError) {
      setMessage('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      setState('invalid');
      return;
    }

    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        if (error) reportError(error, { area: 'auth', operation: 'verify-password-reset' });
        setMessage('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        setState('invalid');
      } else {
        setState('ready');
      }
    };
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) setState('ready');
    });
    void verifySession();
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || state !== 'ready') return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    setMessage('');
    if (password.length < 8) { setMessage('Mật khẩu mới cần ít nhất 8 ký tự.'); return; }
    if (password !== confirmation) { setMessage('Hai lần nhập mật khẩu chưa khớp.'); return; }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        reportError(error, { area: 'auth', operation: 'reset-password' });
        setMessage(/expired|session|token/i.test(error.message)
          ? 'Liên kết đã hết hạn. Vui lòng yêu cầu một liên kết mới.'
          : 'Chưa thể cập nhật mật khẩu. Vui lòng thử lại.');
      } else {
        await supabase.auth.signOut();
        setMessage('Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.');
        setState('success');
      }
    } catch (error) {
      reportError(error, { area: 'auth', operation: 'reset-password' });
      setMessage('Không thể kết nối dịch vụ xác thực. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="min-h-screen bg-background p-4 text-slate-900 sm:p-8">
    <header className="mx-auto flex max-w-5xl justify-end"><BrandLogo compact /></header>
    <section className="mx-auto mt-10 max-w-md rounded-3xl border border-sky-200 bg-elevated p-6 shadow-xl sm:p-8">
      <span className="section-kicker">Khôi phục tài khoản</span>
      <h1 className="mt-2 text-3xl font-black">Đặt mật khẩu mới</h1>
      {state === 'checking' && <p role="status" className="mt-5 text-sm text-slate-600">Đang kiểm tra liên kết bảo mật…</p>}
      {(state === 'invalid' || state === 'success') && <div className={`mt-5 rounded-xl border p-4 text-sm ${state === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`}><p>{message}</p><Link href={state === 'success' ? '/login' : '/forgot-password'} className="mt-3 inline-block font-bold underline">{state === 'success' ? 'Đăng nhập' : 'Gửi liên kết mới'}</Link></div>}
      {state === 'ready' && <form onSubmit={submit} className="mt-6 space-y-4">
        {message && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
        <label className="block text-sm font-bold text-slate-700">Mật khẩu mới<span className="relative mt-2 block"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required name="password" type="password" minLength={8} autoComplete="new-password" className="booking-input pl-10" placeholder="Tối thiểu 8 ký tự" /></span></label>
        <label className="block text-sm font-bold text-slate-700">Nhập lại mật khẩu<span className="relative mt-2 block"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required name="confirmation" type="password" minLength={8} autoComplete="new-password" className="booking-input pl-10" placeholder="Nhập lại mật khẩu mới" /></span></label>
        <button type="submit" disabled={busy} className="sky-button min-h-12 w-full rounded-xl px-5 font-bold disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang cập nhật…' : 'Lưu mật khẩu mới'}</button>
      </form>}
    </section>
  </main>;
}
