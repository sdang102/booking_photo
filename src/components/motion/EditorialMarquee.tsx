import type { HomepageSection } from '@/types';

export default function EditorialMarquee({section}:{section?:HomepageSection}){
  if(!section||section.content.enabled===false)return null;
  const text=String(section.content.text??section.title??'PORTRAIT • COUPLE • PRE-WEDDING • STORY • EMOTION •');
  return <div className="editorial-marquee" aria-hidden="true"><div>{text} {text}</div></div>;
}
