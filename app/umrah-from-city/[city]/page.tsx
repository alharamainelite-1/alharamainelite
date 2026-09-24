import type {Metadata} from 'next';
import Link from 'next/link';
import Script from 'next/script';
import {notFound} from 'next/navigation';
import {SITE_URL,localizedPath,hreflangAlternates} from '@/lib/seo';
import {CITY_SEO,getCitySeo} from '@/lib/city-seo';

export const dynamicParams=false;
export function generateStaticParams(){return CITY_SEO.map(x=>({city:x.slug}));}

export async function generateMetadata({params}:{params:Promise<{city:string}>}):Promise<Metadata>{
  const {city:slug}=await params; const city=getCitySeo(slug); if(!city)return{};
  const path=`/umrah-from-city/${city.slug}`;
  return {title:city.title,description:city.description,alternates:{canonical:`${SITE_URL}${path}`,languages:{...hreflangAlternates(path)}},openGraph:{title:city.title,description:city.description,url:`${SITE_URL}${path}`,type:'website',images:[{url:`${SITE_URL}/brand/alharamainelite-logo.png`}]},robots:{index:true,follow:true}};
}

const text={
en:{eyebrow:'SOMALI UMRAH · CITY GUIDE',intro:(c:string)=>`A premium small-group Umrah planning experience for Somali Muslims living in ${c} and the surrounding area.`,journeys:'Two clear journeys',journeysText:'SIGNATURE is $2,000 per guest. ELITE is $2,500 per guest. Both are 10 days / 9 nights.',groups:'Small groups',groupsText:'Plan for 5–8 guests and share an expected travel date or period. A confirmed flight date is not required to start.',support:'Language & support',supportText:'English, Somali and Arabic support is built into the journey experience.',start:'Start your Umrah journey',request:'Request your journey',packages:'View packages',areas:'Local planning area',airport:'Departure area',airportText:'Flight and departure details are confirmed separately as part of the final itinerary.',other:'More Somali diaspora city guides',otherText:'Explore other city-specific Umrah planning pages with the same transparent package structure.'},
so:{eyebrow:'CUMRO SOOMAALI AH · HAGIDA MAGAALADA',intro:(c:string)=>`Qorshayn safar Cumro oo koox yar ah oo loogu talagalay Muslimiinta Soomaalida ku nool ${c} iyo nawaaxigeeda.`,journeys:'Laba safar oo cad',journeysText:'SIGNATURE waa $2,000 qofkiiba. ELITE waa $2,500 qofkiiba. Labaduba waa 10 maalmood / 9 habeen.',groups:'Kooxo yaryar',groupsText:'Qorshee 5–8 marti oo nala wadaag taariikhda ama muddada aad filayso. Taariikh duulimaad oo la xaqiijiyey looma baahna bilowga.',support:'Luqad iyo taageero',supportText:'Taageerada English, Soomaali iyo Carabi waxay qayb ka tahay khibradda safarka.',start:'Bilow safarkaaga Cumrada',request:'Codso safarkaaga',packages:'Eeg xirmooyinka',areas:'Aagga qorshaynta',airport:'Goobta bixitaanka',airportText:'Faahfaahinta duulimaadka iyo bixitaanka waxaa si gaar ah loo xaqiijiyaa marka la diyaarinayo qorshaha ugu dambeeya.',other:'Hagayaal kale oo magaalooyinka Soomaalida',otherText:'Eeg bogag kale oo magaalooyin gaar ah leh oo leh isla qaab qiime cad.'},
ar:{eyebrow:'عمرة للصوماليين · دليل المدينة',intro:(c:string)=>`تخطيط رحلة عمرة راقية ضمن مجموعة صغيرة للمسلمين الصوماليين المقيمين في ${c} والمناطق المحيطة بها.`,journeys:'رحلتان واضحتان',journeysText:'SIGNATURE بسعر 2,000 دولار للضيف وELITE بسعر 2,500 دولار للضيف. مدة كل رحلة 10 أيام و9 ليالٍ.',groups:'مجموعات صغيرة',groupsText:'خطط لمجموعة من 5–8 ضيوف وشاركنا تاريخ السفر أو الفترة المتوقعة. لا تحتاج إلى تاريخ طيران مؤكد لبدء الطلب.',support:'اللغة والدعم',supportText:'الدعم بالإنجليزية والصومالية والعربية جزء من تجربة الرحلة.',start:'ابدأ رحلة العمرة',request:'اطلب رحلتك',packages:'استكشف الباقات',areas:'منطقة التخطيط',airport:'منطقة المغادرة',airportText:'يتم تأكيد تفاصيل الطيران والمغادرة بشكل منفصل ضمن البرنامج النهائي.',other:'أدلة مدن أخرى للجالية الصومالية',otherText:'استكشف صفحات المدن الأخرى مع نفس هيكل الباقات والأسعار الواضحة.'}
} as const;

