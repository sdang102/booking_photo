'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function LogoutButton({className='',label,onClick}:{className?:string;label?:string;onClick?:()=>void}){
  const {logout}=useAuth();
  const router=useRouter();
  const[open,setOpen]=useState(false);
  const[busy,setBusy]=useState(false);

  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('keydown',close);
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{
      document.removeEventListener('keydown',close);
      document.body.style.overflow=previous;
    };
  },[open]);

  const handleLogout=async()=>{
    setBusy(true);
    await logout();
    onClick?.();
    router.replace('/');
    router.refresh();
  };

  const modal=open?createPortal(
    <div
      className="auth-backdrop fixed inset-0 z-[9999] flex min-h-[100dvh] w-screen items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[10px]"
      role="presentation"
      onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setOpen(false)}}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
          className="auth-dialog w-full max-w-md rounded-3xl border border-sky-200 bg-elevated p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700"><LogOut className="h-5 w-5"/></span>
          <button type="button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Đóng" className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5"/></button>
        </div>
        <h2 id="logout-title" className="mt-6 text-2xl font-black text-slate-900">Bạn muốn đăng xuất?</h2>
        <p id="logout-description" className="mt-2 text-sm leading-6 text-slate-600">Phiên làm việc hiện tại sẽ kết thúc và bạn sẽ được đưa về trang chủ.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={()=>setOpen(false)} className="min-h-12 rounded-xl border border-sky-200 bg-elevated px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">Ở lại</button>
          <button type="button" disabled={busy} onClick={handleLogout} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-brand-contrast shadow-lg shadow-sky-200 transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"><LogOut className="h-4 w-4"/>{busy?'Đang đăng xuất…':'Đăng xuất'}</button>
        </div>
      </section>
    </div>,
    document.body,
  ):null;

  return <>
    <button type="button" onClick={()=>setOpen(true)} title="Đăng xuất" aria-label="Đăng xuất" className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-sky-200 bg-elevated px-3 text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 ${className}`}><LogOut className="h-4 w-4"/>{label && <span>{label}</span>}</button>
    {modal}
  </>;
}
