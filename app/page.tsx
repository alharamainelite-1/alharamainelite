import Link from 'next/link';
import Image from 'next/image';
import {cookies} from 'next/headers';
import {defaultLocale,isLocale,messages} from '@/lib/i18n';
import {getSupabaseAdmin,getSupabasePublicServer} from '@/lib/supabase/server';
import {ArrowRight,ShieldCheck,Users,HeartHandshake,Hotel,TrainFront,Car,MapPinned,Star} from 'lucide-react';
import {SectionHeading} from '@/components/ui/SectionHeading';
import {SITE_URL} from '@/lib/seo';

const hero='https://images.pexels.com/photos/32839113/pexels-photo-32839113.jpeg?auto=compress&cs=tinysrgb&w=2200';
const madinahImage='https://images.pexels.com/photos/18360295/pexels-photo-18360295.jpeg?auto=compress&cs=tinysrgb&w=1800';
const jeddahImage='https://images.pexels.com/photos/34744920/pexels-photo-34744920.jpeg?auto=compress&cs=tinysrgb&w=1800';
const serviceImages={
  hotel:'https://content.skyscnr.com/available/2085004568/2085004568_WxH.jpg',
  transport:'https://sayartii.com/uploads/cars/17592186052033/d9acc57eb466bb72fe2341d9aa65911a5e072973_med.jpg',
  train:'https://image.idntimes.com/post/20250219/cara-naik-kereta-cepat-haramain-apa-saja-cara-naik-kereta-cepat-haramain-haramain-express-tiba-di-stasiun-tujuan-9cde86371d7fc78c91ae80a6ffab250e-3d3be380aeea0bc392a046548d082d21.jpg?tr=w-1200',
  jeddah:'https://scenenow.com/Content/editor_api/images/Artboard%208%20%281%29-cab2d0df-6870-4b32-88c8-3cc934ad4964.jpg'
};