export default async function CityPage({params}:{params:Promise<{city:string}>}){
  const {city:slug}=await params; const city=getCitySeo(slug); if(!city)notFound();
  const l='en'; const t=text[l]; const path=`/umrah-from-city/${city.slug}`; const url=`${SITE_URL}${path}`;
  const other=CITY_SEO.filter(x=>x.slug!==city.slug).slice(0,8);
  return <div>
    <section className="relative overflow-hidden bg-forest text-white"><div className="container py-24 md:py-32"><div className="max-w-4xl"><div className="eyebrow">{t.eyebrow} · {city.countryCode}</div><h1 className="serif mt-5 text-5xl leading-[.98] md:text-7xl">{city.title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">{t.intro(city.city)}</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/packages" className="btn bg-gold text-forest">{t.packages}</Link><Link href="/request-journey" className="btn border border-white/35 text-white">{t.request}</Link></div></div></div></section>
    <section className="section"><div className="container">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-7"><div className="eyebrow">{t.journeys}</div><h2 className="serif mt-3 text-3xl text-forest">$2,000 / $2,500</h2><p className="mt-3 text-sm leading-7 text-forest/60">{t.journeysText}</p></div>
        <div className="card p-7"><div className="eyebrow">{t.groups}</div><h2 className="serif mt-3 text-3xl text-forest">5–8</h2><p className="mt-3 text-sm leading-7 text-forest/60">{t.groupsText}</p></div>
        <div className="card p-7"><div className="eyebrow">{t.support}</div><h2 className="serif mt-3 text-3xl text-forest">EN · SO · AR</h2><p className="mt-3 text-sm leading-7 text-forest/60">{t.supportText}</p></div>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_.8fr]"><div><div className="eyebrow">{t.areas}</div><h2 className="serif mt-3 text-4xl text-forest md:text-5xl">{t.start} {city.city}</h2><p className="mt-5 max-w-3xl leading-8 text-forest/65">{t.intro(city.city)} {t.journeysText}</p><div className="mt-7 flex flex-wrap gap-3">{city.areas.map(x=><span key={x} className="rounded-full border border-forest/15 bg-[#f7f3ea] px-4 py-2 text-sm text-forest/70">{x}</span>)}</div></div>
      <aside className="card bg-[#f7f3ea] p-7"><div className="eyebrow">{t.airport}</div><p className="mt-3 text-lg font-semibold text-forest">{city.airport||city.city}</p><p className="mt-2 text-sm leading-6 text-forest/55">{t.airportText}</p></aside></div>
      <div className="mt-12 rounded-[28px] bg-forest p-8 text-white md:p-10"><div className="eyebrow">{t.start}</div><h2 className="serif mt-3 text-4xl">{t.start} from {city.city}</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">{t.intro(city.city)}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/request-journey" className="btn bg-gold text-forest">{t.request}</Link><Link href="/packages" className="btn border border-white/30 text-white">{t.packages}</Link></div></div>
    </div></section>
    <section className="section bg-[#f7f3ea]"><div className="container"><div className="max-w-3xl"><div className="eyebrow">{t.other}</div><h2 className="serif mt-3 text-4xl text-forest">{t.other}</h2><p className="mt-4 leading-7 text-forest/60">{t.otherText}</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{other.map(x=><Link key={x.slug} href={`/umrah-from-city/${x.slug}`} className="card p-5 hover:border-gold"><div className="eyebrow">{x.countryCode}</div><div className="mt-2 font-semibold text-forest">{x.city}</div></Link>)}</div></div></section>
    <Script id="city-schema" type="application/ld+json">{JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:city.title,description:city.description,url,inLanguage:l,isPartOf:{'@type':'WebSite',name:'ALHARAMAIN ELITE',url:SITE_URL},about:{'@type':'Service',name:'Umrah Journey Planning',areaServed:{'@type':'City',name:city.city}}})}</Script>
    <Script id="city-breadcrumb-schema" type="application/ld+json">{JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL},{'@type':'ListItem',position:2,name:'Umrah from cities',item:`${SITE_URL}/umrah-from-city`},{'@type':'ListItem',position:3,name:city.title,item:url}]})}</Script>
  </div>;
}
