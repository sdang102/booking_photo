'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (error) {
        const limited = error.message.toLowerCase().includes('rate limit');
        setMessage({
          type: 'error',
          text: limited
            ? 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lúc rồi thử lại.'
            : 'Chưa thể gửi email đặt lại mật khẩu. Vui lòng kiểm tra địa chỉ email và thử lại.',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Nếu email thuộc một tài khoản hợp lệ, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục Spam.',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể kết nối dịch vụ xác thực. Vui lòng thử lại.' });
    } finally {
      setBusy(false);
    }
  };

  return <main className="min-h-screen bg-background p-4 text-slate-900 sm:p-8">
    <header className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/login" className="flex items-center gap-2 text-sm font-bold text-sky-800"><ArrowLeft className="h-4 w-4" />Đăng nhập</Link><BrandLogo compact /></header>
    <section className="mx-auto mt-10 max-w-md rounded-3xl border border-sky-200 bg-elevated p-6 shadow-xl sm:p-8">
      <span className="section-kicker">Khôi phục tài khoản</span>
      <h1 className="mt-2 text-3xl font-black">Quên mật khẩu</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Nhập email đăng nhập. Liên kết bảo mật sẽ được gửi qua email nếu tài khoản tồn tại.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {message && <p role="status" className={`rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>{message.text}</p>}
        <label className="block text-sm font-bold text-slate-700">Email đăng nhập<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="booking-input pl-10" placeholder="email@example.com" /></span></label>
        <button type="submit" disabled={busy} className="sky-button min-h-12 w-full rounded-xl px-5 font-bold disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại mật khẩu'}</button>
      </form>
    </section>
  </main>;
}