const copy={
  en:{
    journeys:'OUR UMRAH JOURNEYS',choose:'CHOOSE THE JOURNEY THAT FITS YOUR PEOPLE.',packageIntro:'Two clear journeys. Transparent pricing. Thoughtful arrangements for small groups.',
    premium:'Premium experience',higher:'Higher level',perGuest:'per guest',view:'View journey',
    signature:'Comfortable & meaningful',elite:'A higher level of comfort',
    signatureDesc:'Premium hotels, breakfast, private transportation, ziyarat, Jeddah experience, SIM and journey support.',
    eliteDesc:'Luxury accommodation, breakfast, Haramain Train where applicable, private transportation, ziyarat, Jeddah experience, SIM and journey support.',
    details:'A COMPLETE JOURNEY',detailsText:'Everything you need for a smooth, comfortable and meaningful journey.',
    essentials:['Premium Hotels','Private Transportation','Haramain Train in ELITE','Jeddah Experience'],
    essentialDescriptions:['Carefully selected hotels in Makkah and Madinah near the Haram, ensuring comfort and convenience.','Travel in comfort with our premium, air-conditioned luxury vans for all transfers and Ziyarat.','Haramain Train is included with ELITE where applicable to the confirmed journey plan; it is not included with SIGNATURE.','Explore local markets, culture and shopping in Jeddah as part of your journey.'],
    reviews:'GUEST EXPERIENCES',reviewsTitle:'Real experiences. Real people.',
    empty:'Your experience can be next.',emptyText:'We do not publish invented testimonials. Once our first guests share verified feedback, their words and city will appear here.',
    destinations:'BEYOND UMRAH',destTitle:'Discover Makkah, Madinah & Jeddah',destText:'The sacred cities and the wider experience, thoughtfully arranged around your journey.',
    makkah:'The Sacred Mosque',madinah:'The Prophet’s Mosque',jeddah:'Culture & the Red Sea',explore:'Explore',
    process:'FROM INTEREST TO JOURNEY',request:'Request your journey',chat:'Chat on WhatsApp',
    steps:[['01','Choose','Select Signature or Elite.'],['02','Tell us your people','Choose 5–8 guests and your expected travel period.'],['03','Speak with us','We review the request and continue with you directly.'],['04','Confirm','Your final itinerary and payment instructions come before confirmation.']],
    highlights:['Premium service','Small groups','Personal support','Thoughtful planning'],statsTitle:'OUR JOURNEY SO FAR',completed:'Completed journeys',served:'Guests served',launching:'We are now welcoming our first journeys'
  },
  so:{
    journeys:'SAFARRADEENNA CUMRADA',choose:'DOORO SAFARKA KU HABBOON DADKAAGA.',packageIntro:'Laba safar oo cad. Qiime cad. Qorshe taxaddar leh oo loogu talagalay kooxo yaryar.',
    premium:'Khibrad heer sare ah',higher:'Heer ka sarreeya',perGuest:'qofkiiba',view:'Eeg safarka',
    signature:'Raaxo & macne',elite:'Heer raaxo oo sarreeya',
    signatureDesc:'Hoteello heer sare ah, quraac, gaadiid gaar ah, ziyaraat, khibradda Jeddah, SIM iyo taageero safar.',
    eliteDesc:'Hoy luxury ah, quraac, Haramain Train marka uu ku habboon yahay, gaadiid gaar ah, ziyaraat, khibradda Jeddah, SIM iyo taageero safar.',
    details:'SAFAR DHAMMEYSTIRAN',detailsText:'Wax kasta oo aad u baahan tahay safar fudud, raaxo leh oo macno leh.',
    essentials:['Hoteello Heer Sare','Gaadiid Gaar ah','Haramain Train','Khibradda Jeddah'],
    essentialDescriptions:['Hoteello si taxaddar leh loo doortay oo ku yaal Makkah iyo Madiinah, kuna dhow Xaramka.','Ku safar raaxo leh gaadiid luxury ah oo qaboojiye leh oo loogu talagalay wareejinta iyo ziyaraatka.','Safar degdeg ah oo raaxo leh oo u dhexeeya Makkah iyo Madiinah adigoo raacaya Haramain Train.','Sahami suuqyada, dhaqanka iyo wax iibsiga Jeddah oo qayb ka ah safarkaaga.'],
    reviews:'KHIBRADA MARTIDA',reviewsTitle:'Khibrado dhab ah. Dad dhab ah.',
    empty:'Khibraddaadu waxay noqon kartaa tan xigta.',emptyText:'Ma daabacno markhaatiyo la sameeyay. Marka martideenna ugu horreysa ay bixiyaan faallo la xaqiijiyay, magacooda iyo magaaladooda ayaa halkan kasoo muuqan doona.',
    destinations:'WAX KA BADAN CUMRO',destTitle:'Baro Makkah, Madiinah & Jeddah',destText:'Magaalooyinka barakeysan iyo khibradda ku xeeran, si taxaddar leh loogu habeeyay safarkaaga.',
    makkah:'Masjidka Xaramka',madinah:'Masjidka Nabiga',jeddah:'Dhaqanka & Badda Cas',explore:'Sahami',
    process:'LAGA BILAABO XIISAHA ILAA SAFARKA',request:'Codso safarkaaga',chat:'Nala hadal WhatsApp',
    steps:[['01','Dooro','Dooro Signature ama Elite.'],['02','Sheeg dadkaaga','Dooro 5–8 marti iyo muddada aad filayso.'],['03','Nala hadal','Waxaan dib u eegaynaa codsiga oo si toos ah ayaan kula sii wadaynaa.'],['04','Xaqiiji','Jadwalka ugu dambeeya iyo tilmaamaha lacag-bixinta ayaa yimaada ka hor xaqiijinta.']],
    highlights:['Adeeg heer sare ah','Kooxo yaryar','Taageero qofeed','Qorshe taxaddar leh'],statsTitle:'SAFARKEENNA ILLAA HADDANA',completed:'Safarro la dhammeeyay',served:'Marti la adeegay',launching:'Hadda waxaan soo dhoweynaynaa safarradii ugu horreeyay'
  },
  ar:{
    journeys:'رحلات العمرة لدينا',choose:'اختر الرحلة التي تناسب مجموعتك.',packageIntro:'رحلتان واضحتان. أسعار شفافة. وترتيبات مدروسة للمجموعات الصغيرة.',
    premium:'تجربة راقية',higher:'مستوى أعلى',perGuest:'للضيف',view:'استكشف الرحلة',
    signature:'راحة ومعنى',elite:'مستوى أعلى من الراحة',
    signatureDesc:'فنادق راقية، إفطار، تنقلات خاصة، زيارات، تجربة جدة، شريحة إنترنت ودعم الرحلة.',
    eliteDesc:'إقامة فاخرة، إفطار، تنقل بالقطار، تنقلات خاصة، زيارات، تجربة جدة، شريحة إنترنت ودعم الرحلة.',
    details:'رحلة متكاملة',detailsText:'كل ما تحتاجه لرحلة سلسة ومريحة وذات معنى.',
    essentials:['فنادق راقية','تنقلات خاصة','قطار الحرمين','تجربة جدة'],
    essentialDescriptions:['فنادق يتم اختيارها بعناية في مكة والمدينة بالقرب من الحرم، لضمان الراحة والسهولة.','تنقلات مريحة ومكيفة عبر فانات فاخرة لجميع الانتقالات والزيارات.','تنقل سريع ومريح بين مكة والمدينة عبر قطار الحرمين.','استكشف الأسواق والثقافة والتسوق في جدة كجزء من رحلتك.'],
    reviews:'تجارب الضيوف',reviewsTitle:'تجارب حقيقية. أشخاص حقيقيون.',
    empty:'قد تكون تجربتك التالية.',emptyText:'لا ننشر شهادات مختلقة. عندما يشارك ضيوفنا الأوائل تجارب موثقة، سيظهر اسم الضيف ومدينته هنا.',
    destinations:'أكثر من العمرة',destTitle:'اكتشف مكة والمدينة وجدة',destText:'المدن المقدسة وما حول الرحلة، بترتيب مدروس يتناسب مع تجربتك.',
    makkah:'المسجد الحرام',madinah:'المسجد النبوي',jeddah:'الثقافة والبحر الأحمر',explore:'استكشف',
    process:'من الاهتمام إلى الرحلة',request:'اطلب رحلتك',chat:'تحدث معنا عبر واتساب',
    steps:[['01','اختر','اختر SIGNATURE أو ELITE.'],['02','أخبرنا عن مجموعتك','حدد 5–8 ضيوف والفترة المتوقعة للسفر.'],['03','تحدث معنا','نراجع الطلب ونكمل معك مباشرة.'],['04','أكد','يصلك البرنامج النهائي وتعليمات الدفع قبل تأكيد الحجز.']],
    highlights:['خدمة راقية','مجموعات صغيرة','دعم شخصي','تخطيط مدروس'],statsTitle:'رحلتنا حتى الآن',completed:'رحلات مكتملة',served:'ضيوف تم خدمتهم',launching:'نرحب الآن بأولى رحلاتنا'
  }
} as const;

