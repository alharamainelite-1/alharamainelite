import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {cookies} from 'next/headers';
import {packages} from '@/lib/site';
import {defaultLocale,isLocale,pageCopy} from '@/lib/i18n';
import type {Metadata} from 'next';
import {Check, Hotel, Utensils, Car, MapPinned, Smartphone, Headphones, Train, Plane, ArrowRight} from 'lucide-react';
const hero='https://images.pexels.com/photos/32839113/pexels-photo-32839113.jpeg?auto=compress&cs=tinysrgb&w=2200';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> {
  const {slug}=await params;
  const p=packages[slug as 'signature'|'elite'];
  if(!p) return {};
  const title=`${p.name} Umrah Journey — $${p.price.toLocaleString()} per guest`;
  const description=slug==='elite'
    ? 'ELITE is a 10-day / 9-night premium Umrah journey at $2,500 per guest, designed for small groups.'
    : 'SIGNATURE is a 10-day / 9-night premium Umrah journey at $2,000 per guest, designed for small groups.';
  return { title, description, alternates:{canonical:`/packages/${slug}`}, openGraph:{title,description,type:'website'} };
}

const labels={
  en:{
    included:'What your journey includes',
    includedIntro:'Everything below is arranged as part of your confirmed journey, so you know exactly what you are paying for.',
    coreTitle:'Included in both journeys',
    eliteTitle:'ELITE — additional experience',
    not:'Not included',
    notIntro:'International flights are the only item outside the journey price.',
    ready:'Ready when you are',
    request:'Request this journey',
    compare:'Compare journeys',
    duration:'10 days / 9 nights',
    flights:'International flights are not included',
    features:[
      ['Premium hotels in Makkah & Madinah','Comfortable, carefully selected accommodation for your stay.'],
      ['Daily breakfast','Breakfast included throughout the journey according to the confirmed hotel arrangement.'],
      ['Private transportation','Private, air-conditioned transportation for the transfers and activities included in your itinerary.'],
      ['Makkah & Madinah ziyarat','Guided ziyarat to selected sites in the two Holy Cities as planned in your journey.'],
      ['Jeddah experience','A curated Jeddah experience, including cultural and shopping time where included in your itinerary.'],
      ['SIM card with internet','A SIM card with internet to help you stay connected during your journey.'],
      ['Journey support','Personal coordination and support throughout the planning and confirmed journey.']
    ],
    eliteExtra:[['Haramain Train','Haramain Train travel is included in ELITE where applicable to the confirmed journey plan.']],
    notList:['International flights']
  },
  so:{
    included:'Waxa safarkaagu ku jiro',
    includedIntro:'Wax kasta oo hoos ku qoran waxaa lagu diyaarinayaa safarkaaga la xaqiijiyay, si aad si cad u ogaato waxa qiimahaagu daboolayo.',
    coreTitle:'Labada safarba waxaa ku jira',
    eliteTitle:'ELITE — khibrad dheeraad ah',
    not:'Kuma jiraan',
    notIntro:'Duulimaadyada caalamiga ah ayaa ah waxa keliya ee aan ku jirin qiimaha safarka.',
    ready:'Markaad diyaar tahay',
    request:'Codso safarkan',
    compare:'Is barbar dhig safarrada',
    duration:'10 maalmood / 9 habeen',
    flights:'Duulimaadyada caalamiga ah kuma jiraan',
    features:[
      ['Hoteello heer sare ah oo Makkah iyo Madiinah ah','Hoy raaxo leh oo si taxaddar leh loo doortay muddada safarkaaga.'],
      ['Quraac maalinle ah','Quraac maalinle ah sida lagu xaqiijiyay qorshaha hoteelka.'],
      ['Gaadiid gaar ah','Gaadiid gaar ah oo qaboojiye leh oo loogu talagalay wareejinta iyo hawlaha ku jira barnaamijka.'],
      ['Ziyaraat Makkah iyo Madiinah','Ziyaraat hagitaan leh oo lagu booqdo goobaha la qorsheeyay ee labada magaalo ee barakeysan.'],
      ['Khibradda Jeddah','Khibrad Jeddah oo la qorsheeyay, oo ay ku jiraan dhaqan iyo dukaamaysi marka ay ku jiraan barnaamijka.'],
      ['SIM internet leh','SIM internet leh si aad ula xiriirto dadkaaga inta safarka lagu jiro.'],
      ['Taageerada safarka','Xiriir iyo taageero qofeed inta lagu jiro qorsheynta iyo safarka la xaqiijiyay.']
    ],
    eliteExtra:[['Haramain Train','Safarka Haramain Train wuxuu ku jiraa ELITE marka uu ku habboon yahay qorshaha safarka la xaqiijiyay.']],
    notList:['Duulimaadyada caalamiga ah']
  },
  ar:{
    included:'ما الذي تتضمنه رحلتك؟',
    includedIntro:'كل ما يلي يتم ترتيبه ضمن رحلتك المؤكدة، لتعرف بوضوح ما يشمله السعر.',
    coreTitle:'مشمول في الرحلتين',
    eliteTitle:'ELITE — تجربة إضافية',
    not:'غير مشمول',
    notIntro:'الرحلات الدولية هي العنصر الوحيد خارج سعر الرحلة.',
    ready:'عندما تكون مستعدًا',
    request:'اطلب هذه الرحلة',
    compare:'مقارنة الرحلات',
    duration:'10 أيام / 9 ليالٍ',
    flights:'الرحلات الدولية غير مشمولة',
    features:[
      ['فنادق راقية في مكة والمدينة','إقامة مريحة يتم اختيارها بعناية طوال الرحلة.'],
      ['وجبة إفطار يومية','وجبة إفطار يومية وفق ترتيب الفندق المؤكد.'],
      ['تنقلات خاصة','تنقلات خاصة ومكيفة للانتقالات والأنشطة المدرجة في برنامجك.'],
      ['زيارات مكة والمدينة','زيارات بإرشاد إلى مواقع مختارة في المدينتين المقدستين وفق البرنامج.'],
      ['تجربة جدة','تجربة مختارة في جدة تشمل الثقافة والتسوق حيث يتم تضمينها في البرنامج.'],
      ['شريحة إنترنت','شريحة اتصال مع إنترنت لتبقى على تواصل خلال الرحلة.'],
      ['دعم ومساندة الرحلة','تنسيق ودعم شخصي خلال مرحلة التخطيط والرحلة المؤكدة.']
    ],
    eliteExtra:[['قطار الحرمين','تشمل ELITE رحلة قطار الحرمين حيث يناسب برنامج الرحلة المؤكد.']],
    notList:['الرحلات الدولية']
  }
};}