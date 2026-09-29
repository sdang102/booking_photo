'use client';

import Link from 'next/link';
import { BellRing, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  count: number;
  title: string;
  message: string;
  href?: string;
  onOpen?: () => void;
}

export default function BookingAlertToast({ count, title, message, href, onOpen }: Props) {
  const [dismissedCount, setDismissedCount] = useState<number | null>(null);
  if (count < 1 || dismissedCount === count) return null;
  const openNotice = () => { setDismissedCount(count); onOpen?.(); };

  const content = <><span className="booking-notification-pulse grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20"><BellRing className="h-5 w-5"/></span><span className="min-w-0 flex-1 text-left"><strong className="block text-sm">{title}</strong><span className="mt-0.5 block text-[11px] leading-4 text-red-50">{message}</span></span></>;

  return <aside className="booking-alert-pop fixed right-3 top-24 z-[80] flex w-[min(24rem,calc(100vw-1.5rem))] items-start gap-2 rounded-2xl border border-red-300 bg-red-600 p-3 text-white shadow-2xl shadow-red-950/30" role="status" aria-live="polite">
    {href?<Link href={href} onClick={openNotice} className="flex min-w-0 flex-1 items-center gap-3">{content}</Link>:<button type="button" onClick={openNotice} className="flex min-w-0 flex-1 items-center gap-3">{content}</button>}
    <button type="button" onClick={()=>setDismissedCount(count)} aria-label="Đóng thông báo" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-white/15"><X className="h-4 w-4"/></button>
  </aside>;
}
