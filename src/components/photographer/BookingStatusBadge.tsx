import type { BookingStatus } from '@/types';

const LABEL:Record<BookingStatus,string>={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',checked_in:'Khách đã đến',shooting:'Đang chụp',completed:'Hoàn thành',cancelled:'Đã hủy'};

export default function BookingStatusBadge({status}:{status:BookingStatus}){
  return <span className={`workspace-status workspace-status--${status}`}>{LABEL[status]}</span>;
}

export { LABEL as BOOKING_STATUS_LABEL };
