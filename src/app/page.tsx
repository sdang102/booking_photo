'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import { FinClosing, FinCraft, FinFooter, FinHero, FinProcess, FinSelectedWorks } from '@/components/FinPhotoSections';
import type { HomepageSection } from '@/types';
import { getHomepageSections } from '@/lib/services/contentService';
import { useAuth } from '@/lib/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAdmin, isPhotographer, isLoading: authLoading } = useAuth();
  const [sections, setSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    if (authLoading || typeof window === 'undefined' || new URLSearchParams(window.location.search).get('preview') === '1') return;
    if (isAdmin) router.replace('/admin');
    else if (isPhotographer) router.replace('/photographer');
  }, [authLoading, isAdmin, isPhotographer, router]);

  useEffect(() => {
    getHomepageSections().then(setSections);
  }, []);
  const section = (key: string) => sections.find((item) => item.section_key === key);

  return <PublicMotionRoot settings={section('motion_settings')}><main id="top" className="public-home fin-site min-h-screen overflow-x-hidden">
    <PublicSiteHeader />
    <FinHero onBook={() => router.push('/services')} />
    <FinCraft />
    <FinSelectedWorks />
    <FinProcess />
    <FinClosing onBook={() => router.push('/booking')} />
    <FinFooter />
  </main></PublicMotionRoot>;
}