export default async function Home(){
  const raw=(await cookies()).get('he_locale')?.value;
  const locale=isLocale(raw)?raw:defaultLocale;
  const t=messages[locale].home;
  const nav=messages[locale].nav;
  const c=copy[locale];
  let reviews:any[]=[];
  try{
    const {data}=await getSupabasePublicServer().from('reviews').select('guest_name,country,city,rating,review_text,review_date').eq('status','PUBLISHED').eq('verified',true).order('review_date',{ascending:false}).limit(8);
    reviews=data||[];
  }catch{reviews=[]}

  let upcomingDepartures:any[]=[];
  try{
    const {data:departures}=await getSupabaseAdmin().from('departures')
      .select('id,departure_date,duration_nights,group_size,max_groups,status,public_label')
      .eq('status','OPEN').gte('departure_date',new Date().toISOString().slice(0,10))
      .order('departure_date',{ascending:true}).limit(4);
    const ids=(departures||[]).map((d:any)=>d.id);
    const {data:bookings}=ids.length
      ? await getSupabaseAdmin().from('bookings').select('departure_id,guest_count,status').in('departure_id',ids).in('status',['CONFIRMED','PAYMENT_RECEIVED','PREPARING','ACTIVE'])
      : {data:[]};
    const reserved=new Map<string,number>();
    for(const b of bookings||[]) reserved.set(b.departure_id,(reserved.get(b.departure_id)||0)+Number(b.guest_count||0));
    upcomingDepartures=(departures||[]).map((d:any)=>{
      const reservedGuests=reserved.get(d.id)||0;
      const capacityPerGroup=Number(d.group_size||8);
      const seatsInCurrentGroup=reservedGuests%capacityPerGroup;
      const availableSeats=capacityPerGroup-seatsInCurrentGroup;
      const maxGroups=d.max_groups==null?null:Number(d.max_groups);
      const groupsFilled=Math.floor(reservedGuests/capacityPerGroup);
      return {
        id:d.id,
        monthLabel:new Intl.DateTimeFormat(locale==='ar'?'ar-SA':'en-US',{month:'long',year:'numeric'}).format(new Date(d.departure_date+'T12:00:00Z')),
        dayLabel:new Intl.DateTimeFormat(locale==='ar'?'ar-SA':'en-US',{day:'numeric',month:'short'}).format(new Date(d.departure_date+'T12:00:00Z')),
        availableSeats:maxGroups!=null&&groupsFilled>=maxGroups?0:availableSeats
      };
    }).filter((d:any)=>d.availableSeats>0);
  }catch{upcomingDepartures=[]}

  const highlights=[[c.highlights[0],ShieldCheck],[c.highlights[1],Users],[c.highlights[2],HeartHandshake],[c.highlights[3],MapPinned]] as const;
  const serviceCards=[
    {label:c.essentials[0],description:c.essentialDescriptions[0],Icon:Hotel,image:serviceImages.hotel,href:'/hotels'},
    {label:c.essentials[1],description:c.essentialDescriptions[1],Icon:Car,image:serviceImages.transport,href:'/transportation'},
    {label:c.essentials[2],description:c.essentialDescriptions[2],Icon:TrainFront,image:serviceImages.train,href:'/transportation'},
    {label:c.essentials[3],description:c.essentialDescriptions[3],Icon:MapPinned,image:serviceImages.jeddah,href:'/jeddah'},
  ] as const;
  const packages=[
    {name:'SIGNATURE',price:'$2,000',tag:c.premium,title:c.signature,desc:c.signatureDesc,image:hero,href:'/packages/signature'},
    {name:'ELITE',price:'$2,500',tag:c.higher,title:c.elite,desc:c.eliteDesc,image:madinahImage,href:'/packages/elite'}
  ];

  return <div>
    <section className="bg-[#063F35] py-6 text-white sm:py-8">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl border border-[#C9A227]/45 bg-gradient-to-br from-[#063F35] via-[#08483D] to-[#063F35] px-5 py-6 shadow-[0_18px_50px_rgba(6,63,53,0.18)] sm:px-9 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#C9A227]/15"/>
          <div className="pointer-events-none absolute -right-5 -top-12 h-44 w-44 rounded-full border border-[#C9A227]/10"/>
          <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2"><span className="h-px w-7 bg-[#C9A227]"/><span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#DCC27E]">ALHARAMAIN ELITE</span></div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DCC27E]">{locale==='ar'?'5 أكتوبر 2026':locale==='so'?'5 Oktoobar 2026':'OCTOBER 5, 2026'}</p>
              <h2 className="font-serif text-2xl leading-tight text-white sm:text-3xl">{locale==='ar'?'اكتملت ترتيبات رحلة 5 أكتوبر':locale==='so'?'Diyaargarowga safarka 5 Oktoobar waa la dhammaystiray':'Our October 5 journey is now fully arranged'}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">{locale==='ar'?'شكرًا لاهتمامكم وثقتكم بـ ALHARAMAIN ELITE. يسعدنا مساعدتكم في التخطيط لرحلة العمرة في أحد المواعيد القادمة.':locale==='so'?'Waad ku mahadsan tihiin xiisaha iyo kalsoonida aad u muujiseen ALHARAMAIN ELITE. Waxaan ku farxi doonnaa inaan idiinka caawinno qorsheynta Cumrada taariikhaha soo socda.':'Thank you for your interest and trust in ALHARAMAIN ELITE. We would be delighted to help you plan your Umrah journey for an upcoming date.'}</p>
            </div>
            <Link href="/request-journey" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#C9A227] px-5 py-3 text-xs font-bold tracking-wide text-[#063F35] transition hover:bg-[#D8B94B]">{locale==='ar'?'استكشفوا الرحلات القادمة':locale==='so'?'Eeg safarrada soo socda':'EXPLORE UPCOMING JOURNEYS'} <ArrowRight size={15}/></Link>
          </div>
          <p className="relative mt-5 border-t border-white/10 pt-3 text-[9px] tracking-[0.18em] text-white/45">A JOURNEY WORTH REMEMBERING.</p>
        </div>
      </div>
    </section>

    <section className="relative min-h-[76vh] overflow-hidden bg-forest text-white">
      <Image src={hero} alt="Kaaba at Masjid al-Haram in Makkah" fill priority sizes="100vw" className="object-cover opacity-55"/>
      <div className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/70 to-forest/15"/>
      <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-transparent to-transparent"/>
      <div className="container relative flex min-h-[76vh] items-center py-24">
        <div className="max-w-3xl">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1 className="serif mt-5 text-6xl leading-[.95] md:text-8xl">{t.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/85">{t.intro}</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">{t.sub}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/packages" className="btn bg-gold text-forest">{t.explore}<ArrowRight size={16} className="ml-2"/></Link>
            <Link href="/request-journey" className="btn border border-white/40 text-white">{nav.plan}</Link>
          </div>
        </div>
      </div>
    </section>



    <section className="border-b border-forest/10 bg-white py-5">
      <div className="container grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {highlights.map(([label,Icon])=><div key={label} className="flex items-center gap-3 text-sm text-forest/70"><Icon size={19} className="text-gold"/><span>{label}</span></div>)}
      </div>
    </section>

    <section className="border-y border-forest/10 bg-[#f7f3ea] py-8">
      <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['10','DAYS / 9 NIGHTS','10 أيام / 9 ليالٍ','10 MAALMOOD / 9 HABEEN'],
          ['5–8','GUESTS / GROUP','ضيوف / مجموعة','MARTI / KOX'],
          ['3','LANGUAGES','لغات','Luqadood'],
          ['2','PREMIUM JOURNEYS','رحلتان مميزتان','2 SAFAR OO HEER SARE AH']
        ].map(([value,en,ar,so])=><div key={value+en} className="card bg-white p-6">
          <div className="serif text-4xl text-forest">{value}</div>
          <div className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-forest/60">{locale==='ar'?ar:locale==='so'?so:en}</div>
        </div>)}
      </div>
    </section>

    <section className="section bg-forest text-white">
      <div className="container">
        <SectionHeading eyebrow={locale==='ar'?'مواعيد الانطلاق القادمة':locale==='so'?'TAARIIKHAHA SAFARRADA SOO SOCDA':'UPCOMING UMRAH DEPARTURES'} title={locale==='ar'?'رحلتك تبدأ من موعد':locale==='so'?'SAFARKAAGU WUXUU KA BILAABMAA TAARIIKH':'Your journey begins with a date.'}>
          {locale==='ar'?'اختر موعد الانطلاق الذي يناسبك، ودع فريقنا يهتم بالتفاصيل.':locale==='so'?'Dooro taariikhda safarka kugu habboon, kooxdayaduna waxay daryeeli doontaa faahfaahinta.':'Choose the departure that works for you and let our team take care of the details.'}
        </SectionHeading>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{upcomingDepartures.map((d:any)=><article key={d.id} className="group rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur-sm transition duration-300 hover:border-gold/40 hover:bg-white/[0.09]"><div className="flex items-start gap-4"><div className="min-w-[62px] border-r border-white/10 pr-4"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">{d.monthLabel.split(' ')[0]}</div><div className="serif mt-1 text-3xl leading-none">{d.dayLabel.split(' ')[0]}</div></div><div className="min-w-0 flex-1"><div className="text-xs font-semibold uppercase tracking-[.14em] text-white/45">{locale==='ar'?'موعد الانطلاق':locale==='so'?'Taariikhda bixitaanka':'Departure date'}</div><div className="mt-1 text-sm font-semibold text-white">{locale==='ar'?'10 أيام · 9 ليالٍ':locale==='so'?'10 maalmood · 9 habeen':'10 days · 9 nights'}</div><div className="mt-2 text-xs leading-5 text-white/55">{locale==='ar'?'رحلة عمرة راقية، مرتبة بعناية لمجموعة صغيرة.':locale==='so'?'Safar Cumro oo heer sare ah, si taxaddar leh loogu habeeyay koox yar.':'A refined Umrah journey, thoughtfully arranged for a small group.'}</div></div></div><div className="mt-4 flex items-center justify-end border-t border-white/10 pt-3"><span className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">{locale==='ar'?'توافر محدود':locale==='so'?'Helitaan xaddidan':'Limited availability'}</span></div><Link href={'/request-journey?departure='+encodeURIComponent(d.id)} className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition hover:border-gold hover:bg-gold hover:text-forest">{locale==='ar'?'اختيار الموعد':locale==='so'?'Dooro taariikhda':'Choose this date'}<ArrowRight size={14} className="ml-2 transition group-hover:translate-x-0.5"/></Link></article>)}</div>
        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center sm:flex-row"><Link href="/request-journey" className="text-sm font-semibold text-gold hover:text-white">{locale==='ar'?'عرض جميع مواعيد الانطلاق':locale==='so'?'Eeg dhammaan taariikhaha':'View all departure dates'} <ArrowRight size={15} className="ml-1 inline"/></Link><span className="hidden text-white/25 sm:inline">·</span><span className="text-sm text-white/55">{locale==='ar'?'لست متأكدًا من الموعد المناسب لك؟':locale==='so'?'Ma hubtid taariikhda kugu habboon?':'Not sure which date works for you?'}</span><a href="https://wa.me/966579120989" className="text-sm font-semibold text-gold hover:text-white">{locale==='ar'?'تحدث مع فريقنا عبر واتساب':locale==='so'?'Nala hadal WhatsApp':'Talk to our team on WhatsApp'} <ArrowRight size={15} className="ml-1 inline"/></a></div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={c.journeys} title={c.choose}>{c.packageIntro}</SectionHeading>
        <div className="mt-10 grid gap-7 lg:grid-cols-2">
          {packages.map((p)=><article key={p.name} className="overflow-hidden rounded-[28px] border border-forest/10 bg-white shadow-[0_25px_80px_rgba(6,63,53,.08)]">
            <div className="relative h-64 overflow-hidden"><Image src={p.image} alt={`${p.name} Umrah journey`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-forest/75 to-transparent"/>
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-forest">{p.tag}</span>
            </div>
            <div className="p-7 md:p-8">
              <div className="eyebrow">{p.name}</div><h2 className="serif mt-2 text-3xl text-forest">{p.title}</h2>
              <div className="serif mt-3 text-5xl text-forest">{p.price}</div><div className="mt-1 text-sm text-forest/45">{c.perGuest} · 10 days / 9 nights</div>
              <p className="mt-5 text-sm leading-6 text-forest/65">{p.desc}</p>
              <Link href={p.href} className="btn btn-primary mt-7 w-full">{c.view}<ArrowRight size={16} className="ml-2"/></Link>
            </div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="section bg-[#f7f3ea]">
      <div className="container">
        <SectionHeading eyebrow={c.details} title={c.detailsText}/>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {serviceCards.map((card)=>{const Icon=card.Icon;return <Link href={card.href} key={card.label} className="group overflow-hidden rounded-[24px] border border-forest/10 bg-white shadow-[0_18px_60px_rgba(6,63,53,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(6,63,53,.12)]">
            <div className="relative h-52 overflow-hidden md:h-56">
              <Image src={card.image} alt={`${card.label} for the Umrah journey`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"/>
              <span className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white text-forest shadow-lg"><Icon size={24} className="text-gold"/></span>
            </div>
            <div className="p-6 md:p-7">
              <h3 className="serif text-2xl text-forest">{card.label}</h3>
              <p className="mt-3 text-sm leading-7 text-forest/60">{card.description}</p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-gold">{c.explore} <ArrowRight size={16} className="ml-2 transition group-hover:translate-x-1"/></span>
            </div>
          </Link>})}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={c.reviews} title={c.reviewsTitle}/>
        {reviews.length>0 ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r:any)=><article key={String(r.guest_name)+String(r.review_date)} className="card p-6"><div className="flex gap-1">{Array.from({length:Math.min(5,Math.max(0,Number(r.rating)||0))}).map((_,i)=><Star key={i} size={15} fill="currentColor" className="text-gold"/>)}</div><p className="mt-4 text-sm leading-6 text-forest/70">“{r.review_text}”</p><div className="mt-6 border-t border-forest/10 pt-4"><div className="font-semibold text-forest">{r.guest_name}</div><div className="text-xs text-forest/50">{r.city||r.country}</div></div></article>)}
        </div> : <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="card p-7 md:p-9">
          <div className="eyebrow">{c.reviews}</div>
          <h3 className="serif mt-3 text-3xl text-forest">{c.empty}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-forest/60">{c.emptyText}</p>
          <Link href="/request-journey" className="btn btn-primary mt-6">{c.request}</Link>
        </div>
        </div>}
      </div>
    </section>

    <section className="section bg-white">
      <div className="container">
        <SectionHeading eyebrow={c.destinations} title={c.destTitle}>{c.destText}</SectionHeading>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          <Destination href="/makkah" image={hero} title={c.makkah} label="Makkah" explore={c.explore}/>
          <Destination href="/madinah" image={madinahImage} title={c.madinah} label="Madinah" explore={c.explore}/>
          <Destination href="/jeddah" image={jeddahImage} title={c.jeddah} label="Jeddah" explore={c.explore}/>
        </div>
      </div>
    </section>

    <section className="section bg-forest text-white">
      <div className="container grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-center">
        <div><div className="eyebrow">{c.process}</div><h2 className="serif mt-4 text-5xl">{t.finalTitle}</h2><p className="mt-4 max-w-2xl leading-8 text-white/70">{t.finalText}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/request-journey" className="btn bg-gold text-forest">{c.request}</Link><a href="https://wa.me/966579120989" className="btn border border-white/30 text-white">{c.chat}</a></div></div>
        <div className="grid gap-3 sm:grid-cols-2">{c.steps.map(([n,title,text])=><div className="rounded-2xl border border-white/10 bg-white/5 p-5" key={n}><div className="eyebrow">{n}</div><h3 className="serif mt-2 text-2xl">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{text}</p></div>)}</div>
      </div>
    </section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':SITE_URL+'/#website','name':'ALHARAMAIN ELITE','url':SITE_URL,'inLanguage':['en','so','ar']},{'@type':'WebPage','@id':SITE_URL+'/#webpage','url':SITE_URL,'name':t.title,'isPartOf':{'@id':SITE_URL+'/#website'}}]})}} />
  </div>;
}

function Destination({href,image,title,label,explore}:{href:string;image:string;title:string;label:string;explore:string}){
  return <Link href={href} className="group relative h-80 overflow-hidden rounded-[28px]"><Image src={image} alt={`${label} Umrah experience`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"/><div className="absolute bottom-6 left-6 text-white"><div className="eyebrow text-gold">{label}</div><div className="serif mt-1 text-3xl">{title}</div><span className="mt-3 inline-flex items-center text-sm">{explore}<ArrowRight size={15} className="ml-2"/></span></div></Link>;
}