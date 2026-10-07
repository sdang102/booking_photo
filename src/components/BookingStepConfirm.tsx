import { CheckCircle2 } from 'lucide-react';
import type { Service } from '@/types';
import { formatVND } from './ServiceCard';
import { StepTitle } from './BookingWizardFields';

export default function BookingStepConfirm({ service, date, time, selectedShift, address, name, phone, email, total }: {
  service?: Service;
  date: string;
  time: string;
  selectedShift?: { label: string };
  address: string;
  name: string;
  phone: string;
  email: string;
  total: number;
}) {
  return <div>
    <StepTitle icon={<CheckCircle2 />} title="Kiểm tra trước khi gửi" copy="Bạn chưa phải thanh toán ở bước này. Chúng tôi sẽ liên hệ xác nhận lịch với bạn." />
    <dl className="mt-6 divide-y divide-sky-100 rounded-2xl border border-sky-200 bg-slate-50 p-5 text-sm sm:text-base">{[
      ['Gói chụp', service?.title], ['Ngày & ca', `${date.split('-').reverse().join('/')} · ${selectedShift?.label || time} (${time})`], ['Địa điểm', address], ['Khách hàng', name], ['Liên hệ', `${phone} · ${email}`], ['Chi phí dự kiến', formatVND(total)], ['Thanh toán', 'Thanh toán tại buổi chụp'],
    ].map(([key, value]) => <div key={key} className="flex justify-between gap-5 py-3 first:pt-0 last:pb-0"><dt className="shrink-0 text-slate-500">{key}</dt><dd className="max-w-md text-right font-bold text-slate-900">{value}</dd></div>)}</dl>
  </div>;
}
