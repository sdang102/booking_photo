import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
  robots: { index: false, follow: false, nocache: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
