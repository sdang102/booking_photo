'use client';

export default function PortfolioError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="fin-site grid min-h-[60vh] place-items-center px-6 text-center"><div><h1 className="text-2xl font-black">Không thể tải bộ sưu tập</h1><button type="button" onClick={reset} className="fin-button fin-button--gold mt-5">Thử lại</button></div></main>;
}
