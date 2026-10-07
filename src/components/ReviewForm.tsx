'use client';

/* eslint-disable @next/next/no-img-element -- local review previews use object URLs before upload. */

import { useEffect, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import type { BookingPhotoRecord } from '@/types';
import { createReview } from '@/lib/services/reviewService';

const LABELS = ['', 'Không hài lòng', 'Chưa tốt', 'Ổn', 'Rất tốt', 'Tuyệt vời'];

export default function ReviewForm({ booking, userId, onClose, onSuccess }: { booking: BookingPhotoRecord; userId?: string; onClose: () => void; onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      bodyOverscroll: body.style.overscrollBehavior,
      htmlOverflow: html.style.overflow,
    };
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.overscrollBehavior = 'none';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.touchAction = previous.bodyTouchAction;
      body.style.overscrollBehavior = previous.bodyOverscroll;
      html.style.overflow = previous.htmlOverflow;
    };
  }, []);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setMessage('');
    if (photos.length < 1) { setSubmitting(false); setMessage('Vui lòng chọn ít nhất 1 ảnh từ buổi chụp.'); return; }
    const result = await createReview({ bookingId: booking.id, userId, customerName: booking.customer_name, serviceTitle: booking.service_title, rating, comment, photos });
    setSubmitting(false);
    if (result.success) {
      setMessage('Cảm ơn bạn đã chia sẻ trải nghiệm! Đánh giá đã hiển thị trên trang chủ. 💙');
      window.setTimeout(onSuccess, 900);
    } else setMessage(result.message || 'Không thể gửi đánh giá.');
  };

  const choosePhotos = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, 5);
    if (selected.length !== files.length || files.length > 5) { setMessage('Bạn chỉ có thể tải tối đa 5 ảnh định dạng hình ảnh.'); }
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  return <div className="review-form-backdrop fixed inset-0 z-[230] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-md sm:items-center">
    <div className="review-form-dialog auth-dialog max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-sky-200 bg-elevated p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><span className="section-kicker">Buổi chụp đã hoàn thành</span><h2 className="mt-2 text-xl font-black text-slate-900">Đánh giá trải nghiệm chụp</h2><p className="mt-1 text-xs text-slate-500">{booking.service_title}</p></div>
        <button type="button" onClick={onClose} aria-label="Đóng đánh giá" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <fieldset className="mt-7">
        <legend className="text-sm font-bold text-slate-800">Đánh giá của bạn</legend>
        <div className="mt-3 flex justify-between gap-1 sm:justify-start sm:gap-2" onMouseLeave={() => setHover(0)}>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onMouseEnter={() => setHover(star)} onClick={() => setRating(star)} aria-label={`${star} sao`} className="grid h-11 w-11 place-items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"><Star className={`h-8 w-8 ${star <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div>
        <p className="mt-2 min-h-5 text-xs font-semibold text-sky-700">{LABELS[hover || rating]}</p>
      </fieldset>
      <label className="mt-5 block text-sm font-bold text-slate-800">Bạn cảm thấy buổi chụp thế nào?<textarea value={comment} maxLength={800} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..." className="booking-input mt-2 min-h-32 resize-none font-normal" /><span className="mt-1 block text-right text-[10px] font-normal text-slate-400">{comment.length}/800</span></label>
      <div className="mt-5"><label className="block text-sm font-bold text-slate-800">Ảnh hôm đó đã chụp <span className="font-normal text-slate-500">(bắt buộc 1–5 ảnh)</span><span className="review-upload-box mt-2"><ImagePlus className="h-5 w-5" /><span>{photos.length ? `Đã chọn ${photos.length}/5 ảnh` : 'Chọn ảnh để chia sẻ'}</span><input type="file" accept="image/*" multiple onChange={(event) => choosePhotos(event.target.files)} /></span></label>{previews.length > 0 && <div className="review-upload-previews">{previews.map((src, index) => <div key={src}><img src={src} alt={`Ảnh đã chọn ${index + 1}`} width="320" height="240" decoding="async" /><button type="button" onClick={() => { const next = photos.filter((_, item) => item !== index); setPhotos(next); URL.revokeObjectURL(src); setPreviews(next.map((file) => URL.createObjectURL(file))); }} aria-label={`Xóa ảnh ${index + 1}`}><X /></button></div>)}</div>}</div>
      <p className="mt-4 text-xs text-slate-600">Đánh giá sẽ được đăng công khai ngay trên trang chủ sau khi gửi.</p>
      {message && <p className={`mt-4 text-sm font-semibold ${message.startsWith('Cảm ơn') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
      <button onClick={submit} disabled={submitting} className="sky-button mt-6 min-h-12 w-full rounded-xl py-3 disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
    </div>
  </div>;
}
