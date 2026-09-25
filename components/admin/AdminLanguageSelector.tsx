'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
export function AdminLanguageSelector(){
 const router=useRouter(); const [locale,setLocale]=useState<'en'|'ar'>('ar');
 useEffect(()=>{const m=document.cookie.match(/(?:^|; )he_locale=([^;]+)/);if(m?.[1]==='ar')setLocale('ar');},[]);
 function change(next:'en'|'ar'){setLocale(next);document.cookie=`he_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;router.refresh();}
 return <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-1 text-xs" aria-label="Admin language"><button type="button" onClick={()=>change('en')} aria-pressed={locale==='en'} className={`rounded-full px-3 py-1.5 ${locale==='en'?'bg-white text-forest':'text-white/70'}`}>EN</button><button type="button" onClick={()=>change('ar')} aria-pressed={locale==='ar'} className={`rounded-full px-3 py-1.5 ${locale==='ar'?'bg-white text-forest':'text-white/70'}`}>العربية</button></div>;
}