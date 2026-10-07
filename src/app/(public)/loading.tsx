export default function PublicLoading() {
  return <main className="fin-site min-h-screen bg-background" aria-busy="true">
    <div className="mx-auto grid min-h-[60vh] max-w-6xl place-items-center px-6">
      <div className="w-full max-w-3xl animate-pulse space-y-5" aria-label="Đang tải nội dung">
        <div className="h-3 w-28 rounded bg-sky-100" />
        <div className="h-14 w-3/4 rounded bg-sky-100" />
        <div className="h-5 w-2/3 rounded bg-sky-50" />
        <div className="grid gap-4 pt-8 sm:grid-cols-3"><div className="h-56 rounded-2xl bg-sky-50" /><div className="h-56 rounded-2xl bg-sky-50" /><div className="h-56 rounded-2xl bg-sky-50" /></div>
      </div>
    </div>
  </main>;
}
