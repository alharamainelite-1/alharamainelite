'use client';

import {useState} from 'react';
import {ChevronDown,Check,Plane,Train,Hotel,Utensils,Car,MapPinned,Smartphone,Headphones,Globe2,ShieldCheck} from 'lucide-react';

type Feature=readonly string[];

type Props={
  locale:'en'|'so'|'ar';
  slug:'signature'|'elite';
  eyebrow:string;
  title:string;
  intro:string;
  coreTitle:string;
  eliteTitle:string;
  notTitle:string;
  notIntro:string;
  notItem:string;
  features:readonly Feature[];
  eliteExtra:readonly Feature[];
  signatureNote:string;
  ready:string;
  readyText:string;
  request:string;
  compare:string;
};

export default function IncludedAccordion({locale,slug,eyebrow,title,intro,coreTitle,eliteTitle,notTitle,notIntro,notItem,features,eliteExtra,signatureNote,ready,readyText,request,compare}:Props){
  const [open,setOpen]=useState(false);
  const icons=[Hotel,Utensils,Car,MapPinned,MapPinned,Smartphone,Headphones,Globe2,ShieldCheck] as const;
  const labels={
    en:{open:'View what is included',close:'Hide inclusions'},
    so:{open:'Eeg waxa ku jira safarka',close:'Qari waxa ku jira'},
    ar:{open:'عرض ما تتضمنه الرحلة',close:'إخفاء المزايا المشمولة'}
  }[locale];

  return <div className='mt-10'>
    <button type='button' onClick={()=>setOpen(v=>!v)} aria-expanded={open} className='group flex w-full items-center justify-between gap-5 rounded-[24px] border border-forest/10 bg-white p-5 text-start shadow-sm transition hover:border-gold/50 hover:shadow-md md:p-7'>
      <div className='min-w-0'>
        <div className='eyebrow'>{eyebrow}</div>
        <div className='mt-2 flex flex-wrap items-center gap-3'>
          <h2 className='serif text-3xl text-forest md:text-4xl'>{title}</h2>
          <span className='rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest/60'>{features.length + (slug==='elite'?eliteExtra.length:0)} {locale==='ar'?'مزايا رئيسية':locale==='so'?'adeeg': 'key inclusions'}</span>
        </div>
        <p className='mt-2 max-w-3xl text-sm leading-6 text-forest/55'>{intro}</p>
      </div>
      <span className={'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-gold transition-transform '+(open?'rotate-180':'')}>
        <ChevronDown size={22}/>
      </span>
    </button>

    {open&&<div className='mt-4'>
      <div className='grid gap-10 lg:grid-cols-[1fr_360px]'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold'><Check size={20}/></div>
            <h3 className='serif text-3xl text-forest'>{coreTitle}</h3>
          </div>
          <div className='mt-6 grid gap-4 sm:grid-cols-2'>
            {features.map(([featureTitle,desc],i)=>{
              const Icon=icons[i];
              return <div key={featureTitle} className='group rounded-2xl border border-forest/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg'>
                <div className='flex items-start gap-4'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest text-gold'><Icon size={20}/></div>
                  <div><h4 className='font-semibold text-forest'>{featureTitle}</h4><p className='mt-2 text-sm leading-6 text-forest/60'>{desc}</p></div>
                </div>
              </div>;
            })}
          </div>

          <div className='mt-10 rounded-2xl border border-gold/35 bg-white p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold'><Train size={20}/></div>
              <h3 className='serif text-2xl text-forest'>{eliteTitle}</h3>
            </div>
            {slug==='elite'
              ? <div className='mt-5 grid gap-4'>{eliteExtra.map(([featureTitle,desc])=><div key={featureTitle} className='flex gap-4 rounded-xl bg-[#f7f3ea] p-5'><div className='mt-1 text-gold'><Check size={18}/></div><div><h4 className='font-semibold text-forest'>{featureTitle}</h4><p className='mt-1 text-sm leading-6 text-forest/60'>{desc}</p></div></div>)}</div>
              : <p className='mt-4 text-sm leading-6 text-forest/55'>{signatureNote}</p>}
          </div>

          <div className='mt-10 rounded-2xl border border-forest/10 bg-white p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-forest text-gold'><Plane size={19}/></div>
              <div><h3 className='font-semibold text-forest'>{notTitle}</h3><p className='mt-1 text-sm text-forest/55'>{notIntro}</p></div>
            </div>
            <div className='mt-5 flex items-center gap-3 border-t border-forest/10 pt-4 text-forest/75'><Plane size={17} className='text-gold'/><span>{notItem}</span></div>
          </div>
        </div>

        <aside className='card h-fit p-7 lg:sticky lg:top-28'>
          <div className='eyebrow'>{ready}</div>
          <p className='mt-4 leading-7 text-forest/65'>{readyText}</p>
          <a href={'/request-journey?package='+slug} className='btn btn-primary mt-6 w-full'>{request}</a>
          <a href='/packages' className='btn btn-outline mt-3 w-full'>{compare}</a>
        </aside>
      </div>
      <button type='button' onClick={()=>setOpen(false)} className='mt-4 text-sm font-semibold text-forest underline decoration-gold decoration-2 underline-offset-4'>{labels.close}</button>
    </div>}

    {!open&&<div className='mt-3 text-center text-xs text-forest/45'>{labels.open}</div>}
  </div>;
}
