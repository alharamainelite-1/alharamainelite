import type {Metadata} from 'next';
import {cookies,headers} from 'next/headers';
import {defaultLocale,isLocale,type Locale} from '@/lib/i18n';
import {SEO_PAGES,localizedMetadata} from '@/lib/seo';
import {FamilyFriendsForm} from '@/components/forms/FamilyFriendsForm';

export async function generateMetadata():Promise<Metadata>{
 const h=await headers();
 const raw=h.get('x-he-locale');
 const locale:Locale=isLocale(raw??undefined)?raw as Locale:defaultLocale;
 return localizedMetadata('/family-friends',locale,SEO_PAGES['/family-friends']);
}

const copy={
 en:{
  eyebrow:'PRIVATE UMRAH · FAMILY & FRIENDS',
  title:'Your people. Your private Umrah journey.',
  lead:'A meaningful journey to the Holy Cities, planned around your family or friends — with privacy, thoughtful coordination and personal support.',
  text:'Created with Somali families and friends living abroad in mind. Your private group stays together; we never add unrelated customers to your group.',
  cta:'Plan your private journey',secondary:'How it works',
  badge:'PRIVATE GROUP · 10 DAYS / 9 NIGHTS',
  features:[['Your group, together','Only the family or friends you invite'],['Made around you','Share your group size and travel plans'],['A tailored quote','Prepared after our team reviews availability'],['Personal coordination','One team to guide your request']],
  whyEyebrow:'MADE WITH SOMALI FAMILIES IN MIND',
  whyTitle:'A journey that feels personal from the very first step.',
  whyText:'Whether you live in the UK, USA, Canada, Europe or Australia, planning Umrah for a family or a group of friends should feel clear, respectful and reassuring. Tell us what matters to your group, and our team will review your request personally.',
  promiseTitle:'Your family. Your friends. Your own group.',
  promiseText:'This is a private-journey request, not a shared group booking. We do not combine your family or friends with unrelated customers.',
  detailTitle:'Thoughtful details for your group',
  detailCards:[['A plan for your people','Tell us how many adults, children and infants will travel so we can understand your group.'],['Travel from abroad','Share your country of residence and expected travel date to help us review the request.'],['A personal response','Our team will check the details and follow up with a tailored quote.']],
  jeddahTitle:'More than the journey between two cities',
  jeddahText:'Ask our team about the Jeddah experience and Somali-market shopping when these can be included in your confirmed itinerary. Every arrangement is clarified with you before confirmation.',
  stepsTitle:'Simple, clear steps',
  steps:[['01','Tell us about your group','Share the expected date and traveller details.'],['02','We review your request','Our team checks your details and availability.'],['03','Receive your tailored quote','We contact you to discuss suitable arrangements.']],
  formEyebrow:'START YOUR REQUEST',
  formTitle:'Let’s plan around your family or friends.',
  formText:'Share a few details. Sending this form is a request only — your journey is not confirmed until our team contacts you.',
  reassurance:'No online payment · No fixed public price for private groups · No unrelated guests added',
  footerNote:'A JOURNEY WORTH REMEMBERING.',
  name:'Full name',phone:'Phone number with country code',email:'Email address (optional)',country:'Country of residence',adults:'Number of adults',children:'Number of children',infants:'Number of infants',date:'Expected travel date',notes:'Additional notes (optional)',submit:'Send private group request',duration:'Trip duration',durationValue:'10 days / 9 nights',success:'Your request has been received. Our team will review it and contact you.',required:'Please complete all required fields.',age:'Age in years',ageMonths:'Age in months',
  countries:['United Kingdom','United States','Canada','Australia','Sweden','Norway','Denmark','Finland','Germany','Netherlands','France','Italy','Saudi Arabia','Other']
 },
 so:{
  eyebrow:'CUMRO GAAR AH · QOYSKA & SAAXIIBADA',
  title:'Dadkaaga. Safarkiinna gaarka ah ee Cumrada.',
  lead:'Safar macno leh oo lagu tagayo Labada Magaalo ee Barakaysan, kaas oo loo qorsheeyo qoyskaaga ama saaxiibbadaa — asturnaan, habayn taxaddar leh iyo taageero gaar ah.',
  text:'Waxaa maskaxda lagu hayaa qoysaska iyo saaxiibbada Soomaaliyeed ee dibadda ku nool. Kooxdiinnu waa gaar; macaamiil aan idinla socon laguma dari doono.',
  cta:'Qorshee safarkaaga gaarka ah',secondary:'Sida uu u shaqeeyo',
  badge:'KOX GAAR AH · 10 MAALMOOD / 9 HABEEN',
  features:[['Kooxdiinna oo wadajir ah','Qoyska ama saaxiibbada aad doorataan oo keliya'],['Adiga ayaa saldhig u ah','Noo sheeg tirada kooxda iyo qorshaha safarka'],['Qiime kuu gaar ah','Kadib marka la hubiyo helitaanka'],['Isku-duwid shakhsi ah','Hal koox oo codsiga idinla socota']],
  whyEyebrow:'LOO QORSHEEYEY QOYSASKA SOOMAALIYEED',
  whyTitle:'Safar kuu gaar ah laga bilaabo tallaabada koowaad.',
  whyText:'Haddii aad ku nooshahay UK, USA, Canada, Yurub ama Australia, qorshaynta Cumrada ee qoyska ama saaxiibbadu waa inay noqotaa mid cad, ixtiraam leh oo kalsooni gelisa. Noo sheeg waxa muhiimka u ah kooxdiinna, kooxdayaduna si gaar ah ayay u eegi doontaa codsiga.',
  promiseTitle:'Qoyskaaga. Saaxiibbadaa. Koox idiin gaar ah.',
  promiseText:'Tani waa codsi safar gaar ah, mana aha booking koox dad kale lala wadaago. Qoyskaaga ama saaxiibbadaa laguma dari doono macaamiil aan idinla socon.',
  detailTitle:'Faahfaahin si taxaddar leh loogu eegayo kooxdaada',
  detailCards:[['Qorshe ku habboon dadkaaga','Noo sheeg tirada dadka waaweyn, carruurta iyo dhallaanka si aan u fahanno kooxda.'],['Safar dibadda laga imanayo','Sheeg dalka aad degan tahay iyo taariikhda la filayo si codsiga loo qiimeeyo.'],['Jawaab gaar ah','Kooxdayadu waxay hubin doontaa faahfaahinta kadibna waxay kuu soo diyaarin doontaa qiime gaar ah.']],
  jeddahTitle:'Wax ka badan safarka labada magaalo',
  jeddahText:'Weydii kooxdayada khibradda Jeddah iyo booqashada Suuqa Soomaalida marka lagu dari karo barnaamijka safarka ee la xaqiijiyo. Faahfaahinta oo dhan waa laguu caddeynayaa ka hor xaqiijinta.',
  stepsTitle:'Tallaabooyin fudud oo cad',
  steps:[['01','Noo sheeg kooxdaada','La wadaag taariikhda la filayo iyo faahfaahinta dadka safaraya.'],['02','Waxaan eegaynaa codsiga','Kooxdayadu waxay hubinaysaa faahfaahinta iyo helitaanka.'],['03','Hel qiime kuu gaar ah','Waxaan kula soo xiriiraynaa si aan uga wada hadalno qorshe ku habboon.']],
  formEyebrow:'BILOW CODSIGAAGA',
  formTitle:'Aan qorshaha ku saleeyno qoyskaaga ama saaxiibbadaa.',
  formText:'La wadaag faahfaahin kooban. Foomkani waa codsi oo keliya — safarka lama xaqiijinayo ilaa kooxdayadu kula soo xiriirto.',
  reassurance:'Lacag online ah lagama qaadayo · Qiime go’an oo dadweyne ma jiro safarrada gaarka ah · Kooxdiinna laguma darayo dad kale',
  footerNote:'SAFAR MUDAN IN LA XUSUUSTO.',
  name:'Magaca oo buuxa',phone:'Telefoonka oo leh furaha dalka',email:'Email (ikhtiyaari)',country:'Dalka aad degan tahay',adults:'Tirada dadka waaweyn',children:'Tirada carruurta',infants:'Tirada dhallaanka',date:'Taariikhda safarka la filayo',notes:'Faahfaahin dheeraad ah (ikhtiyaari)',submit:'Dir codsiga kooxda gaarka ah',duration:'Muddada safarka',durationValue:'10 maalmood / 9 habeen',success:'Codsigaaga waa la helay. Kooxdayadu way dib u eegi doontaa wayna kula soo xiriiri doontaa.',required:'Fadlan buuxi meelaha loo baahan yahay.',age:'Da’da sannado',ageMonths:'Da’da bilaha',
  countries:['Boqortooyada Midowday','Mareykanka','Canada','Australia','Sweden','Norway','Denmark','Finland','Germany','Netherlands','France','Italy','Saudi Arabia','Dal kale']
 },
 ar:{
  eyebrow:'عمرة خاصة · العائلة والأصدقاء',
  title:'أحبابكم معًا في رحلة عمرة خاصة بكم.',
  lead:'رحلة ذات معنى إلى الحرمين، تُخطط بما يناسب عائلتكم أو أصدقاءكم، مع الخصوصية والتنسيق المدروس والدعم الشخصي.',
  text:'صُممت التجربة مع مراعاة العائلات والأصدقاء الصوماليين المقيمين خارج البلاد. تبقى مجموعتكم خاصة، ولا نضيف إليها عملاء لا يعرف بعضهم بعضًا.',
  cta:'خططوا رحلتكم الخاصة',secondary:'كيف تتم الرحلة',
  badge:'مجموعة خاصة · 10 أيام / 9 ليالٍ',
  features:[['مجموعتكم معًا','العائلة أو الأصدقاء الذين تختارونهم فقط'],['ترتيبات تناسبكم','شاركونا عدد المسافرين وخططكم'],['عرض سعر مخصص','بعد مراجعة التوافر'],['تنسيق شخصي','فريق واحد يتابع طلبكم']],
  whyEyebrow:'مع مراعاة احتياجات العائلات الصومالية',
  whyTitle:'رحلة شخصية تبدأ من أول خطوة.',
  whyText:'سواء كنتم تقيمون في بريطانيا أو الولايات المتحدة أو كندا أو أوروبا أو أستراليا، ينبغي أن يكون التخطيط لعمرة العائلة أو الأصدقاء واضحًا ومطمئنًا ومحترمًا. أخبرونا بما يهم مجموعتكم، وسيراجع فريقنا الطلب بعناية.',
  promiseTitle:'عائلتكم. أصدقاؤكم. مجموعتكم الخاصة.',
  promiseText:'هذا طلب لرحلة خاصة وليس حجزًا ضمن مجموعة مشتركة. لن نضم عائلتكم أو أصدقاءكم إلى عملاء لا يعرفون بعضهم.',
  detailTitle:'تفاصيل نراعيها عند التخطيط لمجموعتكم',
  detailCards:[['خطة تناسب مجموعتكم','أخبرونا بعدد البالغين والأطفال والرضع حتى نفهم احتياجات المسافرين.'],['السفر من الخارج','شاركوا بلد الإقامة والتاريخ المتوقع لمساعدتنا في مراجعة الطلب.'],['رد شخصي','سيراجع فريقنا التفاصيل ويتواصل معكم بعرض سعر مخصص.']],
  jeddahTitle:'تجربة تتجاوز التنقل بين المدينتين',
  jeddahText:'يمكنكم سؤال فريقنا عن تجربة جدة والتسوق في السوق الصومالي عندما يكون ذلك ممكنًا ضمن البرنامج النهائي المؤكد. سنوضح الترتيبات معكم قبل التأكيد.',
  stepsTitle:'خطوات بسيطة وواضحة',
  steps:[['01','أخبرونا عن مجموعتكم','شاركوا التاريخ المتوقع وتفاصيل المسافرين.'],['02','نراجع طلبكم','يتحقق فريقنا من التفاصيل والتوافر.'],['03','استلموا عرض السعر','نتواصل معكم لمناقشة الترتيبات المناسبة.']],
  formEyebrow:'ابدؤوا الطلب',
  formTitle:'لنخطط بما يناسب عائلتكم أو أصدقاءكم.',
  formText:'شاركونا بعض التفاصيل. إرسال النموذج هو طلب فقط، ولا تتأكد الرحلة حتى يتواصل معكم فريقنا.',
  reassurance:'لا يوجد دفع عبر الإنترنت · لا يوجد سعر عام ثابت للرحلات الخاصة · لن نضم إليكم ضيوفًا غرباء',
  footerNote:'رحلة تستحق أن تبقى في الذاكرة.',
  name:'الاسم الكامل',phone:'رقم الهاتف مع مفتاح الدولة',email:'البريد الإلكتروني (اختياري)',country:'بلد الإقامة',adults:'عدد البالغين',children:'عدد الأطفال',infants:'عدد الرضع',date:'موعد السفر المتوقع',notes:'ملاحظات إضافية (اختياري)',submit:'إرسال طلب الرحلة الخاصة',duration:'مدة الرحلة',durationValue:'10 أيام / 9 ليالٍ',success:'تم استلام طلبكم. سيراجعه فريقنا ويتواصل معكم.',required:'يرجى استكمال الحقول المطلوبة.',age:'العمر بالسنوات',ageMonths:'العمر بالأشهر',
  countries:['المملكة المتحدة','الولايات المتحدة','كندا','أستراليا','السويد','النرويج','الدنمارك','فنلندا','ألمانيا','هولندا','فرنسا','إيطاليا','المملكة العربية السعودية','أخرى']
 }
} as const;

