import type {Metadata} from 'next';
import Link from 'next/link';
import {headers} from 'next/headers';
import {CITY_SEO} from '@/lib/city-seo';
import {SEO_PAGES,localizedMetadata} from '@/lib/seo';
import {isLocale,defaultLocale,type Locale} from '@/lib/i18n';

export async function generateMetadata():Promise<Metadata>{
  const h=await headers(); const raw=h.get('x-he-locale'); const locale:Locale=isLocale(raw??undefined)?(raw as Locale):defaultLocale;
  return localizedMetadata('/umrah-from-city',locale,SEO_PAGES['/umrah-from-city']);
}

export default async function CityHub(){
  const h=await headers(); const raw=h.get('x-he-locale'); const locale:Locale=isLocale(raw??undefined)?(raw as Locale):defaultLocale;
  const labels={
    en:{eyebrow:'SOMALI UMRAH · CITY GUIDES',title:'Umrah planning from your city.',intro:'Explore city-specific planning guides for Somali Muslims living abroad. Each guide explains the journey structure, group size, expected travel period and local departure context.',request:'Request your journey',groups:'City guides'},
    so:{eyebrow:'CUMRO SOOMAALI AH · HAGAAYAAL MAGAALO',title:'Qorshaynta Cumrada laga bilaabo magaaladaada.',intro:'Sahami hagayaal magaalooyin gaar ah oo loogu talagalay Muslimiinta Soomaalida dibadda ku nool. Hagaha kasta wuxuu sharxayaa qaabka safarka, tirada kooxda, muddada la filayo iyo macluumaadka bixitaanka.',request:'Codso safarkaaga',groups:'Hagayaasha magaalooyinka'},
    ar:{eyebrow:'عمرة للصوماليين · أدلة المدن',title:'خطط للعمرة من مدينتك.',intro:'استكشف أدلة تخطيط حسب المدينة للمسلمين الصوماليين المقيمين في الخارج. يوضح كل دليل هيكل الرحلة وعدد الضيوف والفترة المتوقعة وسياق المغادرة المحلي.',request:'اطلب رحلتك',groups:'أدلة المدن'}
  }[locale];
  const countries=[...new Set(CITY_SEO.map(x=>x.country))];
  return <div>
    <section className="bg-forest text-white"><div className="container py-24 md:py-32"><div className="max-w-4xl"><div className="eyebrow">{labels.eyebrow}</div><h1 className="serif mt-5 text-5xl md:text-7xl">{labels.title}</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-white/75">{labels.intro}</p><Link href="/request-journey" className="btn mt-8 bg-gold text-forest">{labels.request}</Link></div></div></section>
    <section className="section"><div className="container">
      <div className="eyebrow">{labels.groups}</div>
      <div className="mt-8 space-y-12">
        {countries.map(country=><div key={country}><h2 className="serif text-3xl text-forest md:text-4xl">{country}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{CITY_SEO.filter(x=>x.country===country).map(city=><Link key={city.slug} href={`/umrah-from-city/${city.slug}`} className="card p-5 hover:border-gold"><div className="eyebrow">{city.countryCode}</div><h3 className="mt-2 font-semibold text-forest">{city.city}</h3><p className="mt-2 text-sm leading-6 text-forest/55">{city.description}</p></Link>)}</div></div>)}
      </div>
    </div></section>
  </div>;
}
