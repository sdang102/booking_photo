import type { BookingStatus } from '@/types';
const LABEL:Record<BookingStatus,string>={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',checked_in:'Khách đã đến',shooting:'Đang chụp',completed:'Hoàn thành',cancelled:'Đã hủy'};
const STYLE:Record<BookingStatus,string>={pending:'bg-amber-50 text-amber-800 border-amber-200',confirmed:'bg-blue-50 text-blue-800 border-blue-200',checked_in:'bg-teal-50 text-teal-800 border-teal-200',shooting:'bg-sky-100 text-sky-800 border-sky-300',completed:'bg-emerald-50 text-emerald-800 border-emerald-200',cancelled:'bg-rose-50 text-rose-800 border-rose-200'};
export default function BookingStatusBadge({status}:{status:BookingStatus}){return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${STYLE[status]}`}>{LABEL[status]}</span>}
export { LABEL as BOOKING_STATUS_LABEL };
