import Link from 'next/link';
import {cookies} from 'next/headers';
import {defaultLocale,isLocale,messages} from '@/lib/i18n';
import {getSupabasePublicServer} from '@/lib/supabase/server';
import {ArrowRight,ShieldCheck,Users,HeartHandshake,Hotel,TrainFront,Car,MapPinned,Star} from 'lucide-react';
import {SectionHeading} from '@/components/ui/SectionHeading';

const hero='https://images.pexels.com/photos/32839113/pexels-photo-32839113.jpeg?auto=compress&cs=tinysrgb&w=2200';
const madinahImage='https://images.pexels.com/photos/18360295/pexels-photo-18360295.jpeg?auto=compress&cs=tinysrgb&w=1800';
const jeddahImage='https://images.pexels.com/photos/34744920/pexels-photo-34744920.jpeg?auto=compress&cs=tinysrgb&w=1800';

const copy={
  en:{
    journeys:'OUR UMRAH JOURNEYS',choose:'CHOOSE THE JOURNEY THAT FITS YOUR PEOPLE.',packageIntro:'Two clear journeys. Transparent pricing. Thoughtful arrangements for small groups.',
    premium:'Premium experience',higher:'Higher level',perGuest:'per guest',view:'View journey',
    signature:'Comfortable & meaningful',elite:'A higher level of comfort',
    signatureDesc:'Premium hotels, breakfast, private transportation, ziyarat, Jeddah experience, SIM and journey support.',
    eliteDesc:'Luxury accommodation, breakfast, Haramain Train economy where applicable, private transportation, ziyarat, Jeddah experience, SIM and journey support.',
    details:'THE DETAILS MATTER',detailsText:'From accommodation and transport to ziyarat and personal support, the confirmed itinerary sets out exactly what is arranged.',
    essentials:['Premium hotels','Private transportation','Haramain Train','Ziyarat & experiences'],
    reviews:'GUEST EXPERIENCES',reviewsTitle:'Real experiences. Real people.',reviewsIntro:'Verified guest reviews will appear here after journeys are completed and reviews are approved.',
    empty:'Your experience can be next.',emptyText:'We do not publish invented testimonials. Once our first guests share verified feedback, their words and city will appear here.',
    destinations:'BEYOND UMRAH',destTitle:'Discover Makkah, Madinah & Jeddah',destText:'The sacred cities and the wider experience, thoughtfully arranged around your journey.',
    makkah:'The Sacred Mosque',madinah:'The Prophet’s Mosque',jeddah:'Culture & the Red Sea',explore:'Explore',
    process:'FROM INTEREST TO JOURNEY',request:'Request your journey',chat:'Chat on WhatsApp',
    steps:[['01','Choose','Select Signature or Elite.'],['02','Tell us your people','Choose 1–8 guests and your expected travel period.'],['03','Speak with us','We review the request and continue with you directly.'],['04','Confirm','Your final itinerary and payment instructions come before confirmation.']],
    highlights:['Premium service','Small groups','Personal support','Thoughtful planning']
  },
  so:{
    journeys:'SAFARRADEENNA CUMRADA',choose:'DOORO SAFARKA KU HABBOON DADKAAGA.',packageIntro:'Laba safar oo cad. Qiime cad. Qorshe taxaddar leh oo loogu talagalay kooxo yaryar.',
    premium:'Khibrad heer sare ah',higher:'Heer ka sarreeya',perGuest:'qofkiiba',view:'Eeg safarka',
    signature:'Raaxo & macne',elite:'Heer raaxo oo sarreeya',
    signatureDesc:'Hoteello heer sare ah, quraac, gaadiid gaar ah, ziyaraat, khibradda Jeddah, SIM iyo taageero safar.',
    eliteDesc:'Hoy luxury ah, quraac, Haramain Train economy marka uu ku habboon yahay, gaadiid gaar ah, ziyaraat, khibradda Jeddah, SIM iyo taageero safar.',
    details:'FAAHFAAHINTU WAA MUHIIM',detailsText:'Laga bilaabo hoyga iyo gaadiidka ilaa ziyaraat iyo taageerada qofeed, jadwalka la xaqiijiyay wuxuu si cad u qeexayaa waxa la diyaariyay.',
    essentials:['Hoteello heer sare','Gaadiid gaar ah','Haramain Train','Ziyaraat & khibrado'],
    reviews:'KHIBRADA MARTIDA',reviewsTitle:'Khibrado dhab ah. Dad dhab ah.',reviewsIntro:'Faallooyinka martida la xaqiijiyay waxay halkan kasoo muuqan doonaan marka safarradu dhamaadaan oo la ansixiyo.',
    empty:'Khibraddaadu waxay noqon kartaa tan xigta.',emptyText:'Ma daabacno markhaatiyo la sameeyay. Marka martideenna ugu horreysa ay bixiyaan faallo la xaqiijiyay, magacooda iyo magaaladooda ayaa halkan kasoo muuqan doona.',
    destinations:'WAX KA BADAN CUMRO',destTitle:'Baro Makkah, Madiinah & Jeddah',destText:'Magaalooyinka barakeysan iyo khibradda ku xeeran, si taxaddar leh loogu habeeyay safarkaaga.',
    makkah:'Masjidka Xaramka',madinah:'Masjidka Nabiga',jeddah:'Dhaqanka & Badda Cas',explore:'Sahami',
    process:'LAGA BILAABO XIISAHA ILAA SAFARKA',request:'Codso safarkaaga',chat:'Nala hadal WhatsApp',
    steps:[['01','Dooro','Dooro Signature ama Elite.'],['02','Sheeg dadkaaga','Dooro 1–8 marti iyo muddada aad filayso.'],['03','Nala hadal','Waxaan dib u eegaynaa codsiga oo si toos ah ayaan kula sii wadaynaa.'],['04','Xaqiiji','Jadwalka ugu dambeeya iyo tilmaamaha lacag-bixinta ayaa yimaada ka hor xaqiijinta.']],
    highlights:['Adeeg heer sare ah','Kooxo yaryar','Taageero qofeed','Qorshe taxaddar leh']
  },
  ar:{
    journeys:'رحلات العمرة لدينا',choose:'اختر الرحلة التي تناسب مجموعتك.',packageIntro:'رحلتان واضحتان. أسعار شفافة. وترتيبات مدروسة للمجموعات الصغيرة.',
    premium:'تجربة راقية',higher:'مستوى أعلى',perGuest:'للضيف',view:'استكشف الرحلة',
    signature:'راحة ومعنى',elite:'مستوى أعلى من الراحة',
    signatureDesc:'فنادق راقية، إفطار، تنقلات خاصة، زيارات، تجربة جدة، شريحة إنترنت ودعم الرحلة.',
    eliteDesc:'إقامة فاخرة، إفطار، قطار الحرمين الاقتصادي حيث يناسب البرنامج، تنقلات خاصة، زيارات، تجربة جدة، شريحة إنترنت ودعم الرحلة.',
    details:'التفاصيل تصنع الفرق',detailsText:'من الإقامة والتنقلات إلى الزيارات والدعم الشخصي، يوضح البرنامج المؤكد ما تم ترتيبه بالتحديد.',
    essentials:['فنادق راقية','تنقلات خاصة','قطار الحرمين','زيارات وتجارب'],
    reviews:'تجارب الضيوف',reviewsTitle:'تجارب حقيقية. أشخاص حقيقيون.',reviewsIntro:'ستظهر تقييمات الضيوف الموثقة هنا بعد إتمام الرحلات ومراجعة التقييمات واعتمادها.',
    empty:'قد تكون تجربتك التالية.',emptyText:'لا ننشر شهادات مختلقة. عندما يشارك ضيوفنا الأوائل تجارب موثقة، سيظهر اسم الضيف ومدينته هنا.',
    destinations:'أكثر من العمرة',destTitle:'اكتشف مكة والمدينة وجدة',destText:'المدن المقدسة وما حول الرحلة، بترتيب مدروس يتناسب مع تجربتك.',
    makkah:'المسجد الحرام',madinah:'المسجد النبوي',jeddah:'الثقافة والبحر الأحمر',explore:'استكشف',
    process:'من الاهتمام إلى الرحلة',request:'اطلب رحلتك',chat:'تحدث معنا عبر واتساب',
    steps:[['01','اختر','اختر SIGNATURE أو ELITE.'],['02','أخبرنا عن مجموعتك','حدد 1–8 ضيوف والفترة المتوقعة للسفر.'],['03','تحدث معنا','نراجع الطلب ونكمل معك مباشرة.'],['04','أكد','يصلك البرنامج النهائي وتعليمات الدفع قبل تأكيد الحجز.']],
    highlights:['خدمة راقية','مجموعات صغيرة','دعم شخصي','تخطيط مدروس']
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

  const highlights=[[c.highlights[0],ShieldCheck],[c.highlights[1],Users],[c.highlights[2],HeartHandshake],[c.highlights[3],MapPinned]] as const;
  const essentials=[[c.essentials[0],Hotel],[c.essentials[1],Car],[c.essentials[2],TrainFront],[c.essentials[3],MapPinned]] as const;
  const packages=[
    {name:'SIGNATURE',price:'$2,000',tag:c.premium,title:c.signature,desc:c.signatureDesc,image:hero,href:'/packages/signature'},
    {name:'ELITE',price:'$2,500',tag:c.higher,title:c.elite,desc:c.eliteDesc,image:madinahImage,href:'/packages/elite'}
  ];

  return <div>
    <section className="relative min-h-[76vh] overflow-hidden bg-forest text-white">
      <img src={hero} alt="Kaaba at Masjid al-Haram in Makkah" className="absolute inset-0 h-full w-full object-cover opacity-55"/>
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

    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={c.journeys} title={c.choose}>{c.packageIntro}</SectionHeading>
        <div className="mt-10 grid gap-7 lg:grid-cols-2">
          {packages.map((p)=><article key={p.name} className="overflow-hidden rounded-[28px] border border-forest/10 bg-white shadow-[0_25px_80px_rgba(6,63,53,.08)]">
            <div className="relative h-64 overflow-hidden"><img src={p.image} alt={p.name} className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-forest/75 to-transparent"/>
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
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {essentials.map(([label,Icon])=><div key={label} className="card bg-white p-6"><Icon size={23} className="text-gold"/><h3 className="mt-4 font-semibold text-forest">{label}</h3><p className="mt-2 text-sm leading-6 text-forest/55">{t.essentialsText}</p></div>)}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={c.reviews} title={c.reviewsTitle}>{c.reviewsIntro}</SectionHeading>
        {reviews.length>0 ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r:any)=><article key={String(r.guest_name)+String(r.review_date)} className="card p-6"><div className="flex gap-1">{Array.from({length:Math.min(5,Math.max(0,Number(r.rating)||0))}).map((_,i)=><Star key={i} size={15} fill="currentColor" className="text-gold"/>)}</div><p className="mt-4 text-sm leading-6 text-forest/70">“{r.review_text}”</p><div className="mt-6 border-t border-forest/10 pt-4"><div className="font-semibold text-forest">{r.guest_name}</div><div className="text-xs text-forest/50">{r.city||r.country}</div></div></article>)}
        </div> : <div className="mt-9 grid gap-5 md:grid-cols-[1.1fr_1fr]">
          <div className="rounded-[28px] bg-forest p-8 text-white md:p-10"><div className="flex gap-1">{[1,2,3,4,5].map(i=><Star key={i} size={16} className="text-gold"/>)}</div><h3 className="serif mt-5 text-3xl">{c.empty}</h3><p className="mt-4 max-w-xl leading-7 text-white/70">{c.emptyText}</p><Link href="/request-journey" className="btn mt-7 bg-gold text-forest">{c.request}</Link></div>
          <div className="grid gap-4 sm:grid-cols-2">{[['01','Verified reviews','Published only after review and approval.'],['02','Guest name & city','Shown with the guest’s permission and approved review.'],['03','Real experiences','No stock testimonials or invented praise.'],['04','Built over time','Every completed journey can become a real story.']].map(([n,a,b])=><div className="card p-5" key={n}><div className="eyebrow">{n}</div><h4 className="mt-2 font-semibold text-forest">{a}</h4><p className="mt-2 text-sm leading-6 text-forest/55">{b}</p></div>)}</div>
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
  </div>;
}

function Destination({href,image,title,label,explore}:{href:string;image:string;title:string;label:string;explore:string}){
  return <Link href={href} className="group relative h-80 overflow-hidden rounded-[28px]"><img src={image} alt={label} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"/><div className="absolute bottom-6 left-6 text-white"><div className="eyebrow text-gold">{label}</div><div className="serif mt-1 text-3xl">{title}</div><span className="mt-3 inline-flex items-center text-sm">{explore}<ArrowRight size={15} className="ml-2"/></span></div></Link>;
}