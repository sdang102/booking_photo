'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone, Sparkles, User, X } from 'lucide-react';
import type { AvailabilityBlock, BookingFormData, BookingPhotoRecord, PublicScheduleItem, Service } from '@/types';
import { createBookingPhoto, getAvailabilityBlocks, getPublicSchedule } from '@/lib/services/bookingService';
import { useAuth } from '@/lib/context/AuthContext';
import { formatVND } from './ServiceCard';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import { BOOKING_SHIFTS, isRangeAvailable } from '@/lib/bookingAvailability';
import BookingCalendar from './BookingCalendar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  initialServiceId?: string;
  onBookingSuccess: (booking: BookingPhotoRecord) => void;
  onOpenAuth?: () => void;
}

const STEP_LABELS = ['Ngày & giờ', 'Địa điểm', 'Thông tin', 'Xác nhận'];

export default function BookingWizard({ isOpen, onClose, services, initialServiceId, onBookingSuccess }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [calendarBookings, setCalendarBookings] = useState<PublicScheduleItem[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingPhotoRecord | null>(null);

  const service = useMemo(
    () => services.find((item) => item.id === initialServiceId) ?? services[0],
    [initialServiceId, services],
  );

  const refreshAvailability = async () => {
    const [bookings, blocks] = await Promise.all([getPublicSchedule(), getAvailabilityBlocks()]);
    setCalendarBookings(bookings);
    setAvailabilityBlocks(blocks);
    setAvailabilityLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.all([getPublicSchedule(), getAvailabilityBlocks()]).then(([bookings, blocks]) => {
      if (!active) return;
      setCalendarBookings(bookings);
      setAvailabilityBlocks(blocks);
      setAvailabilityLoading(false);
    });
    return () => { active = false; };
  }, [isOpen, user]);

  const total = service?.price || 0;
  const availableShifts = date
    ? BOOKING_SHIFTS.filter((shift) => isRangeAvailable(date, shift.range, calendarBookings, availabilityBlocks))
    : [];

  if (!isOpen) return null;

  const closeWizard = () => {
    setStep(1);
    setError('');
    setSuccess(null);
    setDate('');
    setTime('');
    setAddress('');
    setNotes('');
    setName(user?.full_name || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
    onClose();
  };

  const next = () => {
    setError('');
    if (!service) return setError('Trải nghiệm Luxury đang được tải. Vui lòng thử lại sau giây lát.');
    if (step === 1) {
      if (!date) return setError('Vui lòng chọn ngày chụp.');
      if (!time) return setError('Vui lòng chọn một ca còn trống.');
      if (!isRangeAvailable(date, time, calendarBookings, availabilityBlocks)) return setError('Ca này vừa có người giữ chỗ. Vui lòng chọn ca khác.');
    }
    if (step === 2 && address.trim().length < 5) return setError('Vui lòng nhập địa chỉ chụp cụ thể.');
    if (step === 3 && (!name.trim() || !email.includes('@'))) return setError('Vui lòng nhập đầy đủ họ tên và email hợp lệ.');
    if (step === 3 && !normalizeVietnameseMobile(phone)) return setError(VIETNAMESE_MOBILE_ERROR);
    setStep((value) => Math.min(4, value + 1));
  };

  const submit = async () => {
    if (!service) return;
    setSubmitting(true);
    setError('');
    const normalizedPhone = normalizeVietnameseMobile(phone);
    if (!normalizedPhone) {
      setSubmitting(false);
      setError(VIETNAMESE_MOBILE_ERROR);
      return;
    }
    const payload: BookingFormData = {
      customer_name: name.trim(), customer_phone: normalizedPhone, customer_email: email.trim(),
      service_id: service.id, service_title: service.title, booking_date: date, booking_time: time,
      location_type: 'outdoor', shoot_address: address.trim(), notes, addon_services: [],
      total_price: total, user_id: user?.id,
    };
    const result = await createBookingPhoto(payload);
    setSubmitting(false);
    if (result.success && result.data) {
      setSuccess(result.data);
      onBookingSuccess(result.data);
    } else {
      await refreshAvailability();
      setError(result.message || 'Không thể tạo booking. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-md sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && closeWizard()}>
      <div className="auth-dialog flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-sky-200 bg-elevated shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-sky-200 p-5 sm:p-6">
          <div><span className="section-kicker">Luxury Signature · Booking online</span><h2 className="mt-1 text-2xl font-black text-slate-900">Chọn lịch cho buổi chụp của bạn</h2></div>
          <button type="button" onClick={closeWizard} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100" aria-label="Đóng cửa sổ đặt lịch"><X className="h-5 w-5" /></button>
        </header>

        {success ? (
          <div className="p-8 text-center sm:p-14">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h3 className="mt-5 text-3xl font-black text-slate-900">Đã giữ yêu cầu của bạn!</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">Mã booking: <strong>PHOT-{success.id.slice(-8).toUpperCase()}</strong><br />S. Đặng sẽ liên hệ xác nhận và tư vấn moodboard Luxury phù hợp với bạn.</p>
            <button onClick={closeWizard} className="sky-button mt-7 rounded-xl px-7 py-3">Hoàn tất</button>
          </div>
        ) : (
          <>
            <div className="border-b border-sky-100 px-4 py-4 sm:px-6">
              <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-sky-50 px-4 py-3">
                <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-sky-700" /><div><strong className="block text-sm text-slate-900">{service?.title ?? 'Luxury Signature Portrait'}</strong><span className="text-xs text-slate-600">Một concept duy nhất, cá nhân hoá cho bạn</span></div></div>
                <strong className="shrink-0 text-sm text-sky-700">{service ? formatVND(service.price) : 'Đang tải...'}</strong>
              </div>
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Bước {step}/4 · {STEP_LABELS[step - 1]}</p>
              <div className="flex items-start justify-between gap-1">{STEP_LABELS.map((label, index) => { const number = index + 1; return <div key={label} className="flex min-w-0 flex-1 flex-col items-center"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${step >= number ? 'bg-brand text-brand-contrast' : 'bg-slate-100 text-slate-400'}`}>{step > number ? <Check className="h-4 w-4" /> : number}</span><span className="mt-1 hidden text-xs font-semibold text-slate-500 sm:block">{label}</span></div>; })}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
              {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</div>}
              {step === 1 && <div><StepTitle icon={<Calendar />} title="Chọn ngày & ca chụp" copy="Mỗi ngày chỉ nhận tối đa hai booking để đảm bảo chất lượng chuẩn bị." /><BookingCalendar selectedDate={date} bookings={calendarBookings} blocks={availabilityBlocks} loading={availabilityLoading} onSelect={(value) => { setDate(value); setTime(''); setError(''); }} />{date && <section className="mx-auto mt-5 max-w-xl rounded-2xl border border-sky-200 bg-elevated p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><Clock className="h-4 w-4" /></span><div><h4 className="text-sm font-black text-slate-900">Ca còn trống ngày {date.split('-').reverse().join('/')}</h4><p className="text-xs text-slate-500">Chọn một ca phù hợp với bạn.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{availableShifts.map((shift) => <button type="button" key={shift.id} onClick={() => { setTime(shift.range); setError(''); }} className={`rounded-xl border px-3 py-3 text-left text-sm font-bold ${time === shift.range ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-100' : 'border-sky-200 text-slate-700'}`}><span className="block">{shift.label}</span><span className="mt-1 block text-xs font-normal text-slate-500">{shift.range}</span></button>)}</div>{availableShifts.length === 0 && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">Ngày này đã hết ca. Bạn vui lòng chọn ngày khác.</p>}</section>}</div>}
              {step === 2 && <div><StepTitle icon={<MapPin />} title="Bạn muốn chụp ở đâu?" copy="Nhập địa điểm cụ thể để chúng tôi chuẩn bị ánh sáng và lộ trình phù hợp." /><label className="mt-6 block text-base font-bold text-slate-700">Địa chỉ chụp<div className="relative mt-2"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sky-600"><MapPin className="h-5 w-5" /></span><input required value={address} onChange={(event) => { setAddress(event.target.value); setError(''); }} placeholder="Ví dụ: Khách sạn The Reverie, Quận 1, TP.HCM" className="booking-input booking-input-icon" /></div></label><p className="mt-3 text-sm leading-6 text-slate-500">Hiện tại Luxury Signature được thực hiện tại địa điểm ngoại cảnh hoặc không gian do khách hàng lựa chọn.</p></div>}
              {step === 3 && <div><StepTitle icon={<User />} title="Thông tin liên hệ" copy="S. Đặng sẽ liên hệ để xác nhận lịch và tư vấn moodboard cho bạn." /><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Họ và tên" icon={<User />} placeholder="Nguyễn Văn A" value={name} setValue={setName} /><Field label="Số điện thoại / Zalo" icon={<Phone />} placeholder="09xx xxx xxx" value={phone} setValue={setPhone} type="tel" /><div className="sm:col-span-2"><Field label="Email" icon={<Mail />} placeholder="ban@example.com" value={email} setValue={setEmail} type="email" /></div><label className="block text-base font-bold text-slate-700 sm:col-span-2">Điều bạn muốn thể hiện trong bộ ảnh <span className="font-normal text-slate-500">(không bắt buộc)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ví dụ: sang trọng, quyền lực, tối giản; trang phục bạn dự định mặc..." className="booking-input mt-2 min-h-24" /></label></div></div>}
              {step === 4 && <div><StepTitle icon={<CheckCircle2 />} title="Xác nhận booking" copy="Kiểm tra lại thông tin trước khi gửi yêu cầu." /><dl className="mt-6 divide-y divide-sky-100 rounded-2xl border border-sky-200 bg-slate-50 p-5 text-base">{[['Trải nghiệm', service?.title], ['Ngày', date.split('-').reverse().join('/')], ['Ca chụp', BOOKING_SHIFTS.find((shift) => shift.range === time)?.label || time], ['Giờ', time], ['Địa điểm', address], ['Tổng', formatVND(total)], ['Thanh toán', 'Thanh toán tại buổi chụp']].map(([key, value]) => <div key={key} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"><dt className="text-slate-500">{key}</dt><dd className="text-right font-bold text-slate-900">{value}</dd></div>)}</dl></div>}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-sky-200 p-4 sm:px-6"><button onClick={() => { setError(''); if (step === 1) closeWizard(); else setStep(step - 1); }} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-3 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4" />{step === 1 ? 'Đóng' : 'Quay lại'}</button>{step < 4 ? <button onClick={next} className="sky-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">Tiếp tục<ChevronRight className="h-4 w-4" /></button> : <button onClick={submit} disabled={submitting || !service} className="sky-button rounded-xl px-5 py-3 text-sm disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Đặt Lịch'}</button>}</footer>
          </>
        )}
      </div>
    </div>
  );
}

function StepTitle({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div><span className="text-sky-600 [&>svg]:h-6 [&>svg]:w-6">{icon}</span><h3 className="mt-3 text-2xl font-black text-slate-900">{title}</h3><p className="mt-1 text-base leading-7 text-slate-600">{copy}</p></div>;
}

function Field({ label, icon, placeholder, value, setValue, type = 'text' }: { label: string; icon: React.ReactNode; placeholder: string; value: string; setValue: (value: string) => void; type?: string }) {
  return <label className="block text-base font-bold text-slate-700">{label} <span className="text-rose-600" aria-hidden="true">*</span><div className="relative mt-2"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><input required type={type} inputMode={type === 'tel' ? 'tel' : undefined} autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'name'} maxLength={type === 'tel' ? 20 : undefined} value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => { if (type === 'tel') { const normalized = normalizeVietnameseMobile(value); if (normalized) setValue(normalized); } }} placeholder={placeholder} className="booking-input booking-input-icon" /></div></label>;
}
