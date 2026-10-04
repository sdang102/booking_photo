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
  initialDate?: string;
  onBookingSuccess: (booking: BookingPhotoRecord) => void;
  onOpenAuth?: () => void;
  variant?: 'modal' | 'page';
}

const STEP_LABELS = ['Chọn lịch', 'Thông tin', 'Kiểm tra'];

export default function BookingWizard({ isOpen, onClose, services, initialServiceId, initialDate, onBookingSuccess, variant = 'modal' }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(initialDate || '');
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

  const service = useMemo(() => services.find((item) => item.id === initialServiceId) ?? services[0], [initialServiceId, services]);
  const total = service?.price || 0;
  const selectedShift = BOOKING_SHIFTS.find((shift) => shift.range === time);
  const availableShifts = date ? BOOKING_SHIFTS.filter((shift) => isRangeAvailable(date, shift.range, calendarBookings, availabilityBlocks)) : [];

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

  if (!isOpen) return null;

  const closeWizard = () => {
    setStep(1); setError(''); setSuccess(null); setDate(''); setTime(''); setAddress(''); setNotes('');
    setName(user?.full_name || ''); setPhone(user?.phone || ''); setEmail(user?.email || '');
    onClose();
  };

  const next = () => {
    setError('');
    if (!service) return setError('Gói chụp đang được tải. Vui lòng thử lại sau giây lát.');
    if (step === 1) {
      if (!date) return setError('Vui lòng chọn ngày chụp.');
      if (!time) return setError('Vui lòng chọn một ca còn trống.');
      if (!isRangeAvailable(date, time, calendarBookings, availabilityBlocks)) return setError('Ca này vừa có người giữ chỗ. Vui lòng chọn ca khác.');
    }
    if (step === 2) {
      if (address.trim().length < 5) return setError('Vui lòng nhập địa chỉ chụp cụ thể.');
      if (!name.trim() || !email.includes('@')) return setError('Vui lòng nhập đầy đủ họ tên và email hợp lệ.');
      if (!normalizeVietnameseMobile(phone)) return setError(VIETNAMESE_MOBILE_ERROR);
    }
    setStep((value) => Math.min(3, value + 1));
  };

  const submit = async () => {
    if (!service || submitting) return;
    const normalizedPhone = normalizeVietnameseMobile(phone);
    if (!normalizedPhone) return setError(VIETNAMESE_MOBILE_ERROR);
    setSubmitting(true); setError('');
    const payload: BookingFormData = {
      customer_name: name.trim(), customer_phone: normalizedPhone, customer_email: email.trim(),
      service_id: service.id, service_title: service.title, booking_date: date, booking_time: time,
      location_type: 'outdoor', shoot_address: address.trim(), notes, addon_services: [], total_price: total, user_id: user?.id,
    };
    const result = await createBookingPhoto(payload);
    setSubmitting(false);
    if (result.success && result.data) { setSuccess(result.data); onBookingSuccess(result.data); }
    else { await refreshAvailability(); setError(result.message || 'Không thể tạo booking. Vui lòng thử lại.'); }
  };

  return (
    <div className={variant === 'page' ? 'booking-page-embed' : 'booking-backdrop fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4'} onMouseDown={(event) => variant === 'modal' && event.target === event.currentTarget && closeWizard()}>
      <div className="booking-dialog auth-dialog flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-sky-200 bg-elevated shadow-2xl sm:rounded-3xl">
        <header className="booking-dialog__head flex items-start justify-between gap-4 border-b border-sky-200 p-4 sm:px-7 sm:py-5">
          <div><span className="section-kicker">Đặt lịch trực tuyến · Chỉ khoảng 2 phút</span><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Đặt buổi chụp của bạn</h2></div>
          <button type="button" onClick={closeWizard} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100" aria-label="Đóng cửa sổ đặt lịch"><X className="h-5 w-5" /></button>
        </header>

        {success ? (
          <div className="p-8 text-center sm:p-14">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h3 className="mt-5 text-3xl font-black text-slate-900">Yêu cầu đã được gửi!</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">Mã lịch: <strong>PHOT-{success.id.slice(-8).toUpperCase()}</strong><br />Chúng tôi sẽ liên hệ xác nhận và tư vấn concept phù hợp với bạn.</p>
            <button onClick={closeWizard} className="sky-button mt-7 rounded-xl px-7 py-3">Hoàn tất</button>
          </div>
        ) : (
          <>
            <div className="border-b border-sky-100 px-4 py-3 sm:px-7">
              <div className="booking-step-progress flex items-center gap-2" aria-label={`Bước ${step} trên 3`}>
                {STEP_LABELS.map((label, index) => { const number = index + 1; return <div key={label} className="flex min-w-0 flex-1 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${step >= number ? 'bg-brand text-brand-contrast' : 'bg-slate-100 text-slate-400'}`}>{step > number ? <Check className="h-4 w-4" /> : number}</span><span className={`truncate text-xs font-bold sm:text-sm ${step >= number ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>{number < 3 && <span className="ml-auto h-px w-full max-w-12 bg-sky-200" />}</div>; })}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_18rem]">
              <div className="booking-content overflow-y-auto p-4 sm:p-7">
                {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</div>}
                {step === 1 && <div>
                  <StepTitle icon={<Calendar />} title="Chọn ngày và ca chụp" copy="Ngày khả dụng được hiển thị ngay trên lịch. Sau khi chọn ngày, hãy chọn một trong các ca còn trống." />
                  <BookingCalendar selectedDate={date} bookings={calendarBookings} blocks={availabilityBlocks} loading={availabilityLoading} onSelect={(value) => { setDate(value); setTime(''); setError(''); }} />
                  {date && <section className="mx-auto mt-5 max-w-xl rounded-2xl border border-sky-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-sky-700" /><h4 className="font-black text-slate-900">Ca chụp ngày {date.split('-').reverse().join('/')}</h4></div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">{BOOKING_SHIFTS.map((shift) => {
                      const available = availableShifts.some((item) => item.id === shift.id);
                      return <button type="button" key={shift.id} disabled={!available} onClick={() => { setTime(shift.range); setError(''); }} className={`rounded-xl border p-3 text-left transition ${time === shift.range ? 'border-sky-600 bg-sky-50 ring-2 ring-sky-200' : available ? 'border-sky-200 bg-elevated hover:border-sky-500' : 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-55'}`}><strong className="block text-sm text-slate-800">{shift.label}</strong><span className="mt-1 block text-xs text-slate-500">{shift.range} · {available ? 'Còn trống' : 'Đã kín'}</span></button>;
                    })}</div>
                    {!availableShifts.length && <p className="mt-3 text-sm font-semibold text-rose-700">Ngày này đã hết ca. Vui lòng chọn ngày khác.</p>}
                  </section>}
                </div>}

                {step === 2 && <div>
                  <StepTitle icon={<User />} title="Thông tin buổi chụp" copy="Cho chúng tôi biết nơi chụp và cách liên hệ. Thông tin tài khoản đã được điền sẵn để bạn thao tác nhanh hơn." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-bold text-slate-700 sm:col-span-2">Địa điểm chụp <Required /><div className="relative mt-2"><FieldIcon icon={<MapPin />} /><input autoFocus required value={address} onChange={(event) => { setAddress(event.target.value); setError(''); }} placeholder="Ví dụ: Thảo Cầm Viên, Quận 1, TP.HCM" className="booking-input booking-input-icon" /></div></label>
                    <Field label="Họ và tên" icon={<User />} placeholder="Nguyễn Văn A" value={name} setValue={setName} />
                    <Field label="Số điện thoại / Zalo" icon={<Phone />} placeholder="09xx xxx xxx" value={phone} setValue={setPhone} type="tel" />
                    <div className="sm:col-span-2"><Field label="Email" icon={<Mail />} placeholder="ban@example.com" value={email} setValue={setEmail} type="email" /></div>
                    <label className="block text-sm font-bold text-slate-700 sm:col-span-2">Mong muốn cho bộ ảnh <span className="font-normal text-slate-500">(không bắt buộc)</span><textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Phong cách, trang phục hoặc điều bạn muốn chúng tôi lưu ý..." className="booking-input mt-2 min-h-24 resize-none" /></label>
                  </div>
                </div>}

                {step === 3 && <div>
                  <StepTitle icon={<CheckCircle2 />} title="Kiểm tra trước khi gửi" copy="Bạn chưa phải thanh toán ở bước này. Chúng tôi sẽ liên hệ xác nhận lịch với bạn." />
                  <dl className="mt-6 divide-y divide-sky-100 rounded-2xl border border-sky-200 bg-slate-50 p-5 text-sm sm:text-base">{[
                    ['Gói chụp', service?.title], ['Ngày & ca', `${date.split('-').reverse().join('/')} · ${selectedShift?.label || time} (${time})`], ['Địa điểm', address], ['Khách hàng', name], ['Liên hệ', `${phone} · ${email}`], ['Chi phí dự kiến', formatVND(total)], ['Thanh toán', 'Thanh toán tại buổi chụp'],
                  ].map(([key, value]) => <div key={key} className="flex justify-between gap-5 py-3 first:pt-0 last:pb-0"><dt className="shrink-0 text-slate-500">{key}</dt><dd className="max-w-md text-right font-bold text-slate-900">{value}</dd></div>)}</dl>
                </div>}
              </div>

              <aside className="hidden border-l border-sky-100 bg-slate-50 p-6 lg:block">
                <Sparkles className="h-5 w-5 text-sky-700" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-sky-700">Lịch của bạn</p>
                <h3 className="mt-2 font-black text-slate-900">{service?.title ?? 'Đang tải gói chụp...'}</h3>
                <strong className="mt-2 block text-lg text-sky-700">{service ? formatVND(total) : '—'}</strong>
                <div className="mt-6 space-y-4 border-t border-sky-200 pt-5 text-sm">
                  <SummaryRow icon={<Calendar />} label={date ? date.split('-').reverse().join('/') : 'Chưa chọn ngày'} />
                  <SummaryRow icon={<Clock />} label={selectedShift ? `${selectedShift.label} · ${time}` : 'Chưa chọn ca'} />
                  <SummaryRow icon={<MapPin />} label={address || 'Chưa nhập địa điểm'} />
                </div>
                <p className="mt-7 rounded-xl bg-sky-50 p-3 text-xs leading-5 text-slate-600">Không cần đặt cọc trực tuyến. Lịch chỉ được xác nhận sau khi chúng tôi liên hệ với bạn.</p>
              </aside>
            </div>

            <footer className="booking-footer flex items-center justify-between gap-3 border-t border-sky-200 bg-elevated p-4 sm:px-7">
              <button onClick={() => { setError(''); if (step === 1) closeWizard(); else setStep(step - 1); }} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-3 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4" />{step === 1 ? 'Đóng' : 'Quay lại'}</button>
              {step < 3 ? <button onClick={next} className="sky-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">{step === 1 ? 'Điền thông tin' : 'Kiểm tra lịch'}<ChevronRight className="h-4 w-4" /></button> : <button onClick={submit} disabled={submitting || !service} className="sky-button rounded-xl px-5 py-3 text-sm disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}</button>}
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function StepTitle({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="booking-step-title"><span className="text-sky-600 [&>svg]:h-6 [&>svg]:w-6">{icon}</span><h3 className="mt-2 text-2xl font-black text-slate-900">{title}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{copy}</p></div>;
}

function Required() { return <span className="text-rose-600" aria-hidden="true">*</span>; }
function FieldIcon({ icon }: { icon: React.ReactNode }) { return <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>; }

function Field({ label, icon, placeholder, value, setValue, type = 'text' }: { label: string; icon: React.ReactNode; placeholder: string; value: string; setValue: (value: string) => void; type?: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label} <Required /><div className="relative mt-2"><FieldIcon icon={icon} /><input required type={type} inputMode={type === 'tel' ? 'tel' : undefined} autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'name'} maxLength={type === 'tel' ? 20 : undefined} value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => { if (type === 'tel') { const normalized = normalizeVietnameseMobile(value); if (normalized) setValue(normalized); } }} placeholder={placeholder} className="booking-input booking-input-icon" /></div></label>;
}

function SummaryRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-start gap-3 text-slate-600"><span className="mt-0.5 text-sky-700 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span className="leading-5">{label}</span></div>;
}
