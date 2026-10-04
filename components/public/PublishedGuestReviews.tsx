import { getSupabasePublicServer } from '@/lib/supabase/server';
import { Star } from 'lucide-react';

export async function PublishedGuestReviews({ locale }: { locale: 'en'|'so'|'ar' }) {
 const { data } = await getSupabasePublicServer().from('reviews')
  .select('id,guest_name,country,rating,review_text,review_date,created_at')
  .eq('status','PUBLISHED').eq('verified',true).order('review_date',{ascending:false}).limit(24);
 const rows=data||[];
 return <section className="mt-10">
  <div className="eyebrow">{locale==='ar'?'آراء الضيوف الموثقة':locale==='so'?'Faallooyinka martida ee la xaqiijiyay':'Verified guest reviews'}</div>
  {rows.length>0?<div className="mt-5 grid gap-5 md:grid-cols-2">{rows.map((r:any)=><article key={r.id} className="card p-7">
   <div className="flex gap-1" aria-label={String(r.rating)+' / 5'}>{Array.from({length:5}).map((_,i)=><Star key={i} size={16} fill={i<Number(r.rating||0)?'currentColor':'none'} className={i<Number(r.rating||0)?'text-gold':'text-forest/20'}/>)}</div>
   <p className="mt-4 whitespace-pre-line leading-7 text-forest/80">{r.review_text}</p>
   <div className="mt-5 border-t border-forest/10 pt-4 text-xs text-forest/55">{r.guest_name||'Guest'}{r.country?' · '+r.country:''}</div>
  </article>)}</div>:<p className="mt-5 text-sm text-forest/60">{locale==='ar'?'ستظهر آراء الضيوف هنا بعد التحقق منها.':locale==='so'?'Faallooyinka martida halkan ayay ka soo muuqan doonaan marka la xaqiijiyo.':'Guest reviews will appear here after verification.'}</p>}
 </section>;
}
