import {cookies} from 'next/headers';
import {defaultLocale,isLocale} from '@/lib/i18n';

const copy={
 en:{title:'Terms of Use',intro:'These terms describe the basic conditions for using the ALHARAMAIN ELITE website and submitting a journey request.',sections:[
 ['Journey requests are not bookings','Submitting a request does not confirm a booking, flight, hotel or payment. Our team reviews the information and communicates the final itinerary and confirmation steps.'],
 ['Published package prices','SIGNATURE is published at $2,000 per guest and ELITE at $2,500 per guest. Both are 10 days / 9 nights. The final itinerary states the services included for the confirmed journey.'],
 ['Flights and optional services','International flights are not included unless expressly confirmed in the final itinerary. Services that are not listed as included should not be assumed to be included.'],
 ['Accuracy of information','You are responsible for providing accurate contact, guest and travel-period information. We may ask for clarification before confirming arrangements.'],
 ['Website content','We aim to keep prices, inclusions and operational information current. Specific availability, hotel assignments, transportation and other arrangements are subject to confirmation.'],
 ['Contact','Questions about a journey should be sent through the contact details shown on the website.']
 ]},
 so:{title:'Shuruudaha Isticmaalka',intro:'Shuruudahani waxay sharxayaan isticmaalka website-ka ALHARAMAIN ELITE iyo dirista codsiga safarka.',sections:[
 ['Codsiga safarku ma aha booking','Dirista codsi ma xaqiijiso booking, duulimaad, hotel ama lacag-bixin. Kooxdayadu waxay dib u eegtaa xogta waxayna kula xiriirtaa xaqiijinta ugu dambaysa.'],
 ['Qiimaha la daabacay','SIGNATURE waa $2,000 qofkiiba, ELITE-na waa $2,500 qofkiiba. Labaduba waa 10 maalmood / 9 habeen.'],
 ['Duulimaadyada','Duulimaadyada caalamiga ah kuma jiraan haddii aan si cad loogu xaqiijin barnaamijka ugu dambeeya.'],
 ['Xog sax ah','Waxaad mas’uul ka tahay saxnaanta xogta xiriirka, martida iyo muddada safarka.'],
 ['Macluumaadka website-ka','Waxaan isku daynaa inaan cusbooneysiino qiimaha, adeegyada iyo xogta hawlgalka. Helitaanka iyo adeegyada ugu dambeeya waxay ku xiran yihiin xaqiijin.'],
 ['Xiriir','Su’aalaha safarka waxaa lagu soo diri karaa xogta xiriirka ee website-ka.']
 ]},
 ar:{title:'شروط الاستخدام',intro:'توضح هذه الشروط الأساسيات المتعلقة باستخدام موقع ALHARAMAIN ELITE وإرسال طلب رحلة.',sections:[
 ['طلب الرحلة ليس حجزًا','إرسال الطلب لا يعني تأكيد الحجز أو الطيران أو الفندق أو الدفع. يراجع فريقنا البيانات ويتواصل معك بشأن البرنامج والتأكيد النهائي.'],
 ['الأسعار المنشورة','SIGNATURE بسعر 2,000 دولار للضيف وELITE بسعر 2,500 دولار للضيف، ومدة كل منهما 10 أيام و9 ليالٍ. يوضح البرنامج النهائي الخدمات المؤكدة.'],
 ['الرحلات والخدمات الإضافية','الرحلات الدولية غير مشمولة ما لم يتم تأكيدها صراحة في البرنامج النهائي.'],
 ['دقة المعلومات','أنت مسؤول عن تقديم بيانات صحيحة للتواصل والضيوف والفترة المتوقعة للسفر.'],
 ['محتوى الموقع','نحرص على تحديث الأسعار والخدمات والمعلومات التشغيلية، بينما يخضع توفر الخدمات والتفاصيل النهائية للتأكيد.'],
 ['التواصل','يمكن إرسال الاستفسارات عبر بيانات التواصل الموجودة في الموقع.']
 ]}
} as const;

export default async function Terms(){
 const raw=(await cookies()).get('he_locale')?.value; const l=isLocale(raw)?raw:defaultLocale; const t=copy[l];
 return <section className="section"><div className="container max-w-4xl"><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-4 text-5xl text-forest md:text-6xl">{t.title}</h1><p className="mt-6 text-lg leading-8 text-forest/65">{t.intro}</p><div className="mt-12 space-y-10">{t.sections.map(([h,p])=><section key={h}><h2 className="serif text-3xl text-forest">{h}</h2><p className="mt-3 leading-8 text-forest/65">{p}</p></section>)}</div></div></section>;
}
