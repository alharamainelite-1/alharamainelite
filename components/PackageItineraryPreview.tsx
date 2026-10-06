'use client';

import {useState} from 'react';
import Link from 'next/link';
import {ChevronDown,Check,Train} from 'lucide-react';

type Props={
  locale:'en'|'so'|'ar';
  slug:'signature'|'elite';
};

const days={
  en:[
    ['Day 1','Arrival in Makkah'],['Day 2','Umrah'],['Day 3','Makkah Programme'],['Day 4','Makkah Programme'],['Day 5','Makkah Programme'],
    ['Day 6','Jeddah Experience · return to Makkah evening'],['Day 7','Makkah → Madinah'],['Day 8','Madinah Programme'],['Day 9','Madinah Programme'],['Day 10','Departure · Madinah → Jeddah Airport']
  ],
  so:[
    ['Maalinta 1','Imaatinka Makkah'],['Maalinta 2','Cumro'],['Maalinta 3','Barnaamijka Makkah'],['Maalinta 4','Barnaamijka Makkah'],['Maalinta 5','Barnaamijka Makkah'],
    ['Maalinta 6','Khibradda Jeddah · fiidkii Makkah ku soo laabasho'],['Maalinta 7','Makkah → Madiinah'],['Maalinta 8','Barnaamijka Madiinah'],['Maalinta 9','Barnaamijka Madiinah'],['Maalinta 10','Bixitaanka · Madiinah → Madaarka Jeddah']
  ],
  ar:[
    ['اليوم 1','الوصول إلى مكة'],['اليوم 2','العمرة'],['اليوم 3','برنامج مكة'],['اليوم 4','برنامج مكة'],['اليوم 5','برنامج مكة'],
    ['اليوم 6','تجربة جدة · العودة إلى مكة مساءً'],['اليوم 7','مكة → المدينة'],['اليوم 8','برنامج المدينة'],['اليوم 9','برنامج المدينة'],['اليوم 10','المغادرة · المدينة → مطار جدة']
  ]
} as const;

export default function PackageItineraryPreview({locale,slug}:Props){
  const [open,setOpen]=useState(false);
  const t={
    en:{button:'View 10-day itinerary',close:'Hide itinerary',summary:'5 days Makkah · 1 day Jeddah · 4 days Madinah',vip:'Private VIP transportation throughout the journey',elite:'Two Haramain Train journeys: Makkah → Madinah and Madinah → Jeddah Airport',details:'See full journey details'},
    so:{button:'Eeg jadwalka 10-ka maalmood',close:'Qari jadwalka',summary:'5 maalmood Makkah · 1 maalin Jeddah · 4 maalmood Madiinah',vip:'Gaadiid VIP gaar ah inta safarku socdo',elite:'Laba safar Haramain Train: Makkah → Madiinah iyo Madiinah → Madaarka Jeddah',details:'Eeg faahfaahinta safarka'},
    ar:{button:'عرض برنامج الرحلة لمدة 10 أيام',close:'إخفاء البرنامج',summary:'5 أيام مكة · يوم جدة · 4 أيام المدينة',vip:'سيارة VIP خاصة طوال الرحلة',elite:'رحلتا قطار الحرمين: مكة → المدينة والمدينة → مطار جدة',details:'عرض تفاصيل الرحلة'}
  }[locale];

  return <div className='mt-7 border-t border-forest/10 pt-6'>
    <button type='button' onClick={()=>setOpen(v=>!v)} aria-expanded={open} className='flex w-full items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-[#f7f3ea] p-4 text-start transition hover:border-gold/50'>
      <span><span className='block text-sm font-semibold text-forest'>{t.button}</span><span className='mt-1 block text-xs leading-5 text-forest/50'>{t.summary}</span></span>
      <span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-gold transition-transform '+(open?'rotate-180':'')}><ChevronDown size={19}/></span>
    </button>
    {open&&<div className='mt-3 rounded-2xl border border-forest/10 bg-white p-4'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='rounded-xl bg-[#f7f3ea] p-4 text-sm font-semibold text-forest'><Check className='mr-2 inline text-gold' size={16}/>{t.vip}</div>
        {slug==='elite'&&<div className='rounded-xl bg-forest p-4 text-sm font-semibold text-white'><Train className='mr-2 inline text-gold' size={16}/>{t.elite}</div>}
      </div>
      <div className='mt-4 grid gap-2'>
        {days[locale].map(([day,title],i)=><div key={day} className='flex items-center gap-3 rounded-xl border border-forest/10 px-3 py-3 text-sm'>
          <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-gold'>{i+1}</span>
          <span className='font-medium text-forest'>{day}</span>
          <span className='ml-auto text-end text-forest/60'>{title}</span>
        </div>)}
      </div>
      <Link href={'/packages/'+slug} className='mt-4 block text-center text-sm font-semibold text-forest underline decoration-gold decoration-2 underline-offset-4'>{t.details}</Link>
      {open&&<button type='button' onClick={()=>setOpen(false)} className='mt-3 block w-full text-center text-xs text-forest/45'>{t.close}</button>}
    </div>}
  </div>;
}
