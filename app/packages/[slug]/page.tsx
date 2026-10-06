import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {cookies} from 'next/headers';
import {packages} from '@/lib/site';
import {defaultLocale,isLocale} from '@/lib/i18n';
import type {Metadata} from 'next';
import { SEO_PAGES, SITE_URL, localizedMetadata } from '@/lib/seo';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import {Check, Hotel, Utensils, Car, MapPinned, Smartphone, Headphones, Train, Plane, Globe2, ShieldCheck} from 'lucide-react';

const hero='https://images.pexels.com/photos/32839113/pexels-photo-32839113.jpeg?auto=compress&cs=tinysrgb&w=2200';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> {
  const {slug}=await params;
  const path=`/packages/${slug}`;
  const base=SEO_PAGES[path];
  if(!base) return {};
  const h=await headers();
  const localeHeader=h.get('x-he-locale');
  const locale=localeHeader==='so'||localeHeader==='ar'?localeHeader:'en';
  return localizedMetadata(path,locale,base);
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
      ['Private VIP transportation','Private, air-conditioned VIP transportation for transfers, Ziyarat and included journey activities.'],
      ['Makkah & Madinah ziyarat','Guided ziyarat to selected sites in the two Holy Cities as planned in your journey.'],
      ['Jeddah experience','A curated Jeddah experience, including cultural and shopping time where included in your itinerary.'],
      ['SIM card with internet','A SIM card with internet to help you stay connected during your journey.'],
      ['Journey support','Personal coordination and support throughout the planning and confirmed journey.'],
      ['Saudi tourist visa','Our team arranges the Saudi tourist visa application and follows it through, subject to eligibility and government approval.'],
      ['Travel health insurance','Travel health insurance arranged for your journey, subject to the policy terms, limits and exclusions.']
    ],
    eliteExtra:[['Haramain Train — Makkah → Madinah','Included in ELITE on Day 7.'],['Haramain Train — Madinah → Jeddah Airport','Included in ELITE on Day 10.']],
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
      ['Gaadiid VIP oo gaar ah','Gaadiid VIP gaar ah oo qaboojiye leh oo loogu talagalay wareejinta, Ziyaraat iyo hawlaha safarka ee ku jira.'],
      ['Ziyaraat Makkah iyo Madiinah','Ziyaraat hagitaan leh oo lagu booqdo goobaha la qorsheeyay ee labada magaalo ee barakeysan.'],
      ['Khibradda Jeddah','Khibrad Jeddah oo la qorsheeyay, oo ay ku jiraan dhaqan iyo dukaamaysi marka ay ku jiraan barnaamijka.'],
      ['SIM internet leh','SIM internet leh si aad ula xiriirto dadkaaga inta safarka lagu jiro.'],
      ['Taageerada safarka','Xiriir iyo taageero qofeed inta lagu jiro qorsheynta iyo safarka la xaqiijiyay.'],
      ['Fiisaha dalxiiska Sacuudiga','Kooxdayadu waxay kuu diyaarinaysaa codsiga fiisaha dalxiiska waxayna la soconaysaa habraaciisa, iyadoo ku xiran u-qalmitaanka iyo oggolaanshaha dowladda.'],
      ['Caymiska caafimaadka safarka','Caymis caafimaad oo safarkaaga loo diyaariyo, iyadoo la raacayo shuruudaha, xaddidaadaha iyo waxyaabaha ka reeban ee caymiska.']
    ],
    eliteExtra:[['Haramain Train — Makkah → Madiinah','Waxa ku jira ELITE maalinta 7.'],['Haramain Train — Madiinah → Madaarka Jeddah','Waxa ku jira ELITE maalinta 10.']],
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
      ['تنقلات VIP خاصة','سيارة VIP خاصة ومكيفة للانتقالات والزيارات وأنشطة الرحلة المدرجة.'],
      ['زيارات مكة والمدينة','زيارات بإرشاد إلى مواقع مختارة في المدينتين المقدستين وفق البرنامج.'],
      ['تجربة جدة','تجربة مختارة في جدة تشمل الثقافة والتسوق حيث يتم تضمينها في البرنامج.'],
      ['شريحة إنترنت','شريحة اتصال مع إنترنت لتبقى على تواصل خلال الرحلة.'],
      ['دعم ومساندة الرحلة','تنسيق ودعم شخصي خلال مرحلة التخطيط والرحلة المؤكدة.'],
      ['التأشيرة السياحية السعودية','يتولى فريقنا ترتيب طلب التأشيرة السياحية السعودية ومتابعته، وفق أهلية الضيف وموافقة الجهات المختصة.'],
      ['التأمين الصحي للسفر','نرتب التأمين الصحي للرحلة وفق شروط الوثيقة وحدود التغطية والاستثناءات.']
    ],
    eliteExtra:[['قطار الحرمين — مكة → المدينة','مشمول في ELITE في اليوم 7.'],['قطار الحرمين — المدينة → مطار جدة','مشمول في ELITE في اليوم 10.']],
    notList:['الرحلات الدولية']
  }
} as const;


