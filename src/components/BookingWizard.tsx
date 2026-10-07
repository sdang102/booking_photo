'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Info, Mail, MapPin, PackageOpen, Phone, Sparkles, Sun, Sunset, User, X } from 'lucide-react';
import type { AvailabilityBlock, BookingFormData, BookingPhotoRecord, PublicScheduleItem, Service } from '@/types';
import { createBookingPhoto, getAvailabilityBlocks, getPublicSchedule } from '@/lib/services/bookingService';
import { useAuth } from '@/lib/context/AuthContext';
import { formatVND } from './ServiceCard';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import { BOOKING_SHIFTS, isRangeAvailable, rangesOverlap } from '@/lib/bookingAvailability';
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

const BOOKING_DRAFT_KEY = 'fin-photo-booking-draft-v1';

function saveBookingDraft(draft: Record<string, unknown>) {
  try { sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft)); } catch { /* Storage can be unavailable in private browsing. */ }
}

function clearBookingDraft() {
  try { sessionStorage.removeItem(BOOKING_DRAFT_KEY); } catch { /* Ignore storage cleanup failures. */ }
}

async function safeCreateBooking(payload: BookingFormData) {
  try {
    const result = await createBookingPhoto(payload);
    if (!result.success && result.message && /booking:/i.test(result.message)) {
      return { ...result, message: 'Không thể lưu yêu cầu lúc này. Vui lòng kiểm tra lại lịch và thử lại.' };
    }
    return result;
  } catch {
    return { success: false, message: 'Không thể kết nối để gửi yêu cầu. Vui lòng thử lại sau ít phút.' };
  }
}

const STEP_LABELS = ['Chọn lịch', 'Thông tin', 'Kiểm tra'];
const SHIFT_PRESENTATION = {
  morning: { title: 'Buổi Sáng', copy: 'Ánh sáng tự nhiên dịu êm', badge: 'Còn chỗ', icon: Sun },
  afternoon: { title: 'Buổi Chiều', copy: 'Ánh sáng khối tương phản sâu', badge: 'Khuyên dùng', icon: Sun },
  evening: { title: 'Hoàng Hôn & Tối', copy: 'Chuyển sắc rực rỡ và đèn nghệ thuật', badge: 'Golden Hour', icon: Sunset },
} as const;

