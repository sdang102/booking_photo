import type { ReactNode } from 'react';
import { normalizeVietnameseMobile } from '@/lib/phone';

export function StepTitle({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <div className="booking-step-title"><span className="text-sky-600 [&>svg]:h-6 [&>svg]:w-6">{icon}</span><h3 className="mt-2 text-2xl font-black text-slate-900">{title}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{copy}</p></div>;
}

export function Required() { return <span className="text-rose-600" aria-hidden="true">*</span>; }

export function FieldIcon({ icon }: { icon: ReactNode }) {
  return <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>;
}

export function Field({ label, icon, placeholder, value, setValue, type = 'text' }: { label: string; icon: ReactNode; placeholder: string; value: string; setValue: (value: string) => void; type?: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label} <Required /><div className="relative mt-2"><FieldIcon icon={icon} /><input required type={type} inputMode={type === 'tel' ? 'tel' : undefined} autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'name'} maxLength={type === 'tel' ? 20 : undefined} value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => { if (type === 'tel') { const normalized = normalizeVietnameseMobile(value); if (normalized) setValue(normalized); } }} placeholder={placeholder} className="booking-input booking-input-icon" /></div></label>;
}

export function SummaryRow({ icon, label }: { icon: ReactNode; label: string }) {
  return <div className="flex items-start gap-3 text-slate-600"><span className="mt-0.5 text-sky-700 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span className="leading-5">{label}</span></div>;
}
