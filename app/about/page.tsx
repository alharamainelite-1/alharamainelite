import {cookies} from 'next/headers';
import {defaultLocale,isLocale,pageCopy} from '@/lib/i18n';

export default async function About(){
  const raw=(await cookies()).get('he_locale')?.value;
  const l=isLocale(raw)?raw:defaultLocale;
  const t=pageCopy[l].about;
  return <section className="section">
    <div className="container max-w-5xl">
      <div className="max-w-4xl"><div className="eyebrow">{t.eyebrow}</div><h1 className="serif mt-4 text-5xl text-forest md:text-6xl">{t.title}</h1><p className="mt-6 text-lg leading-8 text-forest/65">{t.intro}</p></div>
      <div className="mt-12 space-y-14">
        <div className="max-w-4xl"><h2 className="serif text-4xl text-forest">{t.storyTitle}</h2><p className="mt-4 text-base leading-8 text-forest/70">{t.story}</p></div>
        <div><h2 className="serif text-4xl text-forest">{t.whyTitle}</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{t.why.map(([a,b])=><div className="card p-6" key={a}><h3 className="font-semibold text-forest">{a}</h3><p className="mt-2 text-sm leading-6 text-forest/60">{b}</p></div>)}</div></div>
        <div className="grid gap-6 md:grid-cols-[1.1fr_.9fr] md:items-center"><div className="overflow-hidden rounded-[28px]"><img src="https://images.unsplash.com/photo-1713526865745-c7927361b0ea?auto=format&fit=crop&w=1600&q=88" alt="Jeddah, Saudi Arabia" className="h-full min-h-72 w-full object-cover"/></div><div><div className="eyebrow">{t.originTitle}</div><p className="mt-4 text-lg leading-8 text-forest/70">{t.origin}</p></div></div>
        <div><h2 className="serif text-4xl text-forest">{t.valuesTitle}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{t.values.map(([a,b])=><div className="card p-6" key={a}><h3 className="font-semibold text-forest">{a}</h3><p className="mt-2 text-sm leading-6 text-forest/60">{b}</p></div>)}</div></div>
        <div className="border-t border-forest/10 pt-10"><h2 className="serif text-4xl text-forest">{t.finalTitle}</h2><p className="mt-4 max-w-3xl text-base leading-8 text-forest/70">{t.finalText}</p></div>
      </div>
    </div>
  </section>;
}