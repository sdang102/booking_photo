import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lịch đã đặt',
  robots: { index: false, follow: false, nocache: true },
};

export default function MyBookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
