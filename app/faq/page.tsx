import Script from 'next/script';
import {cookies} from 'next/headers';
import {defaultLocale,isLocale,pageCopy} from '@/lib/i18n';

export default async function FAQ(){
  const raw=(await cookies()).get('he_locale')?.value;
  const l=isLocale(raw)?raw:defaultLocale;
  const t=pageCopy[l].faq;
  const faqSchema={
    '@context':'https://schema.org',
    '@type':'FAQPage',
    mainEntity:t.items.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})),
  };
  return <section className="section">
    <div className="container max-w-4xl">
      <div className="eyebrow">{t.eyebrow}</div>
      <h1 className="serif mt-4 text-6xl text-forest">{t.title}</h1>
      <div className="mt-10 space-y-4">{t.items.map(([q,a])=><details className="card p-6" key={q}><summary className="cursor-pointer font-semibold text-forest">{q}</summary><p className="mt-4 leading-7 text-forest/60">{a}</p></details>)}</div>
    </div>
    <Script id="faq-schema" type="application/ld+json">{JSON.stringify(faqSchema)}</Script>
  </section>;
}
