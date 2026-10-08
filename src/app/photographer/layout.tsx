import PhotographerShell from '@/components/photographer/PhotographerShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PhotographerLayout({children}:{children:React.ReactNode}){return <PhotographerShell>{children}</PhotographerShell>}
