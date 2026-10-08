import { Star } from 'lucide-react';

export function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return <div className="flex gap-0.5" aria-label={`${rating} trên 5 sao`}>{[1,2,3,4,5].map((star)=><Star key={star} className={`${size==='lg'?'h-6 w-6':'h-4 w-4'} ${star<=rating?'fill-amber-400 text-amber-400':'fill-transparent text-slate-300'}`}/>)}</div>;
}
