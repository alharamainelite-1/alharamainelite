import type { Metadata } from 'next';
export const metadata: Metadata = { robots: { index: false, follow: false } };
import Link from 'next/link';
import Script from 'next/script';
import {cookies} from 'next/headers';
import {defaultLocale,isLocale} from '@/lib/i18n';

const copy={
  en:{eyebrow:'Journey request received',title:'YOUR JOURNEY REQUEST HAS BEEN RECEIVED.',thanks:'Thank you for trusting ALHARAMAIN ELITE with your journey. Your request has been received and our team will review it before contacting you on WhatsApp.',ref:'Request reference',total:'Estimated total',next:'WHAT HAPPENS NEXT?',one:'REQUEST RECEIVED',oneText:'Your journey details are safely with our team.',two:'OUR TEAM REVIEWS YOUR REQUEST',twoText:'We review your travel period, journey and group details.',three:'WE CONTACT YOU PERSONALLY',threeText:'A member of our team will contact you directly on WhatsApp.',bottom:'Your journey begins with a conversation.',bottomText:'We look forward to welcoming you.',home:'Return home'},
  so:{eyebrow:'Codsiga safarka waa la helay',title:'CODSIGA SAFARKAAGA WAA LA HELAY.',thanks:'Waad ku mahadsan tahay kalsoonida aad ALHARAMAIN ELITE siisay. Kooxdayadu way dib u eegi doontaa codsigaaga waxayna WhatsApp kula soo xiriiri doontaa.',ref:'Tixraaca codsiga',total:'Wadarta qiyaasta',next:'MAXAA XIGA?',one:'CODSIGA WAA LA HELAY',oneText:'Faahfaahinta safarkaaga waxay si ammaan ah u gaartay kooxdayada.',two:'KOOXDAYADU WAY DIB U EEGEYSAA',twoText:'Waxaan dib u eegaynaa muddada safarka, safarka iyo faahfaahinta kooxda.',three:'SI GAAR AH AYAAN KULA SOO XIRIIRAYNAA',threeText:'Xubin ka tirsan kooxdayada ayaa WhatsApp kula soo xiriiri doonta.',bottom:'Safarkaagu wuxuu ka bilaabmaa wada sheekeysi.',bottomText:'Waxaan rajaynaynaa inaan ku soo dhoweyno.',home:'Ku noqo bogga hore'},
  ar:{eyebrow:'تم استلام طلب الرحلة',title:'تم استلام طلب رحلتك.',thanks:'شكرًا لثقتك في ALHARAMAIN ELITE. تم استلام طلبك وسيراجعه فريقنا ثم يتواصل معك عبر واتساب.',ref:'مرجع الطلب',total:'التكلفة التقديرية',next:'ماذا يحدث بعد ذلك؟',one:'تم استلام الطلب',oneText:'وصلت تفاصيل رحلتك بأمان إلى فريقنا.',two:'يراجع فريقنا طلبك',twoText:'نراجع فترة السفر والرحلة وتفاصيل المجموعة.',three:'نتواصل معك شخصيًا',threeText:'سيتواصل معك أحد أعضاء فريقنا مباشرة عبر واتساب.',bottom:'رحلتك تبدأ بمحادثة.',bottomText:'نتطلع إلى الترحيب بك.',home:'العودة للرئيسية'}
} as const;

export default async function RequestSuccess({searchParams}:{searchParams:Promise<{reference?:string;total?:string}>}){
  const p=await searchParams;
  const raw=(await cookies()).get('he_locale')?.value;
  const locale=isLocale(raw)?raw:defaultLocale;
  const t=copy[locale];
  const total=p.total?Number(p.total):null;
  const reference=p.reference||'';
  const safeReference=JSON.stringify(reference).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  const analytics="window.gtag&&window.gtag('event','request_success',{request_reference:"+safeReference+"})";
  return <><Script id="request-success-event">{analytics}</Script><section className="section"><div className="container max-w-3xl"><div className="card overflow-hidden p-8 md:p-14">
    <div className="eyebrow">{t.eyebrow}</div>
    <h1 className="serif mt-4 text-4xl leading-tight text-forest md:text-6xl">{t.title}</h1>
    <p className="mt-6 text-lg leading-8 text-forest/65">{t.thanks}</p>
    <div className="mt-8 grid gap-4 bg-[#f2eee3] p-6 sm:grid-cols-2">
      <div><div className="eyebrow">{t.ref}</div><div className="mt-2 font-semibold tracking-wide text-forest">{reference||'HE-REQUEST'}</div></div>
      <div><div className="eyebrow">{t.total}</div><div className="mt-2 font-semibold text-forest">{total!==null&&Number.isFinite(total)?'$'+total.toLocaleString():'—'}</div></div>
    </div>
    <h2 className="serif mt-12 text-3xl text-forest">{t.next}</h2>
    <div className="mt-6 space-y-5 text-forest/70">
      <div className="flex gap-4"><b className="text-gold">01</b><div><b className="text-forest">{t.one}</b><p className="mt-1">{t.oneText}</p></div></div>
      <div className="flex gap-4"><b className="text-gold">02</b><div><b className="text-forest">{t.two}</b><p className="mt-1">{t.twoText}</p></div></div>
      <div className="flex gap-4"><b className="text-gold">03</b><div><b className="text-forest">{t.three}</b><p className="mt-1">{t.threeText}</p></div></div>
    </div>
    <div className="gold-rule my-10"/><h2 className="serif text-3xl text-forest">{t.bottom}</h2><p className="mt-3 leading-7 text-forest/60">{t.bottomText}</p>
    <Link className="btn btn-outline mt-8" href="/">{t.home}</Link>
  </div></div></section></>;
}