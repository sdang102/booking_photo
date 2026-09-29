'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/lib/context/AuthContext';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';

function destinationFor(requestedPath: string | null, roles: string[]) {
  if (requestedPath?.startsWith('/') && !requestedPath.startsWith('//')) return requestedPath;
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('photographer')) return '/photographer';
  return '/';
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#fffcf7]" />}><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const { user, login, register } = useAuth();
  const [mode,setMode]=useState<'login'|'register'>(params.get('tab')==='register'?'register':'login');
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [name,setName]=useState(''); const [phone,setPhone]=useState('');
  const [message,setMessage]=useState(params.get('confirmed')==='1'?'Email đã được xác nhận. Bạn có thể đăng nhập ngay.':''); const [messageSuccess,setMessageSuccess]=useState(params.get('confirmed')==='1'); const [busy,setBusy]=useState(false);

  const requestedPath = params.get('next');
  useEffect(()=>{ if(user) router.replace(destinationFor(requestedPath,user.roles)); },[user,router,requestedPath]);
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setMessage('');setMessageSuccess(false);
    const normalizedPhone=mode==='register'?normalizeVietnameseMobile(phone):null;
    if(mode==='register'&&!normalizedPhone){setBusy(false);setMessage(VIETNAMESE_MOBILE_ERROR);return;}
    const result=mode==='login'?await login(email,password):await register(email,password,name,normalizedPhone!);
    setBusy(false); if(!result.success){setMessage(result.message||'Không thể xác thực tài khoản.');return;}
    if(result.requiresEmailConfirmation){setMode('login');setPassword('');setMessageSuccess(true);setMessage(result.message||'Đã đăng ký. Hãy xác nhận email rồi đăng nhập.');return;}
    router.replace(destinationFor(requestedPath,result.roles ?? []));
  };
  return <main className="min-h-screen bg-[#fffcf7] p-4 text-slate-900 sm:p-8"><header className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/" className="flex items-center gap-2 text-sm font-bold text-sky-800"><ArrowLeft className="h-4 w-4"/>Trang chủ</Link><BrandLogo compact/></header><section className="mx-auto mt-10 max-w-md rounded-3xl border border-sky-200 bg-white p-6 shadow-xl sm:p-8"><span className="section-kicker">Một form cho mọi tài khoản</span><h1 className="mt-2 text-3xl font-black">{mode==='login'?'Đăng Nhập':'Đăng Ký'}</h1><p className="mt-2 text-sm text-slate-600">Hệ thống tự điều hướng theo quyền được lưu trong hồ sơ tài khoản.</p><div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-50 p-1"><button type="button" onClick={()=>setMode('login')} className={`rounded-lg py-2 text-sm font-bold ${mode==='login'?'bg-sky-600 text-white':''}`}>Đăng nhập</button><button type="button" onClick={()=>setMode('register')} className={`rounded-lg py-2 text-sm font-bold ${mode==='register'?'bg-sky-600 text-white':''}`}>Đăng ký</button></div><form onSubmit={submit} className="mt-6 space-y-4">{mode==='register'&&<><Field icon={<User/>}><input className="auth-input" required placeholder="Họ và tên" value={name} onChange={e=>setName(e.target.value)}/></Field><Field icon={<Phone/>}><input className="auth-input" required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="0912 345 678" value={phone} onChange={e=>setPhone(e.target.value)} onBlur={()=>{const normalized=normalizeVietnameseMobile(phone);if(normalized)setPhone(normalized)}}/></Field></>}<Field icon={<Mail/>}><input className="auth-input" type="email" autoComplete="email" required placeholder="email@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field icon={<Lock/>}><input className="auth-input pr-12" type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='register'?8:6} placeholder={mode==='register'?'Tối thiểu 8 ký tự':'Nhập mật khẩu'} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'} title={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'} className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-800">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></Field>{message&&<p className={`rounded-xl p-3 text-sm ${messageSuccess?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{message}</p>}<button disabled={busy} className="sky-button flex w-full items-center justify-center gap-2 rounded-xl py-3"><Camera className="h-4 w-4"/>{busy?'Đang xử lý…':mode==='login'?'Đăng Nhập':'Tạo Tài Khoản'}</button></form></section></main>;
}

function Field({icon,children}:{icon:React.ReactNode;children:React.ReactNode}){return <label className="relative block"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{children}</label>}
