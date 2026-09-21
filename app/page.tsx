import Link from 'next/link';
import {cookies} from 'next/headers';
import {defaultLocale,isLocale,messages} from '@/lib/i18n';
import {getSupabasePublicServer} from '@/lib/supabase/server';
import {ArrowRight,ShieldCheck,Users,HeartHandshake,Hotel,TrainFront,Car,MapPinned,Star} from 'lucide-react';
import {SectionHeading} from '@/components/ui/SectionHeading';

const hero='https://images.pexels.com/photos/32839113/pexels-photo-32839113.jpeg?auto=compress&cs=tinysrgb&w=2200';
const madinahImage='https://images.pexels.com/photos/18360295/pexels-photo-18360295.jpeg?auto=compress&cs=tinysrgb&w=1800';
const jeddahImage='https://images.pexels.com/photos/34744920/pexels-photo-34744920.jpeg?auto=compress&cs=tinysrgb&w=1800';
const serviceImages={
  hotel:'https://images.pexels.com/photos/8092391/pexels-photo-8092391.jpeg?auto=compress&cs=tinysrgb&w=1600',
  transport:'https://images.pexels.com/photos/29586609/pexels-photo-29586609.jpeg?auto=compress&cs=tinysrgb&w=1600',
  train:'https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1600',
  jeddah:jeddahImage
};

