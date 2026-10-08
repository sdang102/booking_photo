import Link from 'next/link';

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
    <section className="max-w-lg rounded-3xl border border-sky-200 bg-elevated p-8 shadow-xl">
      <p className="section-kicker">404 · FIN PHOTO</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900">Không tìm thấy trang</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Đường dẫn này không tồn tại hoặc nội dung đã được chuyển sang vị trí khác.</p>
      <Link href="/" className="sky-button mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-bold">Về trang chủ</Link>
    </section>
  </main>;
}
