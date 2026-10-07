'use client';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Trash2, Upload } from 'lucide-react';
import { deleteMedia, listMedia, uploadMedia, type MediaCategory, type MediaRecord, type MediaUploadProgress } from '@/lib/services/mediaService';
import { refreshPublicContent } from '@/lib/client/revalidatePublicContent';

export default function MediaPage() {
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MediaCategory>('homepage');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<Record<number, MediaUploadProgress>>({});
  const load = useCallback(() => listMedia(search).then(setItems).catch((error) => setMessage(error.message)), [search]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (items.length) void refreshPublicContent(); }, [items]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setBusy(true); setMessage(''); setProgress({});
    let failedCount = 0;
    try {
      const uploaded = await uploadMedia(files, category, (next) => { if (next.status === 'error') failedCount += 1; setProgress((current) => ({ ...current, [next.index]: next })); });
      await load(); await refreshPublicContent();
      setMessage(failedCount ? `Đã upload ${uploaded.length}/${files.length} ảnh. Một số ảnh cần thử lại.` : `Đã upload ${uploaded.length} ảnh.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload thất bại.'); }
    finally { setBusy(false); event.target.value = ''; }
  };

  const remove = async (item: MediaRecord) => {
    if (!confirm(`Xóa ảnh ${item.filename}?`)) return;
    try { await deleteMedia(item); setItems((value) => value.filter((entry) => entry.id !== item.id)); await refreshPublicContent(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể xóa'); }
  };

  return <><p className="section-kicker">Admin CMS</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-black">Media Library</h1><p className="mt-2 text-sm text-slate-600">Ảnh được nén WebP và lưu trong Supabase Storage; database chỉ giữ URL và đường dẫn.</p></div><label className="sky-button flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-5"><Upload className="h-4 w-4" />{busy ? 'Đang upload…' : 'Chọn ảnh từ máy'}<input type="file" accept="image/*" multiple disabled={busy} onChange={upload} className="sr-only" /></label></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px_auto]"><label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input className="booking-input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm filename…" /></label><select className="booking-input" value={category} onChange={(event) => setCategory(event.target.value as MediaCategory)}>{['homepage', 'portfolio', 'services', 'locations', 'avatar', 'other'].map((value) => <option key={value}>{value}</option>)}</select><button onClick={load} className="rounded-xl border border-sky-300 bg-white px-5 text-sm font-bold">Tìm</button></div>{message && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}{Object.keys(progress).length > 0 && <ul className="mt-5 space-y-2" aria-live="polite">{Object.values(progress).map((item) => <li key={`${item.index}-${item.file.name}`} className="rounded-xl border border-sky-200 bg-white p-3 text-xs"><div className="flex justify-between gap-3"><strong className="truncate">{item.file.name}</strong><span>{item.status === 'error' ? 'Lỗi' : `${item.progress}%`}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-100"><span className={`block h-full rounded-full ${item.status === 'error' ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${item.progress}%` }} /></div>{item.error && <p className="mt-1 text-rose-700">{item.error}</p>}</li>)}</ul>}<div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-sky-200 bg-white"><div className="relative aspect-square bg-slate-100">{item.public_url && <Image src={item.public_url} alt={item.filename} fill sizes="(max-width:768px) 50vw, 20vw" unoptimized={item.public_url.startsWith('data:')} className="object-cover" />}</div><div className="p-3"><p className="truncate text-xs font-bold" title={item.filename}>{item.filename}</p><p className="mt-1 text-[10px] text-slate-500">{item.category} · {item.size_bytes ? `${Math.round(item.size_bytes / 1024)} KB` : ''}</p><button onClick={() => remove(item)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-50 text-xs font-bold text-rose-700"><Trash2 className="h-4 w-4" />Xóa</button></div></article>)}</div></>;
}
