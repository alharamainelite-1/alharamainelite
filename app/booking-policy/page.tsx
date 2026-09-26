import {cookies} from 'next/headers';
import Link from 'next/link';
import {defaultLocale,isLocale} from '@/lib/i18n';

const copy={
 en:{title:'Booking & Payment Policy',intro:'A clear outline of how an ALHARAMAIN ELITE journey moves from an initial request to a confirmed itinerary.',items:[
 ['1. Request','Choose SIGNATURE or ELITE, select 5–8 guests and provide an expected travel date or period.'],
 ['2. Review','Our team reviews the request and follows up with you directly to clarify the group, timing and required arrangements.'],
 ['3. Final itinerary','The confirmed itinerary states the services included, accommodation and operational arrangements that have been agreed for the journey.'],
 ['4. Payment','At launch, payment is handled by bank transfer rather than online card payment. Payment instructions are provided after the relevant journey details are confirmed.'],
 ['5. Flights','International flights are not included unless they are expressly confirmed in the final itinerary.'],
 ['6. Changes and cancellation','Any cancellation, refund or change terms applicable to a confirmed booking will be stated in the booking or final itinerary documents. Please do not assume that an amount is refundable unless the applicable terms say so.'],
 ['7. Regulatory information','Umrah and travel services in Saudi Arabia are subject to applicable regulations and licensing requirements. Customers can verify licensed Umrah companies through the Saudi Ministry of Hajj and Umrah’s official inquiry service.']
 ]},
 so:{title:'Siyaasadda Booking iyo Lacag-bixinta',intro:'Sharaxaad cad oo ku saabsan sida codsiga ALHARAMAIN ELITE uga gudbo codsi hore ilaa qorshe la xaqiijiyey.',items:[
 ['1. Codsi','Dooro SIGNATURE ama ELITE, dooro 5–8 marti, oo bixi taariikh ama muddo safar oo la filayo.'],
 ['2. Dib-u-eegis','Kooxdayadu waxay dib u eegtaa codsiga waxayna kula xiriirtaa si toos ah.'],
 ['3. Barnaamijka kama dambaysta ah','Barnaamijka la xaqiijiyey wuxuu caddeeyaa adeegyada, hoyga iyo qabanqaabada la isku raacay.'],
 ['4. Lacag-bixin','Bilowga, lacag-bixintu waxay ku dhacaysaa bank transfer, ma aha card online. Tilmaamaha lacag-bixinta waxaa la bixiyaa marka faahfaahinta la xaqiijiyo.'],
 ['5. Duulimaad','Duulimaadyada caalamiga ah kuma jiraan haddii aan si cad loogu xaqiijin barnaamijka ugu dambeeya.'],
 ['6. Isbeddel iyo baajin','Shuruudaha baajinta, soo-celinta ama isbeddelka ee booking la xaqiijiyey waxaa lagu caddeyn doonaa dukumentiyada booking-ka ama barnaamijka kama dambaysta ah.'],
 ['7. Xeerarka','Adeegyada Cumrada iyo safarrada ee Saudi Arabia waxay ku xiran yihiin xeerarka iyo shuruudaha ruqsadaha.']
 ]},
 ar:{title:'سياسة الحجز والدفع',intro:'توضيح لمسار رحلة ALHARAMAIN ELITE من الطلب الأولي إلى البرنامج المؤكد.',items:[
 ['1. الطلب','اختر SIGNATURE أو ELITE وحدد 5–8 ضيوف وشارك تاريخًا أو فترة متوقعة للسفر.'],
 ['2. المراجعة','يراجع فريقنا الطلب ويتواصل معك لتوضيح المجموعة والتوقيت والترتيبات المطلوبة.'],
 ['3. البرنامج النهائي','يوضح البرنامج المؤكد الخدمات والإقامة والترتيبات التشغيلية التي تم الاتفاق عليها.'],
 ['4. الدفع','عند الإطلاق يتم الدفع عن طريق التحويل البنكي وليس الدفع الإلكتروني بالبطاقة. ترسل تعليمات التحويل بعد تأكيد التفاصيل ذات الصلة.'],
 ['5. الرحلات الجوية','الرحلات الدولية غير مشمولة ما لم يتم تأكيدها صراحة في البرنامج النهائي.'],
 ['6. التغيير والإلغاء','توضح شروط الإلغاء والاسترداد أو التعديل الخاصة بالحجز المؤكد في مستندات الحجز أو البرنامج النهائي.'],
 ['7. الأنظمة','تخضع خدمات العمرة والسفر في السعودية للأنظمة ومتطلبات الترخيص المعمول بها.']
 ]}
} as const;

export default async function BookingPolicy(){
 const raw=(await cookies()).get('he_locale')?.value; const l=isLocale(raw)?raw:defaultLocale; const t=copy[l];
 return <section className="section"><div className="container max-w-4xl"><div className="eyebrow">ALHARAMAIN ELITE</div><h1 className="serif mt-4 text-5xl text-forest md:text-6xl">{t.title}</h1><p className="mt-6 text-lg leading-8 text-forest/65">{t.intro}</p><div className="mt-12 space-y-8">{t.items.map(([h,p])=><section key={h}><h2 className="serif text-3xl text-forest">{h}</h2><p className="mt-3 leading-8 text-forest/65">{p}</p></section>)}</div><div className="mt-12 card bg-[#f7f3ea] p-7"><p className="text-sm leading-7 text-forest/70">Verify licensed Umrah providers through the <a className="underline" href="https://haj.gov.sa/en/E-Services/Inquire-About-Licensed-Umrah-Companies-and-Establishments" target="_blank" rel="noreferrer">Saudi Ministry of Hajj and Umrah</a>.</p><Link href="/request-journey" className="btn btn-primary mt-6">{l==='ar'?'اطلب رحلتك':l==='so'?'Codso safarkaaga':'Request your journey'}</Link></div></div></section>;
}
