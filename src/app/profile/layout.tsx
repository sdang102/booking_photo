import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ tài khoản',
  robots: { index: false, follow: false, nocache: true },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
