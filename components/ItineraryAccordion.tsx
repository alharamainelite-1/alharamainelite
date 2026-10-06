'use client';

import {useState} from 'react';
import {ChevronDown,Check,Train,Plane,MapPinned} from 'lucide-react';

type Day=[string,string,string,string,string];

type Props={
  locale:'en'|'so'|'ar';
  slug:'signature'|'elite';
  eyebrow:string;
  title:string;
  intro:string;
  summary:string[];
  vipTitle:string;
  vipText:string;
  trainTitle:string;
  trainText:string;
  days:Day[];
  clarity:string;
};

export default function ItineraryAccordion({locale,slug,eyebrow,title,intro,summary,vipTitle,vipText,trainTitle,trainText,days,clarity}:Props){
  const [open,setOpen]=useState(false);
  const isAr=locale==='ar';
  const labels={
    en:{open:'View 10-day itinerary',close:'Hide itinerary',day:'DAY'},
    so:{open:'Eeg jadwalka 10-ka maalmood',close:'Qari jadwalka',day:'MAALINTA'},
    ar:{open:'عرض برنامج الرحلة لمدة 10 أيام',close:'إخفاء برنامج الرحلة',day:'اليوم'}
  }[locale];

  return <div className='mt-10'>
    <button type='button' onClick={()=>setOpen(v=>!v)} aria-expanded={open} className='group flex w-full items-center justify-between gap-5 rounded-[24px] border border-forest/10 bg-white p-5 text-start shadow-sm transition hover:border-gold/50 hover:shadow-md md:p-7'>
      <div className='min-w-0'>
        <div className='eyebrow'>{eyebrow}</div>
        <div className='mt-2 flex flex-wrap items-center gap-3'>
          <h2 className='serif text-3xl text-forest md:text-4xl'>{title}</h2>
          <span className='rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold text-forest/60'>{summary.join(' · ')}</span>
        </div>
        <p className='mt-2 max-w-3xl text-sm leading-6 text-forest/55'>{intro}</p>
      </div>
      <span className={'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-gold transition-transform '+(open?'rotate-180':'')}>
        <ChevronDown size={22}/>
      </span>
    </button>

    {open&&<div className='mt-4 overflow-hidden rounded-[28px] border border-forest/10 bg-white'>
      <div className='grid gap-5 border-b border-forest/10 p-6 md:grid-cols-2 md:p-7'>
        <div className='rounded-2xl border border-gold/35 bg-[#f7f3ea] p-5'>
          <div className='eyebrow'>{vipTitle}</div>
          <p className='mt-3 text-sm leading-7 text-forest/65'>{vipText}</p>
        </div>
        {slug==='elite'&&<div className='rounded-2xl bg-forest p-5 text-white'>
          <div className='eyebrow text-gold'>{trainTitle}</div>
          <p className='mt-3 text-sm leading-7 text-white/70'>{trainText}</p>
        </div>}
      </div>

      {days.map((item,index)=>{
        const [dayTitle,a,b,c,place]=item;
        const train=slug==='elite'&&(index===6||index===9);
        const Icon=train?Train:index===0||index===9?Plane:MapPinned;
        return <article key={dayTitle+index} className='grid gap-5 border-b border-forest/10 p-5 last:border-0 md:grid-cols-[82px_1fr_190px] md:items-center md:p-7'>
          <div className='flex items-center gap-4 md:block'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold'><span className='text-sm font-bold'>{index+1}</span></div>
            <div className='mt-2 text-[10px] font-bold uppercase tracking-[.16em] text-forest/45'>{labels.day} {index+1}</div>
          </div>
          <div>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='serif text-2xl text-forest'>{dayTitle}</h3>
              {train&&<span className='rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-forest'>{trainTitle}</span>}
            </div>
            <ul className='mt-3 space-y-2 text-sm leading-6 text-forest/65'>
              {[a,b,c].map((x,i)=><li key={i} className='flex gap-2'><Check size={16} className='mt-1 shrink-0 text-gold'/><span>{x}</span></li>)}
            </ul>
          </div>
          <div className='rounded-2xl bg-[#f7f3ea] p-4'>
            <div className='flex items-center gap-2 text-xs font-semibold text-forest'><Icon size={17} className='text-gold'/>{place}</div>
            <div className='mt-3 text-xs leading-5 text-forest/55'>{train?trainTitle:vipTitle}</div>
          </div>
        </article>;
      })}
      <div className='flex gap-3 bg-[#f7f3ea] p-5 text-sm leading-6 text-forest/55'><Check className='mt-1 shrink-0 text-gold' size={18}/><p>{clarity}</p></div>
    </div>}

    {open&&<button type='button' onClick={()=>setOpen(false)} className='mt-3 text-sm font-semibold text-forest underline decoration-gold decoration-2 underline-offset-4'>{labels.close}</button>}
  </div>;
}
