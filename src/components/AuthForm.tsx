'use client';

import type { FormEvent, ReactNode, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { Camera, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';

export type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  fullName: string;
  setFullName: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  message: string;
  messageSuccess?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend?: () => void | Promise<void>;
}

export default function AuthForm({ mode, onModeChange, email, setEmail, password, setPassword, fullName, setFullName, phone, setPhone, showPassword, setShowPassword, isLoading, message, messageSuccess = false, onSubmit, onResend }: AuthFormProps) {
  return <>
    <div className="mx-0 grid grid-cols-2 rounded-xl border border-sky-200 bg-slate-50 p-1.5 text-xs font-semibold">
      <button type="button" onClick={() => onModeChange('login')} className={`cursor-pointer rounded-lg py-2.5 transition-all ${mode === 'login' ? 'bg-brand text-brand-contrast shadow-md' : 'text-slate-600 hover:text-sky-700'}`}>Đăng nhập</button>
      <button type="button" onClick={() => onModeChange('register')} className={`cursor-pointer rounded-lg py-2.5 transition-all ${mode === 'register' ? 'bg-brand text-brand-contrast shadow-md' : 'text-slate-600 hover:text-sky-700'}`}>Đăng ký</button>
    </div>
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      {message && <div className={`rounded-xl border p-3 text-xs ${messageSuccess ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-400/40 bg-red-500/10 text-red-600'}`}><p>{message}</p>{mode === 'login' && onResend && /xác nhận|confirm/i.test(message) && <button type="button" className="mt-2 font-bold underline" onClick={() => void onResend()}>Gửi lại email xác nhận</button>}</div>}
      {mode === 'register' && <>
        <AuthField label="Họ và tên" icon={<User className="h-4 w-4" />}><input required type="text" autoComplete="name" placeholder="Nguyễn Văn An" value={fullName} onChange={(event) => setFullName(event.target.value)} className="auth-input" /></AuthField>
        <AuthField label="Số điện thoại / Zalo" icon={<Phone className="h-4 w-4" />}><input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="0912 345 678" value={phone} onChange={(event) => setPhone(event.target.value)} className="auth-input" /></AuthField>
      </>}
      <AuthField label="Địa chỉ email" icon={<Mail className="h-4 w-4" />}><input required type="email" autoComplete="email" placeholder="email@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input" /></AuthField>
      <AuthField label="Mật khẩu" icon={<Lock className="h-4 w-4" />}><input required minLength={mode === 'register' ? 8 : 6} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-800">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></AuthField>
      {mode === 'login' && <div className="text-right"><Link href="/forgot-password" className="text-xs font-bold text-sky-700 underline-offset-4 hover:underline">Quên mật khẩu?</Link></div>}
      {mode === 'register' && <p className="text-xs leading-5 text-slate-500">Khi tạo tài khoản, bạn đồng ý với <Link href="/terms" className="font-bold text-sky-700 underline">Điều khoản sử dụng</Link> và xác nhận đã đọc <Link href="/privacy" className="font-bold text-sky-700 underline">Chính sách riêng tư</Link>.</p>}
      <button type="submit" disabled={isLoading} className="sky-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-bold disabled:cursor-wait disabled:opacity-70"><Camera className="h-4 w-4" /><span>{isLoading ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span></button>
    </form>
  </>;
}

function AuthField({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-700">{label}</span><span className="auth-field relative block"><span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>{children}</span></label>;
}
