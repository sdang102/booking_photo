'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import type { HomepageSection } from '@/types';
import { useAuth } from '@/lib/context/AuthContext';

export default function HomePageClient({ settings, children }: { settings?: HomepageSection; children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, isPhotographer, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || typeof window === 'undefined' || new URLSearchParams(window.location.search).get('preview') === '1') return;
    if (isAdmin) router.replace('/admin');
    else if (isPhotographer) router.replace('/photographer');
  }, [authLoading, isAdmin, isPhotographer, router]);

  return <PublicMotionRoot settings={settings}><main id="top" className="public-home fin-site min-h-screen overflow-x-hidden">{children}</main></PublicMotionRoot>;
}
