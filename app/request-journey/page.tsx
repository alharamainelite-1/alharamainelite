import { cookies } from 'next/headers';
import { JourneyRequestClient } from '@/components/forms/JourneyRequestClient';
import { defaultLocale, isLocale, pageCopy } from '@/lib/i18n';

export default async function RequestJourney() {
  const raw = (await cookies()).get('he_locale')?.value;
  const l = isLocale(raw) ? raw : defaultLocale;
  const t = pageCopy[l].request;
  return <section className="section"><div className="container"><div className="max-w-3xl"><div className="eyebrow">{t.eyebrow}</div><h1 className="serif mt-4 text-5xl text-forest md:text-7xl">{t.title}</h1><p className="mt-5 text-lg leading-8 text-forest/60">{t.intro}</p></div><div className="mt-10"><JourneyRequestClient /></div></div></section>;
}
