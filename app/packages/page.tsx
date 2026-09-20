import Link from 'next/link';
import {cookies} from 'next/headers';
import {defaultLocale,isLocale} from '@/lib/i18n';
import {packages,features,eliteExtra} from '@/lib/site';

const images={
  signature:'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=1800&q=88',
  elite:'https://images.unsplash.com/photo-1635829581952-d507b68ef6b5?auto=format&fit=crop&w=1800&q=88',
};

const copy={
  en:{
    eyebrow:'Our Umrah journeys',title:'CHOOSE THE JOURNEY THAT FITS YOUR PEOPLE.',intro:'Two clear journeys. One thoughtful standard. Select the level that fits your group, see exactly what is included, then request your dates.',perGuest:'per guest',
    best:'Best for',signatureBest:'Guests who want premium comfort, clear arrangements and a calm small-group experience.',eliteBest:'Guests who want a higher level of accommodation and the added convenience of the Haramain Train where applicable.',
    notIncluded:'Always clear',notText:'International flights, personal expenses and any service not expressly confirmed in your final itinerary are not included.',
    request:'Plan this journey',compare:'At a glance',compareText:'Both journeys share the same thoughtful foundation. ELITE adds a higher accommodation level and Haramain Train economy class where applicable.',
    processTitle:'FROM INTEREST TO JOURNEY',process:[['01','Choose','Select Signature or Elite and tell us how many guests are travelling.'],['02','Share your period','You can give an expected date or an approximate travel period. A confirmed flight date is not required.'],['03','Speak with us','We review your request and continue the details with you on WhatsApp.'],['04','Confirm','Your final itinerary and payment instructions are provided before the booking is confirmed.']],
    note:'No hidden package price. Your estimate is simply price × guests.'
  },
  so:{
    eyebrow:'Safarradeenna Cumrada',title:'DOORO SAFARKA KU HABBOON DADKAAGA.',intro:'Laba safar oo cad. Hal heer oo taxaddar leh. Dooro heerka ku habboon kooxdaada, arag waxa ku jira, kadibna codso muddada safarka.',perGuest:'qofkiiba',
    best:'Ku habboon',signatureBest:'Martida rabta raaxo heer sare ah, qorshe cad iyo khibrad koox yar oo deggan.',eliteBest:'Martida rabta hoy heer sare ah iyo faa’iidada Haramain Train marka uu ku habboon yahay qorshaha.',
    notIncluded:'Wax walba si cad',notText:'Duulimaadyada caalamiga ah, kharashaadka gaarka ah iyo adeeg kasta oo aan si cad loogu xaqiijin jadwalka ugu dambeeya kuma jiraan.',
    request:'Qorshee safarkan',compare:'Marka la soo koobo',compareText:'Labada safar waxay wadaagaan aasaas isku mid ah. ELITE wuxuu ku daraa heer hoy oo sare iyo Haramain Train economy marka uu ku habboon yahay.',
    processTitle:'LAGA BILAABO XIISAHA ILAA SAFARKA',process:[['01','Dooro','Dooro Signature ama Elite oo sheeg tirada martida.'],['02','Sheeg muddada','Waxaad bixin kartaa taariikh la filayo ama muddo qiyaas ah. Taariikh duulimaad la xaqiijiyay looma baahna.'],['03','Nala hadal','Waxaan dib u eegaynaa codsigaaga, kadibna faahfaahinta kula sii wadaynaa WhatsApp.'],['04','Xaqiiji','Jadwalka ugu dambeeya iyo tilmaamaha lacag-bixinta ayaa lagu siinayaa ka hor xaqiijinta booking-ka.']],
    note:'Qiime qarsoon ma jiro. Qiyaastu waa qiimaha qofkiiba × tirada martida.'
  },
  ar:{
    eyebrow:'رحلات العمرة لدينا',title:'اختر الرحلة التي تناسب مجموعتك.',intro:'رحلتان واضحتان بمعيار واحد من العناية. اختر المستوى المناسب، تعرّف على ما يشمله، ثم شاركنا الفترة التي تناسبكم.',perGuest:'للضيف',
    best:'مناسبة لمن',signatureBest:'من يريد راحة راقية وترتيبات واضحة وتجربة هادئة ضمن مجموعة صغيرة.',eliteBest:'من يريد مستوى إقامة أعلى مع ميزة قطار الحرمين بالدرجة الاقتصادية حيث يناسب البرنامج.',
    notIncluded:'كل شيء واضح',notText:'الرحلات الدولية والمصاريف الشخصية وأي خدمة لم يتم تأكيدها صراحة في برنامجك النهائي غير مشمولة.',
    request:'خطط لهذه الرحلة',compare:'في لمحة',compareText:'تشترك الرحلتان في الأساس نفسه. وتضيف ELITE مستوى إقامة أعلى وقطار الحرمين الاقتصادي حيث يناسب البرنامج.',
    processTitle:'من الاهتمام إلى الرحلة',process:[['01','اختر','اختر SIGNATURE أو ELITE وحدد عدد الضيوف.'],['02','شارك الفترة','يمكنك إرسال تاريخ متوقع أو فترة تقريبية. لا تحتاج إلى تاريخ رحلة طيران مؤكد.'],['03','تحدث معنا','نراجع طلبك ونكمل التفاصيل معك عبر واتساب.'],['04','أكد','نرسل البرنامج النهائي وتعليمات التحويل البنكي قبل تأكيد الحجز.']],
    note:'لا توجد أسعار مخفية. التقدير ببساطة: سعر الضيف × عدد الضيوف.'
  }
} as const;

