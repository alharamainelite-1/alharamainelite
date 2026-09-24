import Link from 'next/link';
import Script from 'next/script';
import {headers} from 'next/headers';
import {defaultLocale, isLocale, type Locale} from '@/lib/i18n';
import {localizedPath, SITE_URL} from '@/lib/seo';

type Market = { country:string; countryCode:string; slug:string; title:string; intro:string; cities:string[]; metaTitle:string; metaDescription:string };

const copy = {
  en: {
    planning: 'Planning from', planningTitle: 'A clear path from interest to journey.',
    planningText: (country:string) => `ALHARAMAIN ELITE offers two clearly priced small-group Umrah journeys for Somali Muslims living in ${country}: SIGNATURE at $2,000 per guest and ELITE at $2,500 per guest. Both are 10 days / 9 nights. International flights and personal expenses are not included unless expressly confirmed in the final itinerary.`,
    diasporaEyebrow:'Somali diaspora', diasporaTitle:'A service shaped around language, culture and small groups.',
    diasporaText:'English, Somali and Arabic support is built into the experience. You can choose your preferred language, tell us your group size and share an expected travel period before your final itinerary is confirmed.',
    questions:'Questions before you request?', essentials:'Start with the essentials.',
    flight:'Do I need confirmed flights?', flightAnswer:'No. You can provide an expected date or approximate travel period when you begin your request.',
    price:'What are the package prices?', priceAnswer:'SIGNATURE is $2,000 per guest and ELITE is $2,500 per guest.',
    start:'How do I start?', startAnswer:'Choose a journey, select 5–8 guests and submit a journey request. Our team then follows up with you directly.',
    ready:'Ready to plan?', readyTitle:'Begin your journey request.', readyText:'Tell us where you are, who is travelling and the period you expect to travel.',
    explore:'Explore Umrah journeys', request:'Request your journey', how:'How it works',
    choose:'Choose your journey', chooseText:'Select SIGNATURE or ELITE.',
    group:'Choose your group', groupText:'Tell us the number of guests, from 5–8.',
    period:'Share your period', periodText:'An expected travel date or approximate period is enough to start.',
    speak:'Speak with us', speakText:'We review your request and continue the details with you.'
  },
  so: {
    planning: 'Qorshaynta laga bilaabo', planningTitle: 'Jid cad oo ka bilaabma xiisaha ilaa safarka.',
    planningText: (country:string) => `ALHARAMAIN ELITE waxay siisaa Muslimiinta Soomaalida ku nool ${country} laba safar Cumro oo qiimahoodu cad yahay: SIGNATURE $2,000 qofkiiba iyo ELITE $2,500 qofkiiba. Labaduba waa 10 maalmood / 9 habeen. Duulimaadyada caalamiga ah iyo kharashaadka gaarka ah kuma jiraan haddii aan si cad loogu xaqiijin barnaamijka ugu dambeeya.`,
    diasporaEyebrow:'Qurba-joogta Soomaaliyeed', diasporaTitle:'Adeeg fahmaya luqadda, dhaqanka iyo kooxaha yaryar.',
    diasporaText:'Waxaan taageernaa English, Soomaali iyo Carabi. Waxaad dooran kartaa luqadda aad rabto, sheegtaa tirada kooxdaada, oo nala wadaagtaa muddada aad filayso ka hor inta aan la xaqiijin qorshaha ugu dambeeya.',
    questions:'Su’aalo ka hor codsiga?', essentials:'Ka bilow waxyaabaha muhiimka ah.',
    flight:'Ma u baahanahay duulimaad la xaqiijiyey?', flightAnswer:'Maya. Waxaad bixin kartaa taariikh la filayo ama muddo qiyaas ah markaad bilowdo codsiga.',
    price:'Waa maxay qiimaha safarradu?', priceAnswer:'SIGNATURE waa $2,000 qofkiiba, ELITE-na waa $2,500 qofkiiba.',
    start:'Sideen ku bilaabaa?', startAnswer:'Dooro safar, sheeg 5–8 marti, kadibna dir codsiga. Kooxdayadu si toos ah ayay kula soo xiriiri doontaa.',
    ready:'Diyaar ma u tahay qorshaynta?', readyTitle:'Bilow codsiga safarkaaga.', readyText:'Noo sheeg meesha aad joogto, cidda safreysa iyo muddada aad filayso.',
    explore:'Sahami safarrada Cumrada', request:'Codso safarkaaga', how:'Sida ay u shaqeyso',
    choose:'Dooro safarkaaga', chooseText:'Dooro SIGNATURE ama ELITE.',
    group:'Dooro kooxdaada', groupText:'Sheeg tirada martida, laga bilaabo 5 ilaa 8.',
    period:'Sheeg muddadaada', periodText:'Taariikh la filayo ama muddo qiyaas ah ayaa ku filan bilowga.',
    speak:'Nala hadal', speakText:'Waxaan dib u eegaynaa codsigaaga, kadibna faahfaahinta kula sii wadaynaa.'
  },
  ar: {
    planning: 'التخطيط من', planningTitle: 'خط واضح من الاهتمام إلى الرحلة.',
    planningText: (country:string) => `تقدم ALHARAMAIN ELITE للمسلمين الصوماليين المقيمين في ${country} رحلتي عمرة ضمن مجموعات صغيرة وبأسعار واضحة: SIGNATURE بسعر 2,000 دولار للضيف وELITE بسعر 2,500 دولار للضيف. مدة كل رحلة 10 أيام و9 ليالٍ. الرحلات الدولية والمصاريف الشخصية غير مشمولة ما لم يتم تأكيدها صراحة في البرنامج النهائي.`,
    diasporaEyebrow:'الجالية الصومالية', diasporaTitle:'خدمة تراعي اللغة والثقافة والمجموعات الصغيرة.',
    diasporaText:'ندعم الإنجليزية والصومالية والعربية ضمن تجربة الرحلة. يمكنك اختيار لغتك المفضلة وتحديد عدد الضيوف ومشاركة الفترة المتوقعة للسفر قبل تأكيد البرنامج النهائي.',
    questions:'أسئلة قبل طلب الرحلة؟', essentials:'ابدأ بالأساسيات.',
    flight:'هل أحتاج إلى رحلة طيران مؤكدة؟', flightAnswer:'لا. يمكنك إدخال تاريخ متوقع أو فترة تقريبية عند بدء الطلب.',
    price:'ما أسعار الرحلات؟', priceAnswer:'SIGNATURE بسعر 2,000 دولار للضيف وELITE بسعر 2,500 دولار للضيف.',
    start:'كيف أبدأ؟', startAnswer:'اختر الرحلة وحدد 5–8 ضيوف وأرسل طلب الرحلة، ثم يتواصل معك فريقنا مباشرة.',
    ready:'هل أنت مستعد للتخطيط؟', readyTitle:'ابدأ طلب رحلتك.', readyText:'أخبرنا أين تقيم ومن سيسافر معك والفترة التي تتوقع السفر خلالها.',
    explore:'استكشف رحلات العمرة', request:'اطلب رحلتك', how:'كيف تعمل الرحلة',
    choose:'اختر رحلتك', chooseText:'اختر SIGNATURE أو ELITE.',
    group:'حدد مجموعتك', groupText:'حدد عدد الضيوف من 5 إلى 8.',
    period:'شارك الفترة', periodText:'يكفي تاريخ متوقع أو فترة تقريبية للبدء.',
    speak:'تحدث معنا', speakText:'نراجع طلبك ونكمل التفاصيل معك مباشرة.'
  }
} as const;

