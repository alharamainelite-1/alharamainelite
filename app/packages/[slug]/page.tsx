import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {cookies} from 'next/headers';
import {packages} from '@/lib/site';
import {defaultLocale,isLocale} from '@/lib/i18n';
import type {Metadata} from 'next';
import { SITE_URL } from '@/lib/seo';
import {Check, Hotel, Utensils, Car, MapPinned, Smartphone, Headphones, Train, Plane} from 'lucide-react';

const hero='https://images.pexels.com/photos/32839113/pexels-photo-32839113.jpeg?auto=compress&cs=tinysrgb&w=2200';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> {
  const {slug}=await params;
  const p=packages[slug as 'signature'|'elite'];
  if(!p) return {};
  const title=`${p.name} Umrah Journey — $${p.price.toLocaleString()} per guest`;
  const description=slug==='elite'
    ? 'ELITE is a 10-day / 9-night premium Umrah journey at $2,500 per guest, designed for small groups.'
    : 'SIGNATURE is a 10-day / 9-night premium Umrah journey at $2,000 per guest, designed for small groups.';
  return {title,description,alternates:{canonical:`/packages/${slug}`,languages:{en:`${SITE_URL}/packages/${slug}`,so:`${SITE_URL}/so/packages/${slug}`,ar:`${SITE_URL}/ar/packages/${slug}`,'x-default':`${SITE_URL}/packages/${slug}`}},openGraph:{title,description,type:'website'}};
}

const labels={
  en:{
    included:'What your journey includes',
    includedIntro:'Everything below is arranged as part of your confirmed journey, so you know exactly what you are paying for.',
    coreTitle:'Included in both journeys',
    eliteTitle:'ELITE — additional experience',
    not:'Not included',
    notIntro:'International flights are the only item outside the journey price.',
    ready:'Ready when you are',
    request:'Request this journey',
    compare:'Compare journeys',
    duration:'10 days / 9 nights',
    flights:'International flights are not included',
    features:[
      ['Premium hotels in Makkah & Madinah','Comfortable, carefully selected accommodation for your stay.'],
      ['Daily breakfast','Breakfast included throughout the journey according to the confirmed hotel arrangement.'],
      ['Private transportation','Private, air-conditioned transportation for the transfers and activities included in your itinerary.'],
      ['Makkah & Madinah ziyarat','Guided ziyarat to selected sites in the two Holy Cities as planned in your journey.'],
      ['Jeddah experience','A curated Jeddah experience, including cultural and shopping time where included in your itinerary.'],
      ['SIM card with internet','A SIM card with internet to help you stay connected during your journey.'],
      ['Journey support','Personal coordination and support throughout the planning and confirmed journey.']
    ],
    eliteExtra:[['Haramain Train','Haramain Train travel is included in ELITE where applicable to the confirmed journey plan.']],
    notList:['International flights']
  },
  so:{
    included:'Waxa safarkaagu ku jiro',
    includedIntro:'Wax kasta oo hoos ku qoran waxaa lagu diyaarinayaa safarkaaga la xaqiijiyay, si aad si cad u ogaato waxa qiimahaagu daboolayo.',
    coreTitle:'Labada safarba waxaa ku jira',
    eliteTitle:'ELITE — khibrad dheeraad ah',
    not:'Kuma jiraan',
    notIntro:'Duulimaadyada caalamiga ah ayaa ah waxa keliya ee aan ku jirin qiimaha safarka.',
    ready:'Markaad diyaar tahay',
    request:'Codso safarkan',
    compare:'Is barbar dhig safarrada',
    duration:'10 maalmood / 9 habeen',
    flights:'Duulimaadyada caalamiga ah kuma jiraan',
    features:[
      ['Hoteello heer sare ah oo Makkah iyo Madiinah ah','Hoy raaxo leh oo si taxaddar leh loo doortay muddada safarkaaga.'],
      ['Quraac maalinle ah','Quraac maalinle ah sida lagu xaqiijiyay qorshaha hoteelka.'],
      ['Gaadiid gaar ah','Gaadiid gaar ah oo qaboojiye leh oo loogu talagalay wareejinta iyo hawlaha ku jira barnaamijka.'],
      ['Ziyaraat Makkah iyo Madiinah','Ziyaraat hagitaan leh oo lagu booqdo goobaha la qorsheeyay ee labada magaalo ee barakeysan.'],
      ['Khibradda Jeddah','Khibrad Jeddah oo la qorsheeyay, oo ay ku jiraan dhaqan iyo dukaamaysi marka ay ku jiraan barnaamijka.'],
      ['SIM internet leh','SIM internet leh si aad ula xiriirto dadkaaga inta safarka lagu jiro.'],
      ['Taageerada safarka','Xiriir iyo taageero qofeed inta lagu jiro qorsheynta iyo safarka la xaqiijiyay.']
    ],
    eliteExtra:[['Haramain Train','Safarka Haramain Train wuxuu ku jiraa ELITE marka uu ku habboon yahay qorshaha safarka la xaqiijiyay.']],
    notList:['Duulimaadyada caalamiga ah']
  },
  ar:{
    included:'ما الذي تتضمنه رحلتك؟',
    includedIntro:'كل ما يلي يتم ترتيبه ضمن رحلتك المؤكدة، لتعرف بوضوح ما يشمله السعر.',
    coreTitle:'مشمول في الرحلتين',
    eliteTitle:'ELITE — تجربة إضافية',
    not:'غير مشمول',
    notIntro:'الرحلات الدولية هي العنصر الوحيد خارج سعر الرحلة.',
    ready:'عندما تكون مستعدًا',
    request:'اطلب هذه الرحلة',
    compare:'مقارنة الرحلات',
    duration:'10 أيام / 9 ليالٍ',
    flights:'الرحلات الدولية غير مشمولة',
    features:[
      ['فنادق راقية في مكة والمدينة','إقامة مريحة يتم اختيارها بعناية طوال الرحلة.'],
      ['وجبة إفطار يومية','وجبة إفطار يومية وفق ترتيب الفندق المؤكد.'],
      ['تنقلات خاصة','تنقلات خاصة ومكيفة للانتقالات والأنشطة المدرجة في برنامجك.'],
      ['زيارات مكة والمدينة','زيارات بإرشاد إلى مواقع مختارة في المدينتين المقدستين وفق البرنامج.'],
      ['تجربة جدة','تجربة مختارة في جدة تشمل الثقافة والتسوق حيث يتم تضمينها في البرنامج.'],
      ['شريحة إنترنت','شريحة اتصال مع إنترنت لتبقى على تواصل خلال الرحلة.'],
      ['دعم ومساندة الرحلة','تنسيق ودعم شخصي خلال مرحلة التخطيط والرحلة المؤكدة.']
    ],
    eliteExtra:[['قطار الحرمين','تشمل ELITE رحلة قطار الحرمين حيث يناسب برنامج الرحلة المؤكد.']],
    notList:['الرحلات الدولية']
  }
} as const;

