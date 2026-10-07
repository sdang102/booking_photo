'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import AuthForm, { type AuthMode } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: AuthMode;
}

export default function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const { login, register, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSuccess, setMessageSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleEscape); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(''); setMessageSuccess(false); setIsLoading(true);
    if (mode === 'register' && (!fullName.trim() || !phone.trim())) {
      setIsLoading(false); setMessage('Vui lòng điền đầy đủ họ tên và số điện thoại.'); return;
    }
    const normalizedPhone = mode === 'register' ? normalizeVietnameseMobile(phone) : null;
    if (mode === 'register' && !normalizedPhone) {
      setIsLoading(false); setMessage(VIETNAMESE_MOBILE_ERROR); return;
    }
    try {
      const result = mode === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, fullName.trim(), normalizedPhone ?? phone.trim());
      if (!result.success) { setMessage(result.message || 'Không thể xác thực tài khoản.'); return; }
      if (result.requiresEmailConfirmation) {
        setMode('login'); setPassword(''); setMessageSuccess(true); setMessage(result.message || 'Đã đăng ký. Hãy xác nhận email rồi đăng nhập.'); return;
      }
      if (result.roles?.includes('admin')) { onClose(); router.push('/admin'); }
      else { onSuccess?.(); onClose(); }
    } catch { setMessage('Có lỗi xảy ra, vui lòng thử lại.'); }
    finally { setIsLoading(false); }
  };

  const resend = async () => {
    const result = await resendConfirmation(email);
    setMessageSuccess(result.success); setMessage(result.message || '');
  };

  const changeMode = (nextMode: AuthMode) => { setMode(nextMode); setMessage(''); setMessageSuccess(false); };

  return <div className="auth-backdrop fixed inset-0 z-[220] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
    <div className="auth-dialog relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-sky-200 bg-elevated shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="flex items-center justify-between border-b border-sky-200 bg-elevated/90 p-6"><div><span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">Xác thực tài khoản</span><h3 id="auth-modal-title" className="mt-1 text-xl font-bold text-slate-900">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h3></div><button type="button" onClick={onClose} aria-label="Đóng cửa sổ đăng nhập" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:rotate-90 hover:bg-slate-200 hover:text-slate-900"><X className="h-5 w-5" /></button></div>
      <div className="p-6 pt-5"><AuthForm mode={mode} onModeChange={changeMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} fullName={fullName} setFullName={setFullName} phone={phone} setPhone={setPhone} showPassword={showPassword} setShowPassword={setShowPassword} isLoading={isLoading} message={message} messageSuccess={messageSuccess} onSubmit={submit} onResend={resend} /></div>
    </div>
  </div>;
}