const itineraryCopy={
  en:{
    available:'Available departures',
    eyebrow:'YOUR 10-DAY JOURNEY',title:'From Makkah to Madinah',intro:'Five days in Makkah, one full Jeddah experience with an evening return to Makkah, then four days in Madinah.',
    summary:['5 DAYS · MAKKAH','1 DAY · JEDDAH EXPERIENCE','4 DAYS · MADINAH'],
    vipTitle:'Private VIP transportation throughout the journey',
    vipText:'A private VIP vehicle is arranged for included transfers, Ziyarat, local movements and the Jeddah Experience. ELITE keeps this private VIP service for local movements and visits even when the intercity leg uses the train.',
    trainTitle:'ELITE · TWO HARAMAIN TRAIN JOURNEYS',
    trainText:'Day 7: Makkah → Madinah. Day 10: Madinah → Jeddah Airport.',
    days:[
      ['Arrival in Makkah','Airport welcome and assistance','Private VIP transfer to Makkah','Hotel check-in and rest','Makkah'],
      ['Umrah','Umrah arrangements and guidance','Time for worship and personal rest','Journey team support','Makkah'],
      ['Makkah Programme','Planned Makkah visits and Ziyarat','Private VIP transportation for included movements','Time for worship and reflection','Makkah'],
      ['Makkah Programme','Further Ziyarat and journey activities','Private VIP transportation','Personal worship and rest','Makkah'],
      ['Makkah Programme','Final full day in Makkah','Private VIP transportation for included activities','Prepare for the Jeddah Experience','Makkah'],
      ['Jeddah Experience','Travel from Makkah to Jeddah','Somali Market, shopping and selected cultural stops','Return to Makkah in the evening','Jeddah → Makkah'],
      ['Makkah → Madinah','Prepare and depart from Makkah','Signature: private VIP vehicle · Elite: Haramain Train','Hotel check-in and rest in Madinah','Makkah → Madinah'],
      ['Madinah Programme','Visit Masjid an-Nabawi and planned Ziyarat','Private VIP transportation for included movements','Time for worship and reflection','Madinah'],
      ['Madinah Programme','Continue planned Madinah visits','Private VIP transportation for included movements','Personal worship and rest','Madinah'],
      ['Departure','Hotel check-out','Signature: private VIP transfer · Elite: Haramain Train to Jeddah Airport','End of the journey','Madinah → Jeddah Airport']
    ],
    clarity:'Daily timings and activity order may be adjusted when needed for local or operational circumstances. The final confirmed itinerary takes priority.'
  },
  so:{
    available:'Taariikhaha la heli karo',
    eyebrow:'SAFARKA 10 MAALMOOD',title:'Makkah ilaa Madiinah',intro:'Shan maalmood Makkah, hal maalin Jeddah oo leh soo laabasho fiidkii, kadib afar maalmood Madiinah.',
    summary:['5 MAALMOOD · MAKKAH','1 MAALIN · KHIBRADDA JEDDAH','4 MAALMOOD · MADIINAH'],
    vipTitle:'Gaadiid VIP oo gaar ah inta safarku socdo',
    vipText:'Gaari VIP gaar ah ayaa loo diyaariyaa wareejinta, Ziyaraat, dhaqdhaqaaqyada gudaha iyo Khibradda Jeddah. ELITE xitaa marka tareenka la isticmaalo wuxuu sii hayaa gaadiidka VIP-ga ee dhaqdhaqaaqyada gudaha iyo booqashooyinka.',
    trainTitle:'ELITE · LABA SAFAR OO HARAMAIN TRAIN AH',
    trainText:'Maalinta 7: Makkah → Madiinah. Maalinta 10: Madiinah → Madaarka Jeddah.',
    days:[
      ['Imaatinka Makkah','Soo dhoweyn iyo caawimo garoonka','Gaari VIP gaar ah oo Makkah lagu aado','Gelitaanka hoteelka iyo nasasho','Makkah'],
      ['Cumro','Qorshaynta iyo hagidda Cumrada','Waqti cibaado iyo nasasho','Taageerada kooxda safarka','Makkah'],
      ['Barnaamijka Makkah','Booqashooyin iyo Ziyaraat la qorsheeyay','Gaadiid VIP gaar ah','Waqti cibaado iyo fikir','Makkah'],
      ['Barnaamijka Makkah','Ziyaraat iyo hawlo safar oo dheeraad ah','Gaadiid VIP gaar ah','Cibaado iyo nasasho','Makkah'],
      ['Barnaamijka Makkah','Maalinta ugu dambeysa ee buuxda Makkah','Gaadiid VIP gaar ah','U diyaar garowga Khibradda Jeddah','Makkah'],
      ['Khibradda Jeddah','Makkah → Jeddah','Suuqa Soomaalida, dukaamaysi iyo goobo dhaqan oo la doortay','Fiidkii Makkah ku soo laabasho','Jeddah → Makkah'],
      ['Makkah → Madiinah','U diyaar garowga iyo ka bixitaanka Makkah','SIGNATURE: gaari VIP gaar ah · ELITE: Haramain Train','Gelitaanka hoteelka iyo nasasho Madiinah','Makkah → Madiinah'],
      ['Barnaamijka Madiinah','Booqashada Masjidka Nabiga iyo Ziyaraat la qorsheeyay','Gaadiid VIP gaar ah','Waqti cibaado iyo fikir','Madiinah'],
      ['Barnaamijka Madiinah','Sii wadista booqashooyinka Madiinah','Gaadiid VIP gaar ah','Cibaado iyo nasasho','Madiinah'],
      ['Bixitaanka','Ka bixitaanka hoteelka','SIGNATURE: gaari VIP ah · ELITE: Haramain Train ilaa Madaarka Jeddah','Dhammaadka safarka','Madiinah → Madaarka Jeddah']
    ],
    clarity:'Waqtiyada iyo kala horreynta hawlaha waa la beddeli karaa marka loo baahdo sababo maxalli ama hawlgal. Jadwalka ugu dambeeya ee la xaqiijiyay ayaa mudnaanta leh.'
  },
  ar:{
    available:'مواعيد الانطلاق المتاحة',
    eyebrow:'رحلتك لمدة 10 أيام',title:'من مكة إلى المدينة',intro:'خمسة أيام في مكة، ويوم كامل لتجربة جدة مع العودة إلى مكة مساءً، ثم أربعة أيام في المدينة المنورة.',
    summary:['5 أيام · مكة','يوم واحد · تجربة جدة','4 أيام · المدينة'],
    vipTitle:'سيارة VIP خاصة طوال الرحلة المدرجة',
    vipText:'يتم توفير سيارة VIP خاصة للانتقالات والزيارات والتنقلات المحلية وتجربة جدة. وحتى مع قطار الحرمين في ELITE، تبقى التنقلات المحلية والزيارات بسيارة VIP خاصة.',
    trainTitle:'ELITE · رحلتا قطار الحرمين',
    trainText:'اليوم 7: مكة → المدينة. اليوم 10: المدينة → مطار جدة.',
    days:[
      ['الوصول إلى مكة','استقبال ومساعدة في المطار','تنقل VIP خاص إلى مكة','تسجيل الدخول إلى الفندق والراحة','مكة'],
      ['العمرة','ترتيب العمرة والإرشاد','وقت للعبادة والراحة الشخصية','دعم فريق الرحلة','مكة'],
      ['برنامج مكة','الزيارات والزيارات الدينية المخطط لها','تنقل VIP خاص للأنشطة المدرجة','وقت للعبادة والتأمل','مكة'],
      ['برنامج مكة','زيارات وأنشطة إضافية ضمن الرحلة','تنقل VIP خاص','وقت شخصي للعبادة والراحة','مكة'],
      ['برنامج مكة','آخر يوم كامل في مكة','تنقل VIP خاص للأنشطة المدرجة','الاستعداد لتجربة جدة','مكة'],
      ['تجربة جدة','الانتقال من مكة إلى جدة','السوق الصومالي والتسوق ومواقع ثقافية مختارة','العودة إلى مكة مساءً','جدة → مكة'],
      ['مكة → المدينة','الاستعداد والمغادرة من مكة','SIGNATURE: سيارة VIP خاصة · ELITE: قطار الحرمين','تسجيل الدخول والراحة في المدينة','مكة → المدينة'],
      ['برنامج المدينة','زيارة المسجد النبوي والزيارات المخطط لها','تنقل VIP خاص للأنشطة المدرجة','وقت للعبادة والتأمل','المدينة'],
      ['برنامج المدينة','استكمال الزيارات المخطط لها','تنقل VIP خاص للأنشطة المدرجة','وقت شخصي للعبادة والراحة','المدينة'],
      ['المغادرة','تسجيل الخروج من الفندق','SIGNATURE: سيارة VIP خاصة · ELITE: قطار الحرمين إلى مطار جدة','نهاية الرحلة','المدينة → مطار جدة']
    ],
    clarity:'قد يتم تعديل الأوقات وترتيب الأنشطة عند الحاجة بسبب الظروف المحلية أو التشغيلية. ويكون البرنامج النهائي المؤكد هو المرجع.'
  }
} as const;

