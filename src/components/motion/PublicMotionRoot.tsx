'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HomepageSection } from '@/types';

export default function PublicMotionRoot({settings,children}:{settings?:HomepageSection;children:React.ReactNode}){
  const content=settings?.content??{};
  const introEnabled=content.intro_enabled!==false;
  const progressEnabled=content.progress_enabled!==false;
  const grainEnabled=content.grain_enabled!==false;
  const introDuration=clamp(Number(content.intro_duration??1450),900,2200);
  const[showIntro,setShowIntro]=useState(false);
  const progress=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasPlayed=sessionStorage.getItem('chon-motion-intro')==='1';
    if(introEnabled&&!reduced&&!hasPlayed){
      setShowIntro(true);sessionStorage.setItem('chon-motion-intro','1');
      const timer=window.setTimeout(()=>setShowIntro(false),introDuration);
      return()=>window.clearTimeout(timer);
    }
  },[introDuration,introEnabled]);

  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements=Array.from(document.querySelectorAll<HTMLElement>('[data-motion]'));
    if(reduced){elements.forEach(element=>element.classList.add('motion-in'));return}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){(entry.target as HTMLElement).classList.add('motion-in');observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -8%'});
    elements.forEach(element=>observer.observe(element));
    return()=>observer.disconnect();
  });

  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let frame=0;
    const update=()=>{
      frame=0;
      const max=document.documentElement.scrollHeight-window.innerHeight;
      if(progress.current)progress.current.style.transform=`scaleX(${max>0?window.scrollY/max:0})`;
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach(element=>{
        const rect=element.getBoundingClientRect();
        if(rect.bottom<0||rect.top>window.innerHeight)return;
        const strength=Number(element.dataset.parallax??18);
        const ratio=(window.innerHeight/2-(rect.top+rect.height/2))/window.innerHeight;
        element.style.setProperty('--parallax-y',`${ratio*strength}px`);
      });
    };
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
    update();window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
    return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);if(frame)cancelAnimationFrame(frame)};
  },[]);

  useEffect(()=>{
    if(window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const move=(event:PointerEvent)=>{
      const target=(event.target as HTMLElement).closest<HTMLElement>('[data-magnetic]');
      if(!target)return;
      const rect=target.getBoundingClientRect();
      target.style.setProperty('--magnetic-x',`${(event.clientX-(rect.left+rect.width/2))*.09}px`);
      target.style.setProperty('--magnetic-y',`${(event.clientY-(rect.top+rect.height/2))*.12}px`);
    };
    const reset=(event:PointerEvent)=>{const target=(event.target as HTMLElement).closest<HTMLElement>('[data-magnetic]');if(target){target.style.setProperty('--magnetic-x','0px');target.style.setProperty('--magnetic-y','0px')}};
    document.addEventListener('pointermove',move);document.addEventListener('pointerout',reset);
    return()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',reset)};
  },[]);

  return <div className={`public-motion-root ${grainEnabled?'motion-grain':''}`}>
    {progressEnabled&&<div ref={progress} className="motion-progress" aria-hidden="true"/>}
    {showIntro&&<div className="motion-intro" style={{'--intro-duration':`${introDuration}ms`} as React.CSSProperties}><div className="motion-intro-mark">{settings?.image_url?<Image src={settings.image_url} alt="" width={110} height={110} unoptimized className="h-24 w-24 rounded-full object-contain"/>:<span>CHỌN</span>}</div><div className="motion-intro-line"/></div>}
    {children}
  </div>;
}

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,Number.isFinite(value)?value:min))}
