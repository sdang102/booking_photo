'use client';

export default function MyBookingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-elevated p-8 text-center" role="alert"><h1 className="text-xl font-black">Không thể tải lịch đã đặt</h1><p className="mt-2 text-sm text-slate-500">Vui lòng thử lại.</p><button type="button" onClick={() => reset()} className="sky-button mt-5 rounded-xl px-5 py-3 text-sm font-bold">Thử lại</button></div></main>;
}
