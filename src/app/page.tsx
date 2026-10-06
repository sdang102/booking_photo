'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PublicMotionRoot from '@/components/motion/PublicMotionRoot';
import { FinClosing, FinCraft, FinFooter, FinHero, FinProcess, FinSelectedWorks } from '@/components/FinPhotoSections';
import type { HomepageSection, PortfolioAlbum } from '@/types';
import { getHomepageSections, getPortfolioAlbums } from '@/lib/services/contentService';
import { useAuth } from '@/lib/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAdmin, isPhotographer, isLoading: authLoading } = useAuth();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);

  useEffect(() => {
    if (authLoading || typeof window === 'undefined' || new URLSearchParams(window.location.search).get('preview') === '1') return;
    if (isAdmin) router.replace('/admin');
    else if (isPhotographer) router.replace('/photographer');
  }, [authLoading, isAdmin, isPhotographer, router]);

  useEffect(() => {
    Promise.all([getHomepageSections(), getPortfolioAlbums(true)]).then(([content, portfolio]) => {
      setSections(content);
      setAlbums(portfolio);
    });
  }, []);
  const section = (key: string) => sections.find((item) => item.section_key === key);
  const craft = sections.filter((item) => item.section_key.startsWith('craft_')).map((item) => ({
    title: item.title ?? '', copy: item.subtitle ?? '', image: item.image_url ?? '',
  })).filter((item) => item.title && item.image);

  return <PublicMotionRoot settings={section('motion_settings')}><main id="top" className="public-home fin-site min-h-screen overflow-x-hidden">
    <PublicSiteHeader />
    <FinHero onBook={() => router.push('/services')} />
    <FinCraft items={craft.length ? craft : undefined} />
    <FinSelectedWorks albums={albums} />
    <FinProcess />
    <FinClosing onBook={() => router.push('/booking')} />
    <FinFooter />
  </main></PublicMotionRoot>;
}