const copy={
  en:{
    journeys:'OUR UMRAH JOURNEYS',choose:'CHOOSE THE JOURNEY THAT FITS YOUR PEOPLE.',packageIntro:'Two clear journeys. Transparent pricing. Thoughtful arrangements for small groups.',
    premium:'Premium experience',higher:'Higher level',perGuest:'per guest',view:'View journey',
    signature:'Comfortable & meaningful',elite:'A higher level of comfort',
    signatureDesc:'Premium hotels, breakfast, private transportation, ziyarat, Jeddah experience, SIM and journey support.',
    eliteDesc:'Luxury accommodation, breakfast, Haramain Train economy where applicable, private transportation, ziyarat, Jeddah experience, SIM and journey support.',
    details:'A COMPLETE JOURNEY',detailsText:'Everything you need for a smooth, comfortable and meaningful journey.',
    essentials:['Premium hotels','Private transportation','Haramain Train','Jeddah Experience'],
    essentialDescriptions:['Carefully selected accommodation for a comfortable stay in Makkah and Madinah.','Comfortable, air-conditioned transport for transfers and planned ziyarat.','Fast, comfortable travel between Makkah and Madinah where included in the journey plan.','Explore local markets, culture and shopping in Jeddah.'],
    reviews:'GUEST EXPERIENCES',reviewsTitle:'Real experiences. Real people.',reviewsIntro:'Verified guest reviews will appear here after journeys are completed and reviews are approved.',
    empty:'Your experience can be next.',emptyText:'We do not publish invented testimonials. Once our first guests share verified feedback, their words and city will appear here.',
    destinations:'BEYOND UMRAH',destTitle:'Discover Makkah, Madinah & Jeddah',destText:'The sacred cities and the wider experience, thoughtfully arranged around your journey.',
    makkah:'The Sacred Mosque',madinah:'The Prophet’s Mosque',jeddah:'Culture & the Red Sea',explore:'Explore',
    process:'FROM INTEREST TO JOURNEY',request:'Request your journey',chat:'Chat on WhatsApp',
    steps:[['01','Choose','Select Signature or Elite.'],['02','Tell us your people','Choose 1–8 guests and your expected travel period.'],['03','Speak with us','We review the request and continue with you directly.'],['04','Confirm','Your final itinerary and payment instructions come before confirmation.']],
    highlights:['Premium service','Small groups','Personal support','Thoughtful planning'],statsTitle:'OUR JOURNEY SO FAR',completed:'Completed journeys',served:'Guests served',launching:'We are now welcoming our first journeys'
  },
  so:{
    journeys:'SAFARRADEENNA CUMRADA',choose:'DOORO SAFARKA KU HABBOON DADKAAGA.',packageIntro:'Laba safar oo cad. Qiime cad. Qorshe taxaddar leh oo loogu talagalay kooxo yaryar.',
    premium:'Khibrad heer sare ah',higher:'Heer ka sarreeya',perGuest:'qofkiiba',view:'Eeg safarka',
    signature:'Raaxo & macne',elite:'Heer raaxo oo sarreeya',
    signatureDesc:'Hoteello heer sare ah, quraac, gaadiid gaar ah, ziyaraat, khibradda Jeddah, SIM iyo taageero safar.',
    eliteDesc:'Hoy luxury ah, quraac, Haramain Train economy marka uu ku habboon yahay, gaadiid gaar ah, ziyaraat, khibradda Jeddah, SIM iyo taageero safar.',
    details:'SAFAR DHAMMEYSTIRAN',detailsText:'Wax kasta oo aad u baahan tahay safar fudud, raaxo leh oo macno leh.'
    essentials:['Hoteello heer sare','Gaadiid gaar ah','Haramain Train','Khibradda Jeddah'],
    essentialDescriptions:['Hoy si taxaddar leh loo doortay oo ku yaal Makkah iyo Madiinah.','Gaadiid raaxo leh oo qaboojiye leh oo loogu talagalay wareejinta iyo ziyaraatka.','Safar degdeg ah oo raaxo leh oo u dhexeeya Makkah iyo Madiinah marka uu ku jiro qorshaha safarka.','Sahami suuqyada, dhaqanka iyo wax iibsiga Jeddah.'],
    reviews:'KHIBRADA MARTIDA',reviewsTitle:'Khibrado dhab ah. Dad dhab ah.',reviewsIntro:'Faallooyinka martida la xaqiijiyay waxay halkan kasoo muuqan doonaan marka safarradu dhamaadaan oo la ansixiyo.',
    empty:'Khibraddaadu waxay noqon kartaa tan xigta.',emptyText:'Ma daabacno markhaatiyo la sameeyay. Marka martideenna ugu horreysa ay bixiyaan faallo la xaqiijiyay, magacooda iyo magaaladooda ayaa halkan kasoo muuqan doona.',
    destinations:'WAX KA BADAN CUMRO',destTitle:'Baro Makkah, Madiinah & Jeddah',destText:'Magaalooyinka barakeysan iyo khibradda ku xeeran, si taxaddar leh loogu habeeyay safarkaaga.',
    makkah:'Masjidka Xaramka',madinah:'Masjidka Nabiga',jeddah:'Dhaqanka & Badda Cas',explore:'Sahami',
    process:'LAGA BILAABO XIISAHA ILAA SAFARKA',request:'Codso safarkaaga',chat:'Nala hadal WhatsApp',
    steps:[['01','Dooro','Dooro Signature ama Elite.'],['02','Sheeg dadkaaga','Dooro 1–8 marti iyo muddada aad filayso.'],['03','Nala hadal','Waxaan dib u eegaynaa codsiga oo si toos ah ayaan kula sii wadaynaa.'],['04','Xaqiiji','Jadwalka ugu dambeeya iyo tilmaamaha lacag-bixinta ayaa yimaada ka hor xaqiijinta.']],
    highlights:['Adeeg heer sare ah','Kooxo yaryar','Taageero qofeed','Qorshe taxaddar leh'],statsTitle:'SAFARKEENNA ILLAA HADDANA',completed:'Safarro la dhammeeyay',served:'Marti la adeegay',launching:'Hadda waxaan soo dhoweynaynaa safarradii ugu horreeyay'
  },
  ar:{
    journeys:'رحلات العمرة لدينا',choose:'اختر الرحلة التي تناسب مجموعتك.',packageIntro:'رحلتان واضحتان. أسعار شفافة. وترتيبات مدروسة للمجموعات الصغيرة.',
    premium:'تجربة راقية',higher:'مستوى أعلى',perGuest:'للضيف',view:'استكشف الرحلة',
    signature:'راحة ومعنى',elite:'مستوى أعلى من الراحة',
    signatureDesc:'فنادق راقية، إفطار، تنقلات خاصة، زيارات، تجربة جدة، شريحة إنترنت ودعم الرحلة.',
    eliteDesc:'إقامة فاخرة، إفطار، قطار الحرمين الاقتصادي حيث يناسب البرنامج، تنقلات خاصة، زيارات، تجربة جدة، شريحة إنترنت ودعم الرحلة.',
    details:'رحلة متكاملة',detailsText:'كل ما تحتاجه لرحلة سلسة ومريحة وذات معنى.'
    essentials:['فنادق راقية','تنقلات خاصة','قطار الحرمين','تجربة جدة'],
    essentialDescriptions:['فنادق يتم اختيارها بعناية لإقامة مريحة في مكة والمدينة.','تنقلات مريحة ومكيفة للانتقالات والزيارات المخطط لها.','تنقل سريع ومريح بين مكة والمدينة حيث يكون مشمولًا في البرنامج.','استكشف الأسواق والثقافة والتسوق في جدة.'],
    reviews:'تجارب الضيوف',reviewsTitle:'تجارب حقيقية. أشخاص حقيقيون.',reviewsIntro:'ستظهر تقييمات الضيوف الموثقة هنا بعد إتمام الرحلات ومراجعة التقييمات واعتمادها.',
    empty:'قد تكون تجربتك التالية.',emptyText:'لا ننشر شهادات مختلقة. عندما يشارك ضيوفنا الأوائل تجارب موثقة، سيظهر اسم الضيف ومدينته هنا.',
    destinations:'أكثر من العمرة',destTitle:'اكتشف مكة والمدينة وجدة',destText:'المدن المقدسة وما حول الرحلة، بترتيب مدروس يتناسب مع تجربتك.',
    makkah:'المسجد الحرام',madinah:'المسجد النبوي',jeddah:'الثقافة والبحر الأحمر',explore:'استكشف',
    process:'من الاهتمام إلى الرحلة',request:'اطلب رحلتك',chat:'تحدث معنا عبر واتساب',
    steps:[['01','اختر','اختر SIGNATURE أو ELITE.'],['02','أخبرنا عن مجموعتك','حدد 1–8 ضيوف والفترة المتوقعة للسفر.'],['03','تحدث معنا','نراجع الطلب ونكمل معك مباشرة.'],['04','أكد','يصلك البرنامج النهائي وتعليمات الدفع قبل تأكيد الحجز.']],
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

  const highlights=[[c.highlights[0],ShieldCheck],[c.highlights[1],Users],[c.highlights[2],HeartHandshake],[c.highlights[3],MapPinned]] as const;
  const essentials=[[c.essentials[0],Hotel],[c.essentials[1],Car],[c.essentials[2],TrainFront],[c.essentials[3],MapPinned]] as const;
  // Launch presentation uses service facts instead of empty historical counters.
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
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {essentials.map(([label,Icon],index)=>{
            const images=[serviceImages.hotel,serviceImages.transport,serviceImages.train,serviceImages.jeddah];
            const links=['/hotels','/transportation','/transportation','/jeddah'];
            const imageAlts=[label,label,label,label];
            return <Link href={links[index]} key={label} className="group overflow-hidden rounded-[24px] border border-forest/10 bg-white shadow-[0_18px_60px_rgba(6,63,53,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(6,63,53,.12)]">
              <div className="relative h-52 overflow-hidden md:h-56">
                <img src={images[index]} alt={imageAlts[index]} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"/>
                <span className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white text-forest shadow-lg"><Icon size={24} className="text-gold"/></span>
              </div>
              <div className="p-6 md:p-7">
                <h3 className="serif text-2xl text-forest">{label}</h3>
                <p className="mt-3 text-sm leading-7 text-forest/60">{c.essentialDescriptions[index]}</p>
                <span className="mt-5 inline-flex items-center text-sm font-semibold text-gold">{c.explore} <ArrowRight size={16} className="ml-2 transition group-hover:translate-x-1"/></span>
              </div>
            </Link>;
          })}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={c.reviews} title={c.reviewsTitle}>{c.reviewsIntro}</SectionHeading>
        {reviews.length>0 ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r:any)=><article key={String(r.guest_name)+String(r.review_date)} className="card p-6"><div className="flex gap-1">{Array.from({length:Math.min(5,Math.max(0,Number(r.rating)||0))}).map((_,i)=><Star key={i} size={15} fill="currentColor" className="text-gold"/>)}</div><p className="mt-4 text-sm leading-6 text-forest/70">“{r.review_text}”</p><div className="mt-6 border-t border-forest/10 pt-4"><div className="font-semibold text-forest">{r.guest_name}</div><div className="text-xs text-forest/50">{r.city||r.country}</div></div></article>)}
        </div> : <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['5★','Thoughtful planning','Clear communication and a considered itinerary from the first request.'],
            ['5★','Small-group experience','A more personal journey designed around small groups.'],
            ['5★','Somali connection','A service shaped around the language and culture of the Somali diaspora.'],
            ['5★','Comfort & care','Premium accommodation, planned transportation and practical support.'],
            ['5★','Spiritual focus','Room to focus on Umrah while the important details are arranged.'],
            ['5★','Clear expectations','Transparent package pricing and confirmation before final arrangements.']
          ].map(([rating,title,text])=><article className="card p-6" key={title}><div className="flex items-center gap-2"><span className="text-sm font-bold text-gold">{rating}</span><span className="text-xs uppercase tracking-widest text-forest/45">Experience standard</span></div><h3 className="mt-4 font-semibold text-forest">{title}</h3><p className="mt-2 text-sm leading-6 text-forest/55">{text}</p></article>)}
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