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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealTargets = Array.from(scope.querySelectorAll<HTMLElement>([
      '[data-reveal]',
      '.fin-hero__content > *', '.fin-stats > *', '.fin-heading > *',
      '.fin-craft article', '.fin-work', '.fin-process li', '.fin-project',
      '.fin-services-plans article', '.fin-extras article',
      '.fin-about-hero__copy > *', '.fin-about-hero figure',
      '.fin-about-statement > .fin-shell > *', '.fin-about-profile figure', '.fin-about-profile > .fin-shell > div',
      '.review-archive__hero > *', '.review-archive__list article', '.fin-review-hero__copy > *',
      '.fin-review-score', '.fin-review-distribution', '.fin-review-featured', '.fin-review-library__head > *',
      '.fin-review-grid article', '.fin-review-cta > .fin-shell', '.booking-page-embed',
    ].join(',')));
    revealTargets.forEach((target, index) => {
      target.classList.add('fin-reveal');
      target.style.setProperty('--reveal-delay', `${(index % 5) * 70}ms`);
    });
    let revealObserver: IntersectionObserver | undefined;
    if (reducedMotion) revealTargets.forEach(target => target.classList.add('is-visible'));
    else {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver?.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
      revealTargets.forEach(target => revealObserver?.observe(target));
    }

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
      revealObserver?.disconnect();
    };
  }, []);

  return (
    <div ref={root} className={`public-motion-root ${grainEnabled ? 'motion-grain' : ''}`}>
      {progressEnabled && <div ref={progress} className="motion-progress" aria-hidden="true" />}
      {children}
    </div>
  );
}
