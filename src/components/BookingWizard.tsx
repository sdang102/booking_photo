'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone, User, X } from 'lucide-react';
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

const STEP_LABELS = ['Chọn gói', 'Ngày & giờ', 'Địa điểm', 'Thông tin', 'Xác nhận'];

export default function BookingWizard({ isOpen, onClose, services, initialServiceId, onBookingSuccess }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(initialServiceId || '');
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
  }, [isOpen]);

  const effectiveServiceId = serviceId || initialServiceId || services[0]?.id || '';
  const service = useMemo(() => services.find((item) => item.id === effectiveServiceId) || services[0], [effectiveServiceId, services]);
  const locationFee = 0;
  const total = (service?.price || 0) + locationFee;
  const availableShifts = date
    ? BOOKING_SHIFTS.filter((shift) => isRangeAvailable(date, shift.range, calendarBookings, availabilityBlocks))
    : [];
  if (!isOpen) return null;

  const next = () => {
    setError('');
    if (step === 1 && !effectiveServiceId) return setError('Vui lòng chọn gói chụp.');
    if (step === 2) {
      if (!date) return setError('Vui lòng chọn ngày chụp.');
      if (!time) return setError('Vui lòng chọn một trong các ca còn trống.');
      if (!isRangeAvailable(date, time, calendarBookings, availabilityBlocks)) return setError('Ca này vừa có người giữ chỗ, đã bị thợ khóa hoặc ngày đã đủ 2 booking. Vui lòng chọn ca khác.');
    }
    if (step === 3 && address.trim().length < 5) return setError('Vui lòng nhập địa chỉ chụp ngoại cảnh cụ thể.');
    if (step === 4 && (!name.trim() || !email.includes('@'))) return setError('Vui lòng nhập đầy đủ họ tên và email hợp lệ.');
    if (step === 4 && !normalizeVietnameseMobile(phone)) return setError(VIETNAMESE_MOBILE_ERROR);
    setStep((value) => Math.min(5, value + 1));
  };

  const submit = async () => {
    if (!service) return;
    setSubmitting(true); setError('');
    const normalizedPhone = normalizeVietnameseMobile(phone);
    if (!normalizedPhone) { setSubmitting(false); setError(VIETNAMESE_MOBILE_ERROR); return; }
    const payload: BookingFormData = { customer_name: name.trim(), customer_phone: normalizedPhone, customer_email: email.trim(), service_id: service.id, service_title: service.title, booking_date: date, booking_time: time, location_type: 'outdoor', shoot_address:address.trim(), notes, addon_services: [], total_price: total, user_id: user?.id };
    const result = await createBookingPhoto(payload);
    setSubmitting(false);
    if (result.success && result.data) { setSuccess(result.data); onBookingSuccess(result.data); }
    else { await refreshAvailability(); setError(result.message || 'Không thể tạo booking. Vui lòng thử lại.'); }
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md sm:items-center sm:p-4" onMouseDown={(event)=>event.target===event.currentTarget&&onClose()}><div className="auth-dialog flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-sky-200 bg-white shadow-2xl sm:rounded-3xl">
    <header className="flex items-center justify-between border-b border-sky-200 p-5 sm:p-6"><div><span className="section-kicker">Đặt lịch online</span><h2 className="mt-1 text-xl font-black text-slate-900">Đặt Lịch Chụp Cùng S. Đặng</h2></div><button onClick={onClose} className="h-9 w-9 rounded-xl bg-slate-100 p-2"><X/></button></header>
    {success ? <div className="p-8 text-center sm:p-14"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500"/><h3 className="mt-5 text-2xl font-black text-slate-900">Đặt lịch thành công!</h3><p className="mt-2 text-sm text-slate-600">Mã booking: <strong>PHOT-{success.id.slice(-8).toUpperCase()}</strong></p><p className="mt-1 text-sm text-slate-600">Tôi sẽ liên hệ xác nhận lịch. Bạn thanh toán toàn bộ tại nơi chụp, không cần đặt cọc.</p><button onClick={onClose} className="sky-button mt-7 rounded-xl px-7 py-3">Hoàn tất</button></div> : <>
      <div className="border-b border-sky-100 px-4 py-4 sm:px-6"><div className="flex items-start justify-between gap-1">{STEP_LABELS.map((label,index)=>{const number=index+1;return <div key={label} className="flex min-w-0 flex-1 flex-col items-center"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${step>=number?'bg-sky-600 text-white':'bg-slate-100 text-slate-400'}`}>{step>number?<Check className="h-4 w-4"/>:number}</span><span className="mt-1 hidden text-[9px] font-semibold text-slate-500 sm:block">{label}</span></div>})}</div></div>
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        {error&&<div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
        {step===1&&<div><StepTitle icon={<Camera/>} title="Chọn gói chụp" copy="Chọn gói phù hợp nhất với nhu cầu của bạn."/><div className="mt-6 grid gap-3 sm:grid-cols-2">{services.map((item)=><button key={item.id} onClick={()=>setServiceId(item.id)} className={`rounded-2xl border p-4 text-left ${effectiveServiceId===item.id?'border-sky-500 bg-sky-50 ring-2 ring-sky-100':'border-sky-200'}`}><h4 className="text-sm font-bold text-slate-900">{item.title}</h4><p className="mt-2 text-sm font-black text-sky-700">{formatVND(item.price)}</p></button>)}</div></div>}
        {step===2&&<div><StepTitle icon={<Calendar/>} title="Chọn ngày & ca chụp" copy="Mỗi ngày có ba ca sáng, chiều, tối và chỉ nhận tối đa hai booking."/><BookingCalendar selectedDate={date} bookings={calendarBookings} blocks={availabilityBlocks} loading={availabilityLoading} onSelect={(value)=>{setDate(value);setTime('');setError('')}}/>{date&&<section className="mx-auto mt-5 max-w-xl rounded-2xl border border-sky-200 bg-white p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><Clock className="h-4 w-4"/></span><div><h4 className="text-sm font-black text-slate-900">Ca còn trống ngày {date.split('-').reverse().join('/')}</h4><p className="text-[11px] text-slate-500">Ngày đủ hai booking sẽ tự động khóa.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{availableShifts.map((shift)=><button type="button" key={shift.id} onClick={()=>{setTime(shift.range);setError('')}} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold ${time===shift.range?'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-100':'border-sky-200 text-slate-700'}`}><span className="block">{shift.label}</span><span className="mt-1 block text-[9px] font-normal text-slate-500">{shift.range}</span></button>)}</div>{availableShifts.length===0&&<p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Ngày này đã hết ca hoặc đã đủ tối đa hai booking.</p>}</section>}</div>}
        {step===3&&<div><StepTitle icon={<MapPin/>} title="Địa chỉ chụp ngoại cảnh" copy="Nhập địa chỉ cụ thể để thợ chuẩn bị lộ trình và có mặt đúng giờ."/><label className="mt-6 block text-sm font-bold text-slate-700">Địa chỉ cần chụp<div className="relative mt-2"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sky-600"><MapPin className="h-5 w-5"/></span><input required value={address} onChange={(event)=>{setAddress(event.target.value);setError('')}} placeholder="Ví dụ: Công viên Bến Bạch Đằng, Quận 1, TP.HCM" className="booking-input booking-input-icon"/></div></label><p className="mt-3 text-xs leading-5 text-slate-500">Hệ thống hiện chỉ nhận lịch chụp ngoại cảnh, không có lựa chọn studio.</p></div>}
        {step===4&&<div><StepTitle icon={<User/>} title="Thông tin của bạn" copy="Tôi sẽ dùng thông tin này để xác nhận lịch chụp."/><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field icon={<User/>} placeholder="Họ và tên" value={name} setValue={setName}/><Field icon={<Phone/>} placeholder="Số điện thoại" value={phone} setValue={setPhone} type="tel"/><div className="sm:col-span-2"><Field icon={<Mail/>} placeholder="Email" value={email} setValue={setEmail} type="email"/></div><textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Ghi chú hoặc concept mong muốn" className="booking-input min-h-24 sm:col-span-2"/></div></div>}
        {step===5&&<div><StepTitle icon={<CheckCircle2/>} title="Xác nhận booking" copy="Kiểm tra lại thông tin trước khi gửi yêu cầu."/><dl className="mt-6 divide-y divide-sky-100 rounded-2xl border border-sky-200 bg-slate-50 p-5 text-sm">{[['Gói',service?.title],['Ngày',date],['Ca chụp',BOOKING_SHIFTS.find((shift)=>shift.range===time)?.label||time],['Giờ',time],['Địa chỉ',address],['Giá gói',formatVND(service?.price||0)],['Tổng',formatVND(total)],['Thanh toán','Thanh toán toàn bộ tại nơi chụp']].map(([key,value])=><div key={key} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"><dt className="text-slate-500">{key}</dt><dd className="text-right font-bold text-slate-900">{value}</dd></div>)}</dl></div>}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-sky-200 p-4 sm:px-6"><button onClick={()=>{setError('');if(step===1)onClose();else setStep(step-1)}} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-3 text-sm font-bold text-slate-600"><ChevronLeft className="h-4 w-4"/>{step===1?'Đóng':'Quay lại'}</button>{step<5?<button onClick={next} className="sky-button inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">Tiếp tục<ChevronRight className="h-4 w-4"/></button>:<button onClick={submit} disabled={submitting} className="sky-button rounded-xl px-5 py-3 text-sm disabled:opacity-60">{submitting?'Đang gửi...':'Xác Nhận Đặt Lịch'}</button>}</footer>
    </>}
  </div></div>;
}

function StepTitle({icon,title,copy}:{icon:React.ReactNode;title:string;copy:string}) { return <div><span className="text-sky-600 [&>svg]:h-6 [&>svg]:w-6">{icon}</span><h3 className="mt-3 text-xl font-black text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-600">{copy}</p></div>; }
function Field({icon,placeholder,value,setValue,type='text'}:{icon:React.ReactNode;placeholder:string;value:string;setValue:(value:string)=>void;type?:string}) { return <label className="relative block"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><input type={type} inputMode={type==='tel'?'tel':undefined} autoComplete={type==='tel'?'tel':undefined} maxLength={type==='tel'?20:undefined} value={value} onChange={(e)=>setValue(e.target.value)} onBlur={()=>{if(type==='tel'){const normalized=normalizeVietnameseMobile(value);if(normalized)setValue(normalized)}}} placeholder={placeholder} className="booking-input booking-input-icon"/></label>; }

