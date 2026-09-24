import Link from 'next/link';
import Script from 'next/script';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {SITE_URL} from '@/lib/seo';

const guides = {
  'umrah-for-somali-muslims-abroad': {
    title:'Umrah Planning Guide for Somali Muslims Living Abroad',
    description:'A practical guide for Somali Muslims planning Umrah from the UK, USA or Canada, including group size, package choice, expected travel dates and journey requests.',
    intro:'Planning Umrah from abroad is easier when the important decisions are clear from the beginning. For Somali families and friends living in the UK, USA and Canada, the practical challenge is often coordinating people, dates, communication and arrangements across different lives and cities.',
    sections:[
      ['1. Start with your group','Small groups can make coordination simpler. ALHARAMAIN ELITE plans around groups of 5–8 guests. Before requesting a journey, decide who is travelling and whether the group is ready to travel within a similar period.'],
      ['2. Choose the journey that fits your group','There are two transparent journeys. SIGNATURE is $2,000 per guest and ELITE is $2,500 per guest. Both are 10 days / 9 nights. ELITE adds Haramain Train where it is applicable to the confirmed journey plan.'],
      ['3. You do not need a confirmed flight date to start','When you first contact the team, an expected travel date or approximate travel period is enough. This lets the journey conversation begin before every flight detail is finalized. International flights are not included unless expressly confirmed in the final itinerary.'],
      ['4. Think about where your group is travelling from','Somali communities are spread across major cities. In the UK this can include London, Birmingham, Manchester and Leicester. In the USA, communities include Minneapolis and other major metropolitan areas. In Canada, Toronto, Ottawa, Edmonton and Calgary are useful starting points when coordinating your group.'],
      ['5. Decide what matters most in the journey','Consider accommodation level, transport, Makkah and Madinah arrangements, ziyarat, Jeddah activities and how your group wants to communicate. A clear request helps the team build the right final itinerary for your group.'],
      ['6. Keep pricing simple','The package estimate is simply the per-guest price multiplied by the number of guests. For example, five guests on SIGNATURE would be $10,000, while five guests on ELITE would be $12,500. The final itinerary confirms the exact services included.'],
      ['7. Ask questions before confirmation','Your journey request is not itself a booking confirmation. The team reviews your request, follows up with you, and provides the final itinerary and payment instructions before confirmation.']
    ]
  },
  'umrah-from-uk-for-somali-muslims': {
    title:'How to Plan Umrah from the UK as a Somali Muslim',
    description:'Planning considerations for Somali Muslims in the UK who want to organise a small-group Umrah journey with clear pricing and personal support.',
    intro:'For Somali Muslims in the UK, an Umrah group can bring together relatives and friends from different cities. Good planning starts by agreeing on the people travelling, an expected period and the level of journey you want.',
    sections:[
      ['Choose a realistic group','Aim to coordinate 5–8 guests around a shared expected travel period. If relatives live in London, Birmingham, Manchester or Leicester, agree early on who is travelling so the request reflects the real group.'],
      ['Compare the two journeys','SIGNATURE is $2,000 per guest. ELITE is $2,500 per guest and includes Haramain Train where applicable to the confirmed plan. Both are 10 days / 9 nights with the published inclusions shown on the package pages.'],
      ['Start before every flight detail is final','You can submit an expected date or approximate period rather than waiting for a confirmed flight date. International flights are not included unless they are expressly confirmed in the final itinerary.'],
      ['Plan communication around your group','Choose English, Somali or Arabic for your preferred communication. A clear WhatsApp conversation can make it easier for a group living in different UK cities to keep the same information.'],
      ['Request the journey','Use the journey request form to select the package, guest count and expected travel period. The team follows up before the journey is confirmed.']
    ]
  },
  'umrah-from-usa-for-somali-muslims': {
    title:'How to Plan Umrah from the USA as a Somali Muslim',
    description:'Planning considerations for Somali Muslims in the United States arranging a small-group Umrah journey with transparent package pricing.',
    intro:'Somali Muslims in the United States may be coordinating an Umrah group across large distances. A simple planning process helps: agree on the group, choose the journey, share an expected period and then continue the details with the team.',
    sections:[
      ['Coordinate the group first','A 5–8 guest group is the starting point for ALHARAMAIN ELITE. If members are travelling from communities such as Minneapolis, Columbus, Washington or Seattle, agree on the group before submitting the request.'],
      ['Choose SIGNATURE or ELITE','SIGNATURE is $2,000 per guest and ELITE is $2,500 per guest. Both are 10 days / 9 nights. ELITE adds Haramain Train where applicable to the confirmed journey plan.'],
      ['Use an expected travel period','You do not need a confirmed flight date to begin the conversation. Share an expected date or approximate period, then confirm the final itinerary with the team.'],
      ['Keep the estimate transparent','Multiply the package price by the number of guests. Five guests would be $10,000 on SIGNATURE or $12,500 on ELITE before any separately confirmed services.'],
      ['Continue the request directly','After you submit the journey request, the team reviews the details and follows up. Confirmation comes after the final itinerary and payment instructions are provided.']
    ]
  },
  'umrah-from-canada-for-somali-muslims': {
    title:'How to Plan Umrah from Canada as a Somali Muslim',
    description:'Planning considerations for Somali Muslims in Canada arranging a small-group Umrah journey with transparent prices and personal support.',
    intro:'For Somali Muslims in Canada, planning an Umrah journey may involve coordinating relatives and friends across different cities. The easiest starting point is a shared group plan, an expected travel period and a clear package choice.',
    sections:[
      ['Agree on your group','Plan around 5–8 guests and decide who is travelling. For groups connected to Toronto, Ottawa, Edmonton or Calgary, agreeing on the group early makes the journey request more useful.'],
      ['Compare the published packages','SIGNATURE is $2,000 per guest and ELITE is $2,500 per guest. Both are 10 days / 9 nights. ELITE includes Haramain Train where applicable to the confirmed journey plan.'],
      ['Share an expected period','A confirmed flight date is not required to start. An expected date or approximate period is enough for the initial request.'],
      ['Keep the group informed','English, Somali and Arabic support is available. Choose the preferred language for the journey conversation so family and friends receive clear information.'],
      ['Request your journey','Select the package, choose 5–8 guests and submit your expected travel period. The final itinerary is provided before the journey is confirmed.']
    ]
  }
} as const;

