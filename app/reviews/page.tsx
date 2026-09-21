import {cookies} from 'next/headers';
import {defaultLocale,isLocale,pageCopy} from '@/lib/i18n';
import {Star} from 'lucide-react';

const experienceHighlights = {
  en: [
    ['Thoughtful planning','Clear communication, a considered itinerary and personal support from the first request.'],
    ['Small-group experience','A more personal journey designed around groups of up to 8 guests.'],
    ['Comfort & care','Premium accommodation, planned transportation and practical support throughout the journey.'],
    ['Somali connection','A service created with the language, culture and needs of the Somali diaspora in mind.'],
    ['Spiritual focus','Space to focus on Umrah while the important travel details are thoughtfully arranged.'],
    ['Clear expectations','Transparent package pricing, clear inclusions and confirmation before final arrangements.'],
  ],
  so: [
    ['Qorshe taxaddar leh','Isgaarsiin cad, jadwal si wanaagsan loo diyaariyay iyo taageero qofeed laga bilaabo codsiga koowaad.'],
    ['Khibrad koox yar','Safar qofeed oo loogu talagalay kooxo ilaa 8 marti ah.'],
    ['Raaxo iyo daryeel','Hoy heer sare ah, gaadiid la qorsheeyay iyo taageero wax ku ool ah inta safarku socdo.'],
    ['Xiriir Soomaali','Adeeg loo sameeyay iyadoo la fahmayo luqadda, dhaqanka iyo baahiyaha qurba-joogta Soomaaliyeed.'],
    ['Diiradda ruuxiga ah','Meel aad diiradda u saarto Cumrada iyadoo faahfaahinta safarka si taxaddar leh loo diyaariyo.'],
    ['Filashooyin cad','Qiimeyn cad, adeegyo si cad loo qeexay iyo xaqiijin ka hor qabanqaabada kama dambaysta ah.'],
  ],
  ar: [
    ['تخطيط مدروس','تواصل واضح وبرنامج مدروس ودعم شخصي منذ أول طلب.'],
    ['تجربة المجموعات الصغيرة','رحلة أكثر خصوصية مصممة لمجموعات تصل إلى 8 ضيوف.'],
    ['الراحة والاهتمام','إقامة راقية وتنقلات منظمة ودعم عملي طوال الرحلة.'],
    ['صلة بالجالية الصومالية','خدمة صُممت مع فهم اللغة والثقافة واحتياجات الجالية الصومالية.'],
    ['تركيز على العبادة','مساحة للتركيز على العمرة بينما يتم ترتيب التفاصيل المهمة بعناية.'],
    ['توقعات واضحة','أسعار واضحة وباقات محددة وتأكيد قبل الترتيبات النهائية.'],
  ],
} as const;

export default async function Reviews(){
  const raw=(await cookies()).get('he_locale')?.value;
  const l=isLocale(raw)?raw:defaultLocale;
  const t=pageCopy[l].reviews;
  const items=experienceHighlights[l];

  return <section className="section"><div className="container max-w-6xl">
    <div className="max-w-4xl">
      <div className="eyebrow">{t.eyebrow}</div>
      <h1 className="serif mt-4 text-6xl text-forest">{t.title}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-forest/60">
        {l==='en'?'A polished view of the experience standards built into every ALHARAMAIN ELITE journey. Guest reviews will be added as journeys are completed.':l==='so'?'Aragti kooban oo ku saabsan heerarka khibradda ee lagu dhisay safar kasta oo ALHARAMAIN ELITE ah. Faallooyinka martida waxaa lagu dari doonaa marka safarradu dhammaadaan.':'Aragti واضحة عن معايير التجربة التي بُنيت عليها رحلات ALHARAMAIN ELITE. ستتم إضافة آراء الضيوف عند إتمام الرحلات.'}
      </p>
    </div>

    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map(([title,text])=><article key={title} className="card p-7">
        <div className="flex gap-1" aria-label="Five star experience standard">
          {Array.from({length:5}).map((_,i)=><Star key={i} size={16} fill="currentColor" className="text-gold"/> )}
        </div>
        <div className="mt-5 text-lg font-semibold text-forest">{title}</div>
        <p className="mt-3 leading-7 text-forest/70">{text}</p>
      </article>)}
    </div>

    <div className="mt-10 max-w-3xl card p-8">
      <div className="eyebrow">{l==='en'?'Guest reviews':l==='so'?'Faallooyinka martida':'آراء الضيوف'}</div>
      <h2 className="serif mt-3 text-3xl text-forest">
        {l==='en'?'Real guest reviews are coming as journeys are completed.':l==='so'?'Faallooyinka dhabta ah waxay imaanayaan marka safarradu dhammaadaan.':'ستتم إضافة آراء الضيوف الحقيقية عند إتمام الرحلات.'}
      </h2>
      <p className="mt-3 text-sm leading-7 text-forest/60">
        {l==='en'?'This section is intentionally reserved for feedback from guests who complete an ALHARAMAIN ELITE journey.':l==='so'?'Qaybtan waxaa loogu talagalay faallooyinka martida dhammaystirta safarka ALHARAMAIN ELITE.':'هذا القسم مخصص لآراء الضيوف الذين يكملون رحلة ALHARAMAIN ELITE.'}
      </p>
    </div>
  </div></section>;
}