export default async function Packages(){
  const raw=(await cookies()).get('he_locale')?.value;
  const l=isLocale(raw)?raw:defaultLocale;
  const t=copy[l];
  const premiumLabel=l==='ar'?'مستوى راقٍ':l==='so'?'Heer sare':'Premium level';
  const higherLabel=l==='ar'?'مستوى أعلى':l==='so'?'Heer ka sarreeya':'Higher level';
  const notBoxes=l==='ar'?['الرحلات الدولية','المصاريف الشخصية','الخدمات غير المؤكدة']:l==='so'?['Duulimaadyada caalamiga ah','Kharashaadka gaarka ah','Adeegyada aan la xaqiijin']:['International flights','Personal expenses','Unconfirmed services'];
  const cards=[
    {p:packages.signature,image:images.signature,best:t.signatureBest,extra:features.slice(0,8)},
    {p:packages.elite,image:images.elite,best:t.eliteBest,extra:[...features.slice(0,8),...eliteExtra]},
  ];
  return <div>
    <section className="relative overflow-hidden bg-forest text-white">
      <div className="absolute inset-0"><img src={images.signature} alt="" className="h-full w-full object-cover opacity-25"/><div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/90 to-forest/55"/></div>
      <div className="container relative py-24 md:py-32">
        <div className="max-w-4xl"><div className="eyebrow">{t.eyebrow}</div><h1 className="serif mt-5 text-5xl leading-[.98] md:text-7xl">{t.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{t.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/request-journey" className="btn bg-gold text-forest">{t.request}</Link><a href="#compare" className="btn border border-white/35 text-white">{t.compare}</a></div>
        </div>
      </div>
    </section>
    <section className="section">
      <div className="container">
        <div className="grid gap-7 lg:grid-cols-2">
          {cards.map(({p,image,best,extra})=><article key={p.slug} className="overflow-hidden rounded-[28px] border border-forest/10 bg-white shadow-[0_28px_90px_rgba(6,63,53,.09)]">
            <div className="relative h-56 overflow-hidden"><img src={image} alt={p.slug==='elite'?'Madinah':'Makkah'} className="h-full w-full object-cover transition duration-700 hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-transparent to-transparent"/>
              <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4 text-white"><div><div className="eyebrow text-gold">{p.name}</div><div className="serif mt-1 text-3xl">{p.duration}</div></div><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs backdrop-blur">{p.slug==='elite'?higherLabel:premiumLabel}</span></div>
            </div>
            <div className="p-7 md:p-9">
              <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow">{t.best}</div><p className="mt-2 max-w-xl text-base leading-7 text-forest/65">{best}</p></div><div className="text-right"><div className="serif text-5xl text-forest">{'$'+p.price.toLocaleString()}</div><div className="text-sm text-forest/45">{t.perGuest}</div></div></div>
              <div className="mt-7 grid gap-3 border-t border-forest/10 pt-7 sm:grid-cols-2">{extra.map(f=><div key={f} className="flex gap-3 text-sm leading-6 text-forest/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"/>{f}</div>)}</div>
              <Link href={'/packages/'+p.slug} className="btn btn-primary mt-8 w-full">{t.request}</Link>
            </div>
          </article>)}
        </div>
        <div id="compare" className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="card p-7 md:p-8"><div className="eyebrow">SIGNATURE</div><h2 className="serif mt-2 text-3xl text-forest">$2,000 <span className="font-sans text-sm text-forest/45">/ {t.perGuest}</span></h2><p className="mt-3 leading-7 text-forest/60">{t.signatureBest}</p></div>
          <div className="card border-gold p-7 md:p-8"><div className="eyebrow">ELITE</div><h2 className="serif mt-2 text-3xl text-forest">$2,500 <span className="font-sans text-sm text-forest/45">/ {t.perGuest}</span></h2><p className="mt-3 leading-7 text-forest/60">{t.eliteBest}</p></div>
        </div>
        <div className="mt-10 rounded-[28px] bg-[#f7f3ea] p-7 md:p-10"><div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-center"><div><div className="eyebrow">{t.notIncluded}</div><h2 className="serif mt-3 text-3xl text-forest">{t.notText}</h2></div><div className="grid gap-3 sm:grid-cols-3">{notBoxes.map(x=><div key={x} className="border border-forest/10 bg-white p-4 text-sm text-forest/65">{x}</div>)}</div></div></div>
        <div className="mt-12"><div className="max-w-3xl"><div className="eyebrow">{t.processTitle}</div><h2 className="serif mt-3 text-4xl text-forest md:text-5xl">{t.compare}</h2></div><div className="mt-7 grid gap-4 md:grid-cols-4">{t.process.map(([n,title,text])=><div className="card p-6" key={n}><div className="eyebrow">{n}</div><h3 className="serif mt-3 text-2xl text-forest">{title}</h3><p className="mt-3 text-sm leading-6 text-forest/60">{text}</p></div>)}</div></div>
        <div className="mt-10 flex flex-col gap-5 rounded-[28px] bg-forest p-7 text-white md:flex-row md:items-center md:justify-between md:p-9"><div><div className="eyebrow">{t.compare}</div><p className="mt-2 max-w-3xl leading-7 text-white/70">{t.compareText}</p><p className="mt-3 text-sm text-gold">{t.note}</p></div><Link href="/request-journey" className="btn shrink-0 bg-gold text-forest">{t.request}</Link></div>
      </div>
    </section>
  </div>;
}