export default function BookingWizard({ isOpen, onClose, services, initialServiceId, initialDate, onBookingSuccess, onOpenAuth, variant = 'modal' }: Props) {
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
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || services[0]?.id || '');
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const servicePickerRef = useRef<HTMLDivElement>(null);

  const service = useMemo(() => services.find((item) => item.id === selectedServiceId) ?? services[0], [selectedServiceId, services]);
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

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      if (typeof draft.serviceId === 'string' && services.some((item) => item.id === draft.serviceId)) setSelectedServiceId(draft.serviceId);
      if (typeof draft.date === 'string') setDate(draft.date);
      if (typeof draft.time === 'string') setTime(draft.time);
      if (typeof draft.address === 'string') setAddress(draft.address);
      if (typeof draft.name === 'string') setName(draft.name);
      if (typeof draft.phone === 'string') setPhone(draft.phone);
      if (typeof draft.email === 'string') setEmail(draft.email);
      if (typeof draft.notes === 'string') setNotes(draft.notes);
      if (draft.step === 3) setStep(3);
    } catch { /* Ignore malformed or unavailable drafts. */ }
  }, [isOpen, services]);

  useEffect(() => {
    if (!isOpen || variant === 'page') return;
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
  }, [isOpen, variant]);

  useEffect(() => {
    if (!servicePickerOpen) return;
    const closePicker = (event: PointerEvent) => {
      if (!servicePickerRef.current?.contains(event.target as Node)) setServicePickerOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setServicePickerOpen(false); };
    document.addEventListener('pointerdown', closePicker);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closePicker);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [servicePickerOpen]);

  if (!isOpen) return null;

  const closeWizard = () => {
    clearBookingDraft();
    setStep(1); setError(''); setSuccess(null); setDate(''); setTime(''); setAddress(''); setNotes('');
    setName(user?.full_name || ''); setPhone(user?.phone || ''); setEmail(user?.email || '');
    onClose();
  };

  const notice = error
    ? { type: 'error' as const, eyebrow: 'Chưa thể tiếp tục', title: 'Vui lòng kiểm tra lại', message: error, action: 'Đã hiểu' }
    : success
      ? { type: 'success' as const, eyebrow: 'Đặt lịch thành công', title: 'Yêu cầu đã được gửi!', message: `Mã lịch: PHOT-${success.id.slice(-8).toUpperCase()}. Trạng thái: chờ xác nhận. Chúng tôi sẽ liên hệ để xác nhận lịch và tư vấn concept phù hợp với bạn.`, action: 'Hoàn tất' }
      : null;

  const closeNotice = () => {
    if (success) closeWizard();
    else setError('');
  };

  const next = () => {
    setError('');
    if (!service) return setError('Gói chụp đang được tải. Vui lòng thử lại sau giây lát.');
    if (step === 1) {
      if (availabilityLoading) return setError('Đang kiểm tra lịch trống. Vui lòng đợi một chút.');
      if (!date) return setError('Vui lòng chọn ngày chụp.');
      if (!time) return setError('Vui lòng chọn một ca còn trống.');
      if (!isRangeAvailable(date, time, calendarBookings, availabilityBlocks)) return setError('Ca này vừa có người giữ chỗ. Vui lòng chọn ca khác.');
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Vui lòng nhập email hợp lệ.');
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
    if (!user) {
      saveBookingDraft({ serviceId: service.id, date, time, address, name, phone: normalizedPhone, email, notes, step: 3 });
      setError('Bạn đã điền xong thông tin. Vui lòng đăng nhập hoặc đăng ký để gửi yêu cầu đặt lịch.');
      onOpenAuth?.();
      return;
    }
    setSubmitting(true); setError('');
    const payload: BookingFormData = {
      customer_name: name.trim(), customer_phone: normalizedPhone, customer_email: email.trim(),
      service_id: service.id, service_title: service.title, booking_date: date, booking_time: time,
      location_type: 'outdoor', shoot_address: address.trim(), notes, addon_services: [], total_price: total, user_id: user?.id,
    };
    const result = await safeCreateBooking(payload);
    setSubmitting(false);
    if (result.success && result.data) { setSuccess(result.data); onBookingSuccess(result.data); }
    else { await refreshAvailability(); setError(result.message || 'Không thể tạo booking. Vui lòng thử lại.'); }
  };

  return (
    <div className={variant === 'page' ? 'booking-page-embed' : 'booking-backdrop fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 sm:items-center sm:p-4'} onMouseDown={(event) => variant === 'modal' && event.target === event.currentTarget && closeWizard()}>
      {notice && createPortal(<div className="booking-error-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeNotice()}>
        <section className={`booking-error-dialog is-${notice.type}`} role="alertdialog" aria-modal="true" aria-labelledby="booking-notice-title" aria-describedby="booking-notice-message">
          <button type="button" className="booking-error-dialog__close" onClick={closeNotice} aria-label="Đóng thông báo"><X /></button>
          <span className="booking-error-dialog__icon">{notice.type === 'success' ? <CheckCircle2 /> : <AlertTriangle />}</span>
          <p>{notice.eyebrow}</p>
          <h3 id="booking-notice-title">{notice.title}</h3>
          <div id="booking-notice-message">{notice.message}</div>
          <button type="button" className="booking-error-dialog__action" onClick={closeNotice} autoFocus>{notice.action}</button>
        </section>
      </div>, document.body)}
      <div className="booking-dialog auth-dialog flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-sky-200 bg-elevated shadow-2xl sm:rounded-3xl">
        <header className="booking-dialog__head flex items-start justify-between gap-4 border-b border-sky-200 p-4 sm:px-7 sm:py-5">
          <div><span className="section-kicker">Đặt lịch trực tuyến · Chỉ khoảng 2 phút</span><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Đặt buổi chụp của bạn</h2></div>
          <button type="button" onClick={closeWizard} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100" aria-label="Đóng cửa sổ đặt lịch"><X className="h-5 w-5" /></button>
        </header>

        <>
            <div className="border-b border-sky-100 px-4 py-3 sm:px-7">
              <div className="booking-step-progress flex items-center gap-2" aria-label={`Bước ${step} trên 3`}>
                {STEP_LABELS.map((label, index) => { const number = index + 1; return <div key={label} className="flex min-w-0 flex-1 items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${step >= number ? 'bg-brand text-brand-contrast' : 'bg-slate-100 text-slate-400'}`}>{step > number ? <Check className="h-4 w-4" /> : number}</span><span className={`truncate text-xs font-bold sm:text-sm ${step >= number ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>{number < 3 && <span className="ml-auto h-px w-full max-w-12 bg-sky-200" />}</div>; })}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_18rem]">
              <div className={`booking-content ${variant === 'page' ? 'booking-content--page' : 'overflow-y-auto'} p-4 sm:p-7`}>
                {step === 1 && <div className="booking-schedule-step">
                  <header className="booking-schedule-heading"><span>Phần 02</span><i>/</i><h3>Ngày Thực Hiện &amp; Khung Giờ Ánh Sáng</h3></header>
                  <div className="booking-schedule-grid">
                    <BookingCalendar selectedDate={date} bookings={calendarBookings} blocks={availabilityBlocks} loading={availabilityLoading} onSelect={(value) => { setDate(value); setTime(''); setError(''); }} />
                    <section className="booking-light-slots" aria-label="Chọn khung giờ chụp">
                      <h4>Khung giờ quang học</h4>
                      <div>{BOOKING_SHIFTS.map((shift) => {
                        const available = Boolean(date) && availableShifts.some((item) => item.id === shift.id);
                        const blockedByPhotographer = Boolean(date) && availabilityBlocks.some((block) => block.date === date && rangesOverlap(shift.range, `${block.start_time} - ${block.end_time}`));
                        const selected = time === shift.range;
                        const presentation = SHIFT_PRESENTATION[shift.id];
                        const ShiftIcon = presentation.icon;
                        return <button type="button" key={shift.id} disabled={!available} onClick={() => { setTime(shift.range); setError(''); }} className={`${selected ? 'is-selected' : ''} ${available ? 'is-available' : blockedByPhotographer ? 'is-blocked' : 'is-unavailable'}`}>
                          <span className="booking-light-slots__title"><ShiftIcon /><strong>{presentation.title}</strong><b>{selected ? 'Đã chọn' : available ? presentation.badge : blockedByPhotographer ? 'Thợ đã chặn' : date ? 'Hết lịch' : 'Chọn ngày'}</b></span>
                          <span className="booking-light-slots__copy">{shift.range} <i>•</i> {presentation.copy}</span>
                        </button>;
                      })}</div>
                      <p className="booking-light-slots__notice"><Info />Mỗi khung giờ chỉ nhận tối đa 01 khách hàng độc quyền tại sảnh.</p>
                      {date && !availableShifts.length && <p className="booking-light-slots__empty">Ngày này đã hết lịch. Vui lòng chọn ngày khác.</p>}
                    </section>
                  </div>
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
                <div className={`booking-service-picker ${servicePickerOpen ? 'is-open' : ''}`} ref={servicePickerRef}>
                  <span>Chọn gói chụp</span>
                  <button type="button" className="booking-service-picker__trigger" onClick={() => setServicePickerOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={servicePickerOpen}>
                    <PackageOpen />
                    <span><strong>{service?.title ?? 'Chọn một gói chụp'}</strong><small>{service ? formatVND(service.price) : '—'}</small></span>
                    <ChevronDown className="booking-service-picker__chevron" />
                  </button>
                  {servicePickerOpen && <div className="booking-service-picker__menu" role="listbox" aria-label="Danh sách gói chụp">
                    {services.map((item, index) => {
                      const selected = item.id === service?.id;
                      return <button type="button" key={item.id} role="option" aria-selected={selected} className={selected ? 'is-selected' : ''} onClick={() => { setSelectedServiceId(item.id); setServicePickerOpen(false); }}>
                        <span><small>Gói {String(index + 1).padStart(2, '0')}</small><strong>{item.title}</strong><b>{formatVND(item.price)}</b></span>
                        <i>{selected ? <Check /> : <ChevronRight />}</i>
                      </button>;
                    })}
                  </div>}
                </div>
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
              {step < 3 ? <button onClick={next} disabled={step === 1 && availabilityLoading} className="sky-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm disabled:cursor-wait disabled:opacity-60">{step === 1 && availabilityLoading ? 'Đang kiểm tra lịch…' : step === 1 ? 'Điền thông tin' : 'Kiểm tra lịch'}<ChevronRight className="h-4 w-4" /></button> : <button onClick={submit} disabled={submitting || !service} className="sky-button rounded-xl px-5 py-3 text-sm disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}</button>}
            </footer>
        </>
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