export function generateStaticParams(){return Object.keys(guides).map(slug=>({slug}));}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params; const g=guides[slug as keyof typeof guides]; if(!g)return {};
 return {title:g.title,description:g.description,alternates:{canonical:`${SITE_URL}/guides/${slug}`},openGraph:{title:g.title,description:g.description,url:`${SITE_URL}/guides/${slug}`,type:'article'}};
}

export default async function Guide({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const g=guides[slug as keyof typeof guides]; if(!g)notFound();
 const url=`${SITE_URL}/guides/${slug}`;
 return <main className="section"><article className="container max-w-4xl"><div className="eyebrow">UMRAH GUIDE · ALHARAMAIN ELITE</div><h1 className="serif mt-4 text-5xl leading-tight text-forest md:text-7xl">{g.title}</h1><p className="mt-7 text-xl leading-9 text-forest/65">{g.intro}</p><div className="mt-10 space-y-8">{g.sections.map(([title,text])=><section key={title}><h2 className="serif text-3xl text-forest md:text-4xl">{title}</h2><p className="mt-3 leading-8 text-forest/65">{text}</p></section>)}</div><div className="mt-12 grid gap-4 rounded-[28px] bg-forest p-8 text-white md:grid-cols-2"><div><div className="eyebrow">READY TO PLAN?</div><h2 className="serif mt-3 text-4xl">Request your Umrah journey.</h2></div><div className="flex items-center"><Link href="/request-journey" className="btn bg-gold text-forest">Request your journey</Link></div></div><div className="mt-8 text-sm text-forest/55"><Link href="/guides" className="underline">All Umrah guides</Link> · <Link href="/packages" className="underline">View packages</Link> · <Link href="/faq" className="underline">Umrah FAQ</Link></div></article><Script id="guide-schema" type="application/ld+json">{JSON.stringify({'@context':'https://schema.org','@type':'Article','headline':g.title,'description':g.description,'mainEntityOfPage':url,'publisher':{'@type':'Organization','name':'ALHARAMAIN ELITE','url':SITE_URL}})}</Script><Script id="guide-breadcrumb" type="application/ld+json">{JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':SITE_URL},{'@type':'ListItem','position':2,'name':'Umrah Guides','item':SITE_URL+'/guides'},{'@type':'ListItem','position':3,'name':g.title,'item':url}]})}</Script></main>
}
