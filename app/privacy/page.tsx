import {cookies} from 'next/headers';
import {defaultLocale,isLocale} from '@/lib/i18n';

const copy={
 en:{title:'Privacy Policy',intro:'ALHARAMAIN ELITE respects your privacy. This page explains the information we collect when you request an Umrah journey or contact us, why we use it, and how you can ask about it.',sections:[
 ['Information we receive','We may receive your name, WhatsApp number, email address, country, city, preferred language, expected travel period, group size, package choice and notes that you choose to submit.'],
 ['Why we use it','We use request information to review your journey request, communicate with you, prepare an itinerary, answer questions and operate the booking workflow. We do not need more personal information than is reasonably necessary for these purposes.'],
 ['Analytics','The public website uses Google Analytics to understand traffic, page usage and journey-request conversions. Analytics may use cookies or similar technologies according to Google’s settings and applicable law.'],
 ['Sharing','We may share necessary journey information with service providers or partners only when needed to arrange confirmed services. We do not sell your personal information.'],
 ['Your choices','You can contact us through WhatsApp to ask about personal information you have submitted or to request clarification about its use. Some records may need to be retained where required for legitimate business, legal or operational reasons.'],
 ['Contact','For privacy questions, contact ALHARAMAIN ELITE through the WhatsApp number shown on our Contact page.']
 ]},
 so:{title:'Siyaasadda Asturnaanta',intro:'ALHARAMAIN ELITE waxay ixtiraamtaa asturnaantaada. Boggan wuxuu sharxayaa xogta aan helno marka aad codsato safar Cumro ama nala soo xiriirto iyo sida aan u isticmaalno.',sections:[
 ['Xogta aan helno','Waxaan heli karnaa magacaaga, lambarka WhatsApp, iimaylka, dalka, magaalada, luqadda, muddada safarka la filayo, tirada kooxda, xirmada aad dooratay iyo qoraallada aad adigu dirto.'],
 ['Sababta aan u isticmaalno','Waxaan xogta u isticmaalnaa inaan eegno codsigaaga, kula xiriirno, diyaarino qorshaha safarka, uga jawaabno su’aalaha oo aan u maamulno habka booking-ka.'],
 ['Analytics','Website-ku wuxuu isticmaalaa Google Analytics si loo fahmo booqashooyinka, isticmaalka bogagga iyo codsiyada safarka.'],
 ['La wadaagista xogta','Waxaan la wadaagi karnaa xogta lagama maarmaanka ah adeeg-bixiyeyaasha ama la-hawlgalayaasha marka loo baahdo adeegyada safarka ee la xaqiijiyey. Xogtaada ma iibino.'],
 ['Doorashooyinkaaga','Waxaad WhatsApp nagula soo xiriiri kartaa si aad wax uga weydiiso xogta aad dirtay ama isticmaalkeeda.'],
 ['Xiriir','Su’aalaha asturnaanta waxaad noogu soo diri kartaa WhatsApp-ka ku qoran bogga Contact.']
 ]},
 ar:{title:'سياسة الخصوصية',intro:'تحترم ALHARAMAIN ELITE خصوصيتك. توضح هذه الصفحة البيانات التي نتلقاها عند طلب رحلة عمرة أو التواصل معنا، ولماذا نستخدمها.',sections:[
 ['البيانات التي نتلقاها','قد نتلقى اسمك ورقم واتساب والبريد الإلكتروني والدولة والمدينة واللغة المفضلة والفترة المتوقعة للسفر وعدد الضيوف والباقات والملاحظات التي تختار إرسالها.'],
 ['لماذا نستخدمها','نستخدم البيانات لمراجعة طلب الرحلة والتواصل معك وإعداد البرنامج والإجابة عن الأسئلة وإدارة إجراءات الحجز.'],
 ['التحليلات','يستخدم الموقع Google Analytics لفهم الزيارات واستخدام الصفحات وطلبات الرحلات والتحويلات.'],
 ['مشاركة البيانات','قد نشارك البيانات الضرورية مع مقدمي الخدمات أو الشركاء عند الحاجة لترتيب الخدمات المؤكدة. لا نبيع بياناتك الشخصية.'],
 ['خياراتك','يمكنك التواصل معنا عبر واتساب للاستفسار عن البيانات التي أرسلتها أو كيفية استخدامها.'],
 ['التواصل','للاستفسارات المتعلقة بالخصوصية، تواصل معنا عبر واتساب الموجود في صفحة التواصل.']
 ]}
} as const;

export default async function Privacy(){
 const raw=(await cookies()).get('he_locale')?.value; const l=isLocale(raw)?raw:defaultLocale; const t=copy[l];
 return <section className="section"><div className="container max-w-4xl"><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-4 text-5xl text-forest md:text-6xl">{t.title}</h1><p className="mt-6 text-lg leading-8 text-forest/65">{t.intro}</p><div className="mt-12 space-y-10">{t.sections.map(([h,p])=><section key={h}><h2 className="serif text-3xl text-forest">{h}</h2><p className="mt-3 leading-8 text-forest/65">{p}</p></section>)}</div></div></section>;
}
