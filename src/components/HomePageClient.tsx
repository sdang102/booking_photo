'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import { FinClosing, FinCraft, FinHero, FinProcess, FinSelectedWorks } from '@/components/FinPhotoSections';
import type { HomepageSection, PortfolioAlbum } from '@/types';
import { useAuth } from '@/lib/context/AuthContext';

export default function HomePageClient({ sections, albums }: { sections: HomepageSection[]; albums: PortfolioAlbum[] }) {
  const router = useRouter();
  const { isAdmin, isPhotographer, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || typeof window === 'undefined' || new URLSearchParams(window.location.search).get('preview') === '1') return;
    if (isAdmin) router.replace('/admin');
    else if (isPhotographer) router.replace('/photographer');
  }, [authLoading, isAdmin, isPhotographer, router]);

  const section = (key: string) => sections.find((item) => item.section_key === key);
  const craft = sections.filter((item) => item.section_key.startsWith('craft_')).map((item) => ({
    title: item.title ?? '', copy: item.subtitle ?? '', image: item.image_url ?? '',
  })).filter((item) => item.title && item.image);

  return <PublicMotionRoot settings={section('motion_settings')}><main id="top" className="public-home fin-site min-h-screen overflow-x-hidden">
    <FinHero onBook={() => router.push('/services')} />
    <FinCraft items={craft.length ? craft : undefined} />
    <FinSelectedWorks albums={albums} />
    <FinProcess />
    <FinClosing onBook={() => router.push('/booking')} />
  </main></PublicMotionRoot>;
}
