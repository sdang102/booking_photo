'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktop = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
    const revealElements = scope.querySelectorAll<HTMLElement>('[data-reveal], .scroll-reveal');
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

    if (reduced) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return () => {
        window.removeEventListener('scroll', updateProgress);
        if (progressFrame) window.cancelAnimationFrame(progressFrame);
      };
    }

    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8%', threshold: 0.08 });
    revealElements.forEach((element) => observer.observe(element));

    let context: gsap.Context | undefined;
    let refresh = 0;
    if (desktop) {
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const hero = scope.querySelector<HTMLElement>('[data-hero-scene]');
        const heroPin = hero?.querySelector<HTMLElement>('[data-hero-pin]');
        const heroStage = hero?.querySelector<HTMLElement>('[data-camera-stage]');
        const heroCopy = hero?.querySelector<HTMLElement>('[data-hero-copy]');
        const heroPrimary = hero?.querySelector<HTMLElement>('[data-hero-primary]');

        if (!hero || !heroPin || !heroStage || !heroCopy || !heroPrimary) return;
        gsap.set(heroStage, { transformPerspective: 1500, transformStyle: 'preserve-3d' });
        gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom bottom',
            pin: heroPin,
            pinSpacing: false,
            scrub: 0.15,
            anticipatePin: 1,
          },
        })
          .to(heroCopy, { yPercent: -6, autoAlpha: 0.58, ease: 'none' }, 0)
          .to(heroStage, { z: 45, ease: 'none' }, 0)
          .to(heroPrimary, { z: 150, scale: 1.2, ease: 'none' }, 0);
      }, scope);
      refresh = window.setTimeout(() => ScrollTrigger.refresh(), 350);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
      if (progressFrame) window.cancelAnimationFrame(progressFrame);
      if (refresh) window.clearTimeout(refresh);
      context?.revert();
      document.documentElement.classList.remove('motion-ready');
    };
  }, []);

  return (
    <div ref={root} className={`public-motion-root ${grainEnabled ? 'motion-grain' : ''}`}>
      {progressEnabled && <div ref={progress} className="motion-progress" aria-hidden="true" />}
      {children}
    </div>
  );
}