export default async function PackagePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const p=packages[slug as 'signature'|'elite'];
  if(!p) notFound();
  const raw=(await cookies()).get('he_locale')?.value;
  const l=isLocale(raw)?raw:defaultLocale;
  const t=labels[l];
  const positioning=l==='ar'
    ? (slug==='elite'?'مستوى أعلى من الإقامة والتجربة، مع قطار الحرمين حيث يناسب البرنامج.':'راحة راقية وتجربة عمرة متكاملة، مرتبة بعناية للمجموعات الصغيرة.')
    : l==='so'
      ? (slug==='elite'?'Heer sare oo hoy iyo khibrad ah, oo ay ku jirto Haramain Train marka uu ku habboon yahay.':'Raaxo heer sare ah iyo safar Cumro oo dhammaystiran, si taxaddar leh loogu diyaariyay kooxo yaryar.')
      : p.positioning;
  const icons=[Hotel,Utensils,Car,MapPinned,MapPinned,Smartphone,Headphones] as const;

  const packageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `AlHaramain Elite ${p.name} Umrah Journey`,
    description: positioning,
    brand: { '@type': 'Brand', name: 'ALHARAMAIN ELITE' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: String(p.price),
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/packages/${slug}`,
      priceValidUntil: '2027-12-31',
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Packages', item: `${SITE_URL}/packages` },
      { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE_URL}/packages/${slug}` },
    ],
  };

  return <div>
    <section className='relative overflow-hidden bg-forest text-white'>
      <Image src={hero} alt='Makkah' fill priority className='object-cover opacity-30' sizes='100vw'/>
      <div className='absolute inset-0 bg-forest/80'/>
      <div className='container relative py-28 md:py-32'>
        <div className='eyebrow'>{p.name}</div>
        <h1 className='serif mt-4 text-7xl'>{p.name}</h1>
        <div className='mt-6 flex items-end gap-3'>
          <span className='serif text-6xl text-gold'>{'$'+p.price.toLocaleString()}</span>
          <span className='pb-2 text-white/60'>{l==='ar'?'/ ضيف':l==='so'?'/ marti':'/ guest'}</span>
        </div>
        <p className='mt-6 max-w-2xl text-lg leading-8 text-white/75'>{positioning}</p>
        <p className='mt-3 text-sm text-white/55'>{t.duration} · {t.flights}</p>
      </div>
    </section>

    <section className='section bg-ivory'>
      <div className='container'>
        <div className='max-w-3xl'>
          <div className='eyebrow'>{p.name}</div>
          <h2 className='serif mt-3 text-5xl text-forest'>{t.included}</h2>
          <p className='mt-4 text-lg leading-8 text-forest/65'>{t.includedIntro}</p>
        </div>

        <div className='mt-12 grid gap-10 lg:grid-cols-[1fr_360px]'>
          <div>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold'><Check size={20}/></div>
              <h3 className='serif text-3xl text-forest'>{t.coreTitle}</h3>
            </div>

            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              {t.features.map(([title,desc],i)=>{
                const Icon=icons[i];
                return <div key={title} className='group rounded-2xl border border-forest/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg'>
                  <div className='flex items-start gap-4'>
                    <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest text-gold'><Icon size={20}/></div>
                    <div><h4 className='font-semibold text-forest'>{title}</h4><p className='mt-2 text-sm leading-6 text-forest/60'>{desc}</p></div>
                  </div>
                </div>;
              })}
            </div>

            <div className='mt-10 rounded-2xl border border-gold/35 bg-white p-6'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold'><Train size={20}/></div>
                <h3 className='serif text-2xl text-forest'>{t.eliteTitle}</h3>
              </div>
              <div className='mt-5 grid gap-4'>
                {(slug==='elite'?t.eliteExtra:[]).map(([title,desc])=><div key={title} className='flex gap-4 rounded-xl bg-ivory p-5'>
                  <div className='mt-1 text-gold'><Check size={18}/></div>
                  <div><h4 className='font-semibold text-forest'>{title}</h4><p className='mt-1 text-sm leading-6 text-forest/60'>{desc}</p></div>
                </div>)}
              </div>
              {slug==='signature'&&<p className='mt-4 text-sm text-forest/55'>{l==='ar'?'تتضمن SIGNATURE جميع المزايا الأساسية الموضحة أعلاه.':l==='so'?'SIGNATURE wuxuu leeyahay dhammaan adeegyada muhiimka ah ee kor ku xusan.':'SIGNATURE includes all of the core inclusions listed above.'}</p>}
            </div>

            <div className='mt-10 rounded-2xl border border-forest/10 bg-white p-6'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-forest text-gold'><Plane size={19}/></div>
                <div><h3 className='font-semibold text-forest'>{t.not}</h3><p className='mt-1 text-sm text-forest/55'>{t.notIntro}</p></div>
              </div>
              <div className='mt-5 flex items-center gap-3 border-t border-forest/10 pt-4 text-forest/75'><Plane size={17} className='text-gold'/><span>{t.notList[0]}</span></div>
            </div>
          </div>

          <aside className='card h-fit p-7 lg:sticky lg:top-28'>
            <div className='eyebrow'>{t.ready}</div>
            <p className='mt-4 leading-7 text-forest/65'>{l==='ar'?'لا تحتاج إلى تاريخ رحلة مؤكد للبدء. شاركنا الفترة المتوقعة وسيتواصل معك فريقنا.':l==='so'?'Uma baahnid taariikh duulimaad la xaqiijiyay. Sheeg muddada aad filayso, kooxdayaduna way kula soo xiriiri doontaa.':'You do not need a confirmed flight date to start. Share your expected travel date or period and our team will contact you personally. There is no need to have your international flight booked yet.'}</p>
            <Link href={'/request-journey?package='+slug} className='btn btn-primary mt-6 w-full'>{t.request}</Link>
            <Link href='/packages' className='btn btn-outline mt-3 w-full'>{t.compare}</Link>
          </aside>
        </div>
      </div>
    </section>
    <Script id="package-schema" type="application/ld+json">{JSON.stringify(packageSchema)}</Script>
    <Script id="package-breadcrumb-schema" type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</Script>
  </div>;
}
