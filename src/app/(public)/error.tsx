'use client';

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="fin-site grid min-h-[60vh] place-items-center px-6 text-center">
    <div><p className="fin-kicker"><span /> FIN PHOTO</p><h1 className="mt-4 text-3xl font-black">Không thể tải nội dung</h1><p className="mx-auto mt-3 max-w-md text-slate-600">Đã có lỗi tạm thời khi tải trang. Bạn có thể thử lại ngay.</p><button type="button" onClick={reset} className="fin-button fin-button--gold mt-6">Thử lại</button></div>
  </main>;
}
