'use client';

import { useEffect, useRef } from 'react';
import type { HomepageSection } from '@/types';

export default function PublicMotionRoot({ settings, children }: { settings?: HomepageSection; children: React.ReactNode }) {
  const content = settings?.content ?? {};
  const progressEnabled = content.progress_enabled !== false;
  const grainEnabled = content.grain_enabled === true;
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    document.documentElement.classList.remove('motion-ready');

    let progressFrame = 0;

    const updateProgress = () => {
      if (progressFrame) return;
      progressFrame = window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        progressFrame = 0;
      });
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
      if (progressFrame) window.cancelAnimationFrame(progressFrame);
    };
  }, []);

  return (
    <div ref={root} className={`public-motion-root ${grainEnabled ? 'motion-grain' : ''}`}>
      {progressEnabled && <div ref={progress} className="motion-progress" aria-hidden="true" />}
      {children}
    </div>
  );
}
