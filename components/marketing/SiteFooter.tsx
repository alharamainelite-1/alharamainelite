'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {siteConfig} from '@/lib/site';
import {whatsappUrl} from '@/lib/whatsapp';
import type {Locale} from '@/lib/i18n';

export function SiteFooter({locale='en'}:{locale?:Locale}){
  const pathname=usePathname();
  if(pathname==='/admin'||pathname.startsWith('/admin/'))return null;
  const copy={
    en:{explore:'Explore',speak:'Speak with us',whatsapp:'WhatsApp',request:'Request your journey',description:'Premium Umrah journeys thoughtfully designed for Somali Muslims around the world.',links:[['Packages','/packages'],['Experience','/experience'],["Women's Umrah",'/womens-umrah'],['Jeddah','/jeddah'],['Hotels','/hotels'],['FAQ','/faq']]},
    so:{explore:'Sahami',speak:'Nala xiriir',whatsapp:'WhatsApp',request:'Codso safarkaaga',description:'Safarro Cumro oo heer sare ah, si taxaddar leh loogu diyaariyay Muslimiinta Soomaaliyeed ee dunida ku nool.',links:[['Safarrada','/packages'],['Khibradda','/experience'],['Cumrada Haweenka','/womens-umrah'],['Jeddah','/jeddah'],['Hoteellada','/hotels'],['Su’aalaha','/faq']]},
    ar:{explore:'استكشف',speak:'تحدث معنا',whatsapp:'واتساب',request:'اطلب رحلتك',description:'رحلات عمرة راقية صُممت بعناية للمسلمين الصوماليين حول العالم.',links:[['الرحلات','/packages'],['التجربة','/experience'],['عمرة النساء','/womens-umrah'],['جدة','/jeddah'],['الفنادق','/hotels'],['الأسئلة الشائعة','/faq']]}
  }[locale];
  return <footer className="bg-forest text-white"><div className="container grid gap-10 py-16 md:grid-cols-3"><div><img src="/brand/alharamainelite-logo.png" alt={siteConfig.brandName} className="mb-5 h-20 w-20 object-contain bg-white"/><p className="serif text-2xl">{siteConfig.tagline}</p><p className="mt-4 max-w-sm text-white/70">{copy.description}</p></div><div><p className="eyebrow">{copy.explore}</p><div className="mt-5 grid gap-3 text-white/75">{copy.links.map(([x,h])=><Link key={h} href={h}>{x}</Link>)}</div></div><div><p className="eyebrow">{copy.speak}</p><p className="mt-5 text-white/75">{copy.whatsapp}</p><a href={whatsappUrl('Hello Alharamainelite, I would like to plan my journey.')} target="_blank" rel="noreferrer" className="mt-2 block text-xl text-gold">{siteConfig.whatsapp}</a><Link href="/request-journey" className="btn mt-6 border border-gold text-gold">{copy.request}</Link></div></div><div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</div></footer>
}