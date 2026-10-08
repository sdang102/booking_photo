'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, Clock, MapPin, PackageOpen, Sparkles, X } from 'lucide-react';
import type { AvailabilityBlock, BookingFormData, BookingPhotoRecord, PublicScheduleItem, Service } from '@/types';
import { createBookingPhoto, getAvailabilityBlocks, hasOperationalPhotographer } from '@/lib/services/bookingService';
import { getReliablePublicSchedule } from '@/lib/services/reliableBookingReadService';
import { useAuth } from '@/lib/context/AuthContext';
import { formatVND } from './ServiceCard';
import { normalizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '@/lib/phone';
import { BOOKING_SHIFTS, isRangeAvailable } from '@/lib/bookingAvailability';
import BookingStepSchedule from './BookingStepSchedule';
import BookingStepCustomer from './BookingStepCustomer';
import BookingStepConfirm from './BookingStepConfirm';
import BookingModalShell from './BookingModalShell';
import { SummaryRow } from './BookingWizardFields';

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
  const [availabilityError, setAvailabilityError] = useState('');
  const [operationalStatus, setOperationalStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingPhotoRecord | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState(() => {
    if (!initialServiceId) return services[0]?.id || '';
    return services.find((item) => item.id === initialServiceId || item.slug === initialServiceId)?.id || '';
  });
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const servicePickerRef = useRef<HTMLDivElement>(null);

  const service = useMemo(() => services.find((item) => item.id === selectedServiceId), [selectedServiceId, services]);
  const invalidRequestedService = Boolean(initialServiceId && !services.some((item) => item.id === initialServiceId || item.slug === initialServiceId) && !selectedServiceId);
  const total = service?.price || 0;
  const selectedShift = BOOKING_SHIFTS.find((shift) => shift.range === time);
  const availableShifts = date ? BOOKING_SHIFTS.filter((shift) => isRangeAvailable(date, shift.range, calendarBookings, availabilityBlocks)) : [];

  const refreshAvailability = async () => {
    setAvailabilityLoading(true);
    setAvailabilityError('');
    try {
      const [bookings, blocks] = await Promise.all([getReliablePublicSchedule(), getAvailabilityBlocks()]);
      setCalendarBookings(bookings);
      setAvailabilityBlocks(blocks);
    } catch {
      setAvailabilityError('Không thể tải lịch trống. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const refreshOperationalStatus = async () => {
    setOperationalStatus('checking');
    try {
      setOperationalStatus(await hasOperationalPhotographer() ? 'available' : 'unavailable');
    } catch {
      setOperationalStatus('error');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.all([getReliablePublicSchedule(), getAvailabilityBlocks()]).then(([bookings, blocks]) => {
      if (!active) return;
      setCalendarBookings(bookings);
      setAvailabilityBlocks(blocks);
    }).catch(() => {
      if (!active) return;
      setAvailabilityError('Không thể tải lịch trống. Vui lòng kiểm tra kết nối và thử lại.');
    }).finally(() => { if (active) setAvailabilityLoading(false); });
    hasOperationalPhotographer().then((hasPhotographer) => {
      if (active) setOperationalStatus(hasPhotographer ? 'available' : 'unavailable');
    }).catch(() => { if (active) setOperationalStatus('error'); });
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
  }, [isOpen, services, user]);

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
    try {
      const hasPhotographer = await hasOperationalPhotographer();
      setOperationalStatus(hasPhotographer ? 'available' : 'unavailable');
      if (!hasPhotographer) {
        setSubmitting(false);
        setError('Hiện chưa có thợ chụp sẵn sàng tiếp nhận lịch. Vui lòng quay lại sau hoặc liên hệ FIN PHOTO để được hỗ trợ.');
        return;
      }
    } catch {
      setSubmitting(false);
      setOperationalStatus('error');
      setError('Chưa thể kiểm tra khả năng tiếp nhận lịch. Vui lòng thử lại sau ít phút.');
      return;
    }
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

  return <>
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
      <BookingModalShell
        variant={variant}
        step={step}
        onClose={closeWizard}
        onBack={() => { setError(''); if (step === 1) closeWizard(); else setStep(step - 1); }}
        onNext={step < 3 ? next : submit}
        nextDisabled={step < 3 ? step === 1 && (availabilityLoading || Boolean(availabilityError)) : submitting || !service || operationalStatus !== 'available'}
        showNextIcon={step < 3}
        nextLabel={step < 3 ? (step === 1 && availabilityLoading ? 'Đang kiểm tra lịch…' : step === 1 ? 'Điền thông tin' : 'Kiểm tra lịch') : (submitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch')}
        aside={<aside className="hidden border-l border-sky-100 bg-slate-50 p-6 lg:block">
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
              </aside>}
      >
        <div className="mb-5 space-y-3">
          <label className="block text-sm font-bold text-slate-700 lg:hidden">Gói chụp
            <select value={selectedServiceId} onChange={(event) => { setSelectedServiceId(event.target.value); setError(''); }} className="booking-input mt-2">
              <option value="" disabled>Chọn một gói chụp</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.title} · {formatVND(item.price)}</option>)}
            </select>
          </label>
          {invalidRequestedService && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Gói chụp trong liên kết không tồn tại hoặc không còn hoạt động. Vui lòng chọn một gói khác.</p>}
          {availabilityError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800"><span>{availabilityError}</span><button type="button" onClick={() => void refreshAvailability()} className="font-bold underline">Thử lại</button></div>}
          {operationalStatus === 'unavailable' && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Hiện chưa có thợ chụp sẵn sàng tiếp nhận booking mới. Bạn có thể xem thông tin gói nhưng chưa thể gửi yêu cầu.</p>}
          {operationalStatus === 'error' && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800"><span>Không thể kiểm tra trạng thái tiếp nhận booking.</span><button type="button" onClick={() => void refreshOperationalStatus()} className="font-bold underline">Thử lại</button></div>}
        </div>
        {step === 1 && <BookingStepSchedule date={date} time={time} bookings={calendarBookings} blocks={availabilityBlocks} loading={availabilityLoading} availableShifts={availableShifts} onDateChange={(value) => { setDate(value); setTime(''); setError(''); }} onTimeChange={(value) => { setTime(value); setError(''); }} />}
        {step === 2 && <BookingStepCustomer address={address} name={name} phone={phone} email={email} notes={notes} setAddress={(value) => { setAddress(value); setError(''); }} setName={setName} setPhone={setPhone} setEmail={setEmail} setNotes={setNotes} clearError={() => setError('')} />}
        {step === 3 && <BookingStepConfirm service={service} date={date} time={time} selectedShift={selectedShift} address={address} name={name} phone={phone} email={email} total={total} />}
      </BookingModalShell>
  </>;
}