export async function MarketLandingPage({market}:{market:Market}){
  const h = await headers();
  const rawLocale = h.get('x-he-locale');
  const locale: Locale = isLocale(rawLocale ?? undefined) ? (rawLocale as Locale) : defaultLocale;
  const t = copy[locale];
  const marketPath = localizedPath(`/umrah-from-${market.slug}`, locale);
  const pageUrl = `${SITE_URL}${marketPath}`;
  const breadcrumbHome = `${SITE_URL}${localizedPath('/', locale)}`;
  return <>
    <div>
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="container py-24 md:py-32">
          <div className="max-w-4xl">
            <div className="eyebrow">ALHARAMAIN ELITE · {market.countryCode}</div>
            <h1 className="serif mt-5 text-5xl leading-[.98] md:text-7xl">{market.title}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">{market.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/packages" className="btn bg-gold text-forest">{t.explore}</Link>
              <Link href="/request-journey" className="btn border border-white/35 text-white">{t.request}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="eyebrow">{t.planning} {market.country}</div>
              <h2 className="serif mt-3 text-4xl text-forest md:text-5xl">{t.planningTitle}</h2>
              <p className="mt-5 max-w-3xl leading-8 text-forest/65">{t.planningText(market.country)}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link href="/packages/signature" className="card p-6 hover:border-gold"><div className="eyebrow">SIGNATURE</div><div className="serif mt-2 text-3xl text-forest">$2,000</div><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'للضيف':locale==='so'?'qofkiiba':'per guest'} · 10 days / 9 nights</p></Link>
                <Link href="/packages/elite" className="card p-6 hover:border-gold"><div className="eyebrow">ELITE</div><div className="serif mt-2 text-3xl text-forest">$2,500</div><p className="mt-2 text-sm text-forest/55">{locale==='ar'?'للضيف':locale==='so'?'qofkiiba':'per guest'} · 10 days / 9 nights</p></Link>
              </div>
            </div>
            <aside className="card h-fit bg-[#f7f3ea] p-7">
              <div className="eyebrow">{t.how}</div>
              <ol className="mt-5 space-y-5">
                {[
                  ['01',t.choose,t.chooseText],
                  ['02',t.group,t.groupText],
                  ['03',t.period,t.periodText],
                  ['04',t.speak,t.speakText],
                ].map(([n,title,d])=><li key={n} className="border-b border-forest/10 pb-4"><div className="eyebrow">{n}</div><h3 className="mt-1 font-semibold text-forest">{title}</h3><p className="mt-1 text-sm leading-6 text-forest/55">{d}</p></li>)}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      <section className="section bg-[#f7f3ea]">
        <div className="container">
          <div className="max-w-3xl"><div className="eyebrow">{t.diasporaEyebrow}</div><h2 className="serif mt-3 text-4xl text-forest md:text-5xl">{t.diasporaTitle}</h2><p className="mt-5 leading-8 text-forest/65">{t.diasporaText}</p></div>
          <div className="mt-8 flex flex-wrap gap-3">{market.cities.map(c=><span key={c} className="rounded-full border border-forest/15 bg-white px-4 py-2 text-sm text-forest/70">{c}</span>)}</div>
        <div className="mt-10">
          <div className="eyebrow">City-specific Umrah planning</div>
          <h3 className="serif mt-3 text-3xl text-forest">Find your city</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CITY_SEO.filter(x=>x.countryCode===market.countryCode).map(x=><Link key={x.slug} href={`/umrah-from-city/${x.slug}`} className="card p-5 hover:border-gold"><div className="eyebrow">{x.countryCode}</div><div className="mt-2 font-semibold text-forest">{x.city}</div></Link>)}
          </div>
        </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="max-w-3xl"><div className="eyebrow">{t.questions}</div><h2 className="serif mt-3 text-4xl text-forest">{t.essentials}</h2></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="card p-6"><h3 className="font-semibold text-forest">{t.flight}</h3><p className="mt-2 text-sm leading-6 text-forest/60">{t.flightAnswer}</p></div>
            <div className="card p-6"><h3 className="font-semibold text-forest">{t.price}</h3><p className="mt-2 text-sm leading-6 text-forest/60">{t.priceAnswer}</p></div>
            <div className="card p-6"><h3 className="font-semibold text-forest">{t.start}</h3><p className="mt-2 text-sm leading-6 text-forest/60">{t.startAnswer}</p></div>
          </div>
          <div className="mt-10 rounded-[28px] bg-forest p-8 text-white md:p-10"><div className="eyebrow">{t.ready}</div><h2 className="serif mt-3 text-4xl">{t.readyTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">{t.readyText}</p><Link href="/request-journey" className="btn mt-7 bg-gold text-forest">{t.request}</Link></div>
        </div>
      </section>
    </div>

    <Script id="market-webpage-schema" type="application/ld+json">{JSON.stringify({
      '@context':'https://schema.org','@type':'WebPage','name':market.metaTitle,'description':market.metaDescription,'url':pageUrl,'inLanguage':locale,
      'about':{'@type':'Service','name':locale==='ar'?'تخطيط رحلة العمرة':locale==='so'?'Qorshaynta Safarka Cumrada':'Umrah Journey Planning','areaServed':{'@type':'Country','name':market.country}},
      'isPartOf':{'@type':'WebSite','name':'ALHARAMAIN ELITE','url':SITE_URL}
    })}</Script>
    <Script id="market-breadcrumb-schema" type="application/ld+json">{JSON.stringify({
      '@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
        {'@type':'ListItem','position':1,'name':locale==='ar'?'الرئيسية':locale==='so'?'Bogga Hore':'Home','item':breadcrumbHome},
        {'@type':'ListItem','position':2,'name':market.metaTitle,'item':pageUrl}
      ]
    })}</Script>
  </>;
}
