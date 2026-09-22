'use client';
import {usePathname, useRouter} from 'next/navigation';
import {useState} from 'react';
import {locales} from '@/lib/i18n';
import type {Locale} from '@/lib/i18n';

function routeForLocale(pathname: string, locale: Locale) {
  const clean = pathname.replace(/^\/(so|ar)(?=\/|$)/, '') || '/';
  return locale === 'en' ? clean : `/${locale}${clean === '/' ? '' : clean}`;
}

export function LanguageSwitcher({locale='en'}:{locale?:Locale}){
  const router=useRouter();
  const pathname=usePathname() || '/';
  const[s,setS]=useState(locale);
  function change(v:Locale){
    setS(v);
    document.cookie=`he_locale=${v};path=/;max-age=31536000;samesite=lax`;
    router.push(routeForLocale(pathname,v));
    router.refresh();
  }
  return <select aria-label="Language" value={s} onChange={e=>change(e.target.value as Locale)} className="border border-forest/10 bg-white/60 px-2 py-2 text-xs font-semibold tracking-widest text-forest focus:ring-0">
    {locales.map(x=><option key={x} value={x}>{x==='en'?'EN':x==='so'?'SO':'عربي'}</option>)}
  </select>
}
