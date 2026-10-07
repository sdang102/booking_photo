import { Mail, MapPin, Phone, User } from 'lucide-react';
import { Field, StepTitle } from './BookingWizardFields';

export default function BookingStepCustomer({
  address,
  name,
  phone,
  email,
  notes,
  setAddress,
  setName,
  setPhone,
  setEmail,
  setNotes,
  clearError,
}: {
  address: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  setAddress: (value: string) => void;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
  setEmail: (value: string) => void;
  setNotes: (value: string) => void;
  clearError: () => void;
}) {
  return <div>
    <StepTitle icon={<User />} title="Thông tin buổi chụp" copy="Cho chúng tôi biết nơi chụp và cách liên hệ. Thông tin tài khoản đã được điền sẵn để bạn thao tác nhanh hơn." />
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold text-slate-700 sm:col-span-2">Địa điểm chụp <span className="text-rose-600" aria-hidden="true">*</span><div className="relative mt-2"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 [&>svg]:h-4 [&>svg]:w-4"><MapPin /></span><input autoFocus required value={address} onChange={(event) => { setAddress(event.target.value); clearError(); }} placeholder="Ví dụ: Thảo Cầm Viên, Quận 1, TP.HCM" className="booking-input booking-input-icon" /></div></label>
      <Field label="Họ và tên" icon={<User />} placeholder="Nguyễn Văn A" value={name} setValue={setName} />
      <Field label="Số điện thoại / Zalo" icon={<Phone />} placeholder="09xx xxx xxx" value={phone} setValue={setPhone} type="tel" />
      <div className="sm:col-span-2"><Field label="Email" icon={<Mail />} placeholder="ban@example.com" value={email} setValue={setEmail} type="email" /></div>
      <label className="block text-sm font-bold text-slate-700 sm:col-span-2">Mong muốn cho bộ ảnh <span className="font-normal text-slate-500">(không bắt buộc)</span><textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Phong cách, trang phục hoặc điều bạn muốn chúng tôi lưu ý..." className="booking-input mt-2 min-h-24 resize-none" /></label>
    </div>
  </div>;
}