export default async function FamilyFriendsPage(){
 const raw=(await cookies()).get('he_locale')?.value;
 const locale=isLocale(raw)?raw:defaultLocale;
 const t=copy[locale];
 const ar=locale==='ar';
 return <main dir={ar?'rtl':'ltr'} className="overflow-hidden bg-[#f7f3ea] text-[#063f35]">
  <section className="relative isolate overflow-hidden bg-[#063f35] text-white">
   <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cover bg-center opacity-45" style={{backgroundImage:"linear-gradient(90deg,rgba(6,63,53,.98) 0%,rgba(6,63,53,.84) 52%,rgba(6,63,53,.45) 100%),url(https://images.pexels.com/photos/8112552/pexels-photo-8112552.jpeg?auto=compress&cs=tinysrgb&w=2000)"}}/>
   <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full border border-[#c9a227]/30"/>
   <div aria-hidden="true" className="absolute -right-8 -top-12 -z-10 h-56 w-56 rounded-full border border-[#c9a227]/20"/>
   <div className="container grid min-h-[570px] items-center gap-12 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
    <div className="max-w-2xl">
     <p className="text-xs font-bold tracking-[.2em] text-[#e4c66c]">{t.eyebrow}</p>
     <h1 className="serif mt-5 text-4xl leading-[1.12] md:text-6xl">{t.title}</h1>
     <p className="mt-6 max-w-xl text-lg leading-8 text-white/90">{t.lead}</p>
     <p className="mt-4 max-w-xl leading-7 text-white/75">{t.text}</p>
     <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a href="#private-journey-request" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#c9a227] px-6 py-3 text-sm font-bold text-[#063f35] transition hover:bg-[#dfbd4f] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#063f35]">{t.cta}<span aria-hidden="true" className="ms-3">↗</span></a>
      <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">{t.secondary}</a>
     </div>
     <p className="mt-6 inline-flex rounded-full border border-[#c9a227]/50 bg-[#063f35]/65 px-4 py-2 text-xs font-semibold tracking-wide text-[#f4df9b]">✦ {t.badge}</p>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
     {t.features.map(([title,desc],i)=><article key={title} className="rounded-2xl border border-white/15 bg-[#f7f3ea]/10 p-5 backdrop-blur-md md:min-h-36">
      <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a227]/70 text-lg text-[#e4c66c]">{['✦','◇','◎','♡'][i]}</span>
      <h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-white/75">{desc}</p>
     </article>)}
    </div>
   </div>
   <div className="border-t border-white/10 bg-black/10"><div className="container grid gap-3 py-4 text-center text-xs font-medium text-white/75 sm:grid-cols-3"><span>{locale==='ar'?'خصوصية المجموعة أولويتنا':locale==='so'?'Asturnaanta kooxdu waa mudnaanteenna':'Your group’s privacy comes first'}</span><span>{locale==='ar'?'عرض سعر بعد مراجعة الطلب':locale==='so'?'Qiime kadib dib-u-eegis':'A quote after personal review'}</span><span>{locale==='ar'?'لا يوجد دفع عبر الإنترنت':locale==='so'?'Lacag online ah lagama qaadayo':'No online payment at this stage'}</span></div></div>
  </section>
  <section className="container grid gap-8 py-14 md:grid-cols-[.8fr_1.2fr] md:gap-16 md:py-20">
   <div><p className="text-xs font-bold tracking-[.18em] text-[#9b6a10]">{t.whyEyebrow}</p><h2 className="serif mt-4 text-3xl leading-tight md:text-4xl">{t.whyTitle}</h2></div>
   <div><p className="text-base leading-8 text-[#063f35]/75">{t.whyText}</p><div className="mt-7 rounded-2xl border border-[#c9a227]/45 bg-white p-6 md:p-8"><div className="flex items-start gap-4"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#063f35] text-xl text-[#e4c66c]">✦</span><div><h3 className="serif text-2xl">{t.promiseTitle}</h3><p className="mt-3 leading-7 text-[#063f35]/70">{t.promiseText}</p></div></div></div></div>
  </section>
  <section className="bg-white/70 py-14 md:py-20"><div className="container"><div className="max-w-2xl"><p className="text-xs font-bold tracking-[.18em] text-[#9b6a10]">{locale==='ar'?'تجربة مصممة حولكم':locale==='so'?'KHIBRADDII IDINKA KUGU HABBOON':'DESIGNED AROUND YOUR GROUP'}</p><h2 className="serif mt-4 text-3xl md:text-4xl">{t.detailTitle}</h2></div><div className="mt-8 grid gap-4 md:grid-cols-3">{t.detailCards.map(([title,body],i)=><article key={title} className="rounded-2xl border border-[#063f35]/10 bg-white p-6"><div className="text-xs font-bold tracking-[.16em] text-[#9b6a10]">0{i+1}</div><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-3 leading-7 text-[#063f35]/70">{body}</p></article>)}</div></div></section>
  <section className="container grid gap-8 py-14 md:grid-cols-2 md:items-center md:py-20"><div><p className="text-xs font-bold tracking-[.18em] text-[#9b6a10]">{locale==='ar'?'تجربة محلية عند توفرها':locale==='so'?'KHIBRADDA JEDDAH':'THE JEDDAH EXPERIENCE'}</p><h2 className="serif mt-4 text-3xl md:text-4xl">{t.jeddahTitle}</h2><p className="mt-4 leading-8 text-[#063f35]/75">{t.jeddahText}</p></div><div className="relative min-h-[260px] overflow-hidden rounded-3xl bg-[#063f35]"><div className="absolute inset-0 bg-cover bg-center opacity-80" style={{backgroundImage:"linear-gradient(0deg,rgba(6,63,53,.85),rgba(6,63,53,.05)),url(https://images.pexels.com/photos/1796730/pexels-photo-1796730.jpeg?auto=compress&cs=tinysrgb&w=1200)"}}/><div className="absolute inset-x-0 bottom-0 p-6 text-white"><p className="text-xs font-bold tracking-[.2em] text-[#e4c66c]">JEDDAH · SAUDI ARABIA</p><p className="serif mt-2 text-2xl">{locale==='ar'?'ثقافة وذكريات مشتركة':locale==='so'?'Dhaqan iyo xusuus wadaag':'Culture, connection & shared memories'}</p></div></div></section>
  <section id="how-it-works" className="bg-[#063f35] py-14 text-white md:py-20"><div className="container"><p className="text-xs font-bold tracking-[.18em] text-[#e4c66c]">{locale==='ar'?'بخطوات واضحة':locale==='so'?'TALLAABOOYIN CAD':'A CLEAR PROCESS'}</p><h2 className="serif mt-4 text-3xl md:text-4xl">{t.stepsTitle}</h2><div className="mt-8 grid gap-6 md:grid-cols-3">{t.steps.map(([number,title,body])=><article key={number} className="border-t border-[#c9a227]/55 pt-5"><p className="serif text-3xl text-[#e4c66c]">{number}</p><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 leading-7 text-white/70">{body}</p></article>)}</div></div></section>
  <section id="private-journey-request" className="scroll-mt-8 py-14 md:py-20"><div className="container grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-12"><div className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs font-bold tracking-[.18em] text-[#9b6a10]">{t.formEyebrow}</p><h2 className="serif mt-4 text-3xl leading-tight md:text-4xl">{t.formTitle}</h2><p className="mt-4 leading-8 text-[#063f35]/70">{t.formText}</p><div className="mt-6 rounded-2xl border border-[#c9a227]/35 bg-white p-5"><p className="text-sm font-semibold leading-7">{t.reassurance}</p><p className="mt-4 border-t border-[#063f35]/10 pt-4 text-xs font-bold tracking-[.15em] text-[#9b6a10]">{t.footerNote}</p></div></div><FamilyFriendsForm locale={locale} copy={{...t,formTitle:t.formTitle,formText:t.formText,countries:t.countries}}/></div></section>
 </main>;
}