function departureLabel(date:string,locale:string){
  return new Intl.DateTimeFormat(locale==='ar'?'ar-SA':locale==='so'?'so-SO':'en-US',{day:'numeric',month:'short',year:'numeric'}).format(new Date(date+'T12:00:00Z'));
}

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
  const itinerary=itineraryCopy[l];
  let departures:any[]=[];
  try{
    const {data}=await getSupabaseAdmin().from('departures').select('id,departure_date,status').eq('status','OPEN').gte('departure_date',new Date().toISOString().slice(0,10)).order('departure_date',{ascending:true});
    departures=(data||[]).slice(0,8);
  }catch{departures=[]}
  const icons=[Hotel,Utensils,Car,MapPinned,MapPinned,Smartphone,Headphones,Globe2,ShieldCheck] as const;

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
        <div className='mt-7 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm'>
          <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-gold'>{itinerary.available}</div>
          {departures.length>0
            ? <div className='mt-4 flex flex-wrap gap-2'>{departures.map((d:any)=><Link key={d.id} href={'/request-journey?package='+slug+'&departure='+encodeURIComponent(d.id)} className='rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-gold hover:bg-gold hover:text-forest'>{departureLabel(d.departure_date,l)}</Link>)}</div>
            : <p className='mt-3 text-sm text-white/60'>{l==='ar'?'لا توجد مواعيد مفتوحة حاليًا.':l==='so'?'Hadda ma jiraan taariikho furan.':'No open departures are currently listed.'}</p>}
        </div>
      </div>
    </section>

    <section className='section bg-ivory'>
      <div className='container'>
        <div className='max-w-4xl'>
          <div className='eyebrow'>{itinerary.eyebrow}</div>
          <h2 className='serif mt-3 text-5xl text-forest md:text-6xl'>{itinerary.title}</h2>
          <p className='mt-4 text-lg leading-8 text-forest/60'>{itinerary.intro}</p>
        </div>
        <div className='mt-9 grid gap-4 md:grid-cols-3'>
          {itinerary.summary.map((item)=><div key={item} className='rounded-2xl border border-forest/10 bg-white p-5'><div className='text-sm font-bold tracking-wide text-forest'>{item}</div></div>)}
        </div>
        <div className='mt-7 grid gap-5 lg:grid-cols-2'>
          <div className='rounded-[24px] border border-gold/35 bg-white p-6'><div className='eyebrow'>{itinerary.vipTitle}</div><p className='mt-3 text-sm leading-7 text-forest/65'>{itinerary.vipText}</p></div>
          {slug==='elite'&&<div className='rounded-[24px] bg-forest p-6 text-white'><div className='eyebrow text-gold'>{itinerary.trainTitle}</div><p className='mt-3 text-sm leading-7 text-white/70'>{itinerary.trainText}</p></div>}
        </div>
        <div className='mt-10 overflow-hidden rounded-[28px] border border-forest/10 bg-white'>
          {(itinerary.days as readonly (readonly [string,string,string,string,string])[]).map((item,index)=>{
            const [title,a,b,c,place]=item;
            const train=slug==='elite'&&(index===6||index===9);
            const Icon=train?Train:index===5?MapPinned:index===9?Plane:index===0?Plane:MapPinned;
            return <article key={title+index} className='grid gap-5 border-b border-forest/10 p-6 last:border-0 md:grid-cols-[82px_1fr_190px] md:items-center md:p-7'>
              <div className='flex items-center gap-4 md:block'><div className='flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold'><span className='text-sm font-bold'>{index+1}</span></div><div className='mt-2 text-[10px] font-bold uppercase tracking-[.16em] text-forest/45'>{l==='ar'?'اليوم':l==='so'?'MAALINTA':'DAY'} {index+1}</div></div>
              <div><div className='flex flex-wrap items-center gap-2'><h3 className='serif text-2xl text-forest'>{title}</h3>{train&&<span className='rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-forest'>{itinerary.trainTitle}</span>}</div><ul className='mt-3 space-y-2 text-sm leading-6 text-forest/65'><li className='flex gap-2'><CheckCircle2 size={16} className='mt-1 shrink-0 text-gold'/>{a}</li><li className='flex gap-2'><CheckCircle2 size={16} className='mt-1 shrink-0 text-gold'/>{b}</li><li className='flex gap-2'><CheckCircle2 size={16} className='mt-1 shrink-0 text-gold'/>{c}</li></ul></div>
              <div className='rounded-2xl bg-[#f7f3ea] p-4'><div className='flex items-center gap-2 text-xs font-semibold text-forest'><Icon size={17} className='text-gold'/>{place}</div><div className='mt-3 text-xs leading-5 text-forest/55'>{train?itinerary.trainTitle:itinerary.vipTitle}</div></div>
            </article>;
          })}
        </div>
        <div className='mt-5 flex gap-3 rounded-2xl border border-forest/10 bg-white p-5 text-sm leading-6 text-forest/55'><Clock3 className='mt-1 shrink-0 text-gold' size={18}/><p>{itinerary.clarity}</p></div>
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
