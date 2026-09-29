'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { X, Lock, Mail, User, Phone, Camera, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'login',
}: AuthModalProps) {
  const router = useRouter();
  const { login, register, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setIsSuccessMessage(false);
    setIsLoading(true);

    try {
      if (!email.trim()) {
        setErrorMsg('Vui lòng nhập email');
        setIsLoading(false);
        return;
      }

      if (mode === 'register') {
        if (!fullName.trim() || !phone.trim()) {
          setErrorMsg('Vui lòng điền đầy đủ họ tên và số điện thoại');
          setIsLoading(false);
          return;
        }
        const normalizedPhone = normalizeVietnameseMobile(phone);
        if (!normalizedPhone) {
          setErrorMsg(VIETNAMESE_MOBILE_ERROR);
          setIsLoading(false);
          return;
        }
        setPhone(normalizedPhone);
      }

      const result = mode === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, fullName.trim(), normalizeVietnameseMobile(phone) ?? phone.trim());

      setIsLoading(false);
      if (!result.success) {
        setErrorMsg(result.message || 'Không thể xác thực tài khoản.');
        return;
      }
      if (result.requiresEmailConfirmation) {
        setMode('login');
        setPassword('');
        setIsSuccessMessage(true);
        setErrorMsg(result.message || 'Đã đăng ký. Hãy xác nhận email rồi đăng nhập.');
        return;
      }
      onClose();
      if (result.roles?.includes('admin')) {
        router.push('/admin');
      } else {
        onSuccess?.();
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại');
      setIsLoading(false);
    }
  };

  const selectMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMsg('');
    setIsSuccessMessage(false);
  };

  return (
    <div
      className="auth-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="auth-dialog relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="flex items-center justify-between border-b border-sky-200 bg-white/90 p-6">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">
              Xác thực tài khoản
            </span>
            <h3 id="auth-modal-title" className="mt-1 text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đăng nhập"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:rotate-90 hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-6 mt-5 grid grid-cols-2 rounded-xl border border-sky-200 bg-slate-50 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => selectMode('login')}
            className={`cursor-pointer rounded-lg py-2.5 transition-all ${mode === 'login' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:text-sky-700'}`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => selectMode('register')}
            className={`cursor-pointer rounded-lg py-2.5 transition-all ${mode === 'register' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:text-sky-700'}`}
          >
            Đăng Ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-5">
          {errorMsg && (
            <div className={`rounded-xl border p-3 text-xs ${isSuccessMessage ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-400/40 bg-red-500/10 text-red-600'}`}><p>{errorMsg}</p>{mode==='login'&&errorMsg.includes('xác nhận')&&<button type="button" className="mt-2 font-bold underline" onClick={async()=>{const result=await resendConfirmation(email);setIsSuccessMessage(result.success);setErrorMsg(result.message||'')}}>Gửi lại email xác nhận</button>}</div>
          )}

          {mode === 'register' && (
            <>
              <AuthField label="Họ và tên" icon={<User className="h-4 w-4" />}>
                <input required type="text" placeholder="Nguyễn Văn An" value={fullName} onChange={(event) => setFullName(event.target.value)} className="auth-input" />
              </AuthField>
              <AuthField label="Số điện thoại / Zalo" icon={<Phone className="h-4 w-4" />}>
                <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="0912 345 678" value={phone} onChange={(event) => setPhone(event.target.value)} onBlur={() => { const normalized = normalizeVietnameseMobile(phone); if (normalized) setPhone(normalized); }} className="auth-input" />
              </AuthField>
            </>
          )}

          <AuthField label="Địa chỉ Email" icon={<Mail className="h-4 w-4" />}>
            <input required type="email" autoComplete="email" placeholder="email@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input" />
          </AuthField>

          <AuthField label="Mật khẩu" icon={<Lock className="h-4 w-4" />}>
            <input required minLength={mode === 'register' ? 8 : 6} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input pr-12" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-800">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>

          <button type="submit" disabled={isLoading} className="sky-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-bold disabled:cursor-wait disabled:opacity-70">
            <Camera className="h-4 w-4" />
            <span>{isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function AuthField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-700">{label}</span>
      <span className="auth-field relative block">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        {children}
      </span>
    </label>
  );
}

