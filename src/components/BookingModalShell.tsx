import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ReactNode } from 'react';

const STEP_LABELS = ['Chọn lịch', 'Thông tin', 'Kiểm tra'];

export default function BookingModalShell({
  variant,
  step,
  onClose,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  showNextIcon,
  children,
  aside,
}: {
  variant: 'modal' | 'page';
  step: number;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  showNextIcon?: boolean;
  children: ReactNode;
  aside: ReactNode;
}) {
  return <div className={variant === 'page' ? 'booking-page-embed' : 'booking-backdrop fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4'} onMouseDown={(event) => variant === 'modal' && event.target === event.currentTarget && onClose()}>
    <div className="booking-dialog auth-dialog flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-sky-200 bg-elevated shadow-2xl sm:rounded-3xl">
      <header className="booking-dialog__head flex items-start justify-between gap-4 border-b border-sky-200 p-4 sm:px-7 sm:py-5">
        <div><span className="section-kicker">Đặt lịch trực tuyến · Chỉ khoảng 2 phút</span><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Đặt buổi chụp của bạn</h2></div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100" aria-label="Đóng cửa sổ đặt lịch"><X className="h-5 w-5" /></button>
      </header>
      <div className="border-b border-sky-100 px-4 py-3 sm:px-7">
        <div className="booking-step-progress flex items-center gap-2" aria-label={`Bước ${step} trên 3`}>
          {STEP_LABELS.map((label, index) => { const number = index + 1; return <div key={label} className="flex min-w-0 flex-1 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${step >= number ? 'bg-brand text-brand-contrast' : 'bg-slate-100 text-slate-400'}`}>{step > number ? <Check className="h-4 w-4" /> : number}</span><span className={`truncate text-xs font-bold sm:text-sm ${step >= number ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>{number < 3 && <span className="ml-auto h-px w-full max-w-12 bg-sky-200" />}</div>; })}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_18rem]">
        <div className={`booking-content ${variant === 'page' ? 'booking-content--page' : 'overflow-y-auto'} p-4 sm:p-7`}>{children}</div>
        {aside}
      </div>
      <footer className="booking-footer flex items-center justify-between gap-3 border-t border-sky-200 bg-elevated p-4 sm:px-7">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-3 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4" />{step === 1 ? 'Đóng' : 'Quay lại'}</button>
        <button onClick={onNext} disabled={nextDisabled} className={`sky-button ${showNextIcon ? 'inline-flex items-center gap-2 disabled:cursor-wait' : ''} rounded-xl px-5 py-3 text-sm disabled:opacity-60`}>{nextLabel}{showNextIcon && <ChevronRight className="h-4 w-4" />}</button>
      </footer>
    </div>
  </div>;
}
