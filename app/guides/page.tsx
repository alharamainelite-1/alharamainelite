import Link from 'next/link';
const guides=[
{slug:'umrah-for-somali-muslims-abroad',title:'Umrah Planning Guide for Somali Muslims Living Abroad',desc:'A practical guide to planning a small-group Umrah journey from the UK, USA or Canada, from choosing a package to sharing your expected travel period.'},
{slug:'umrah-from-uk-for-somali-muslims',title:'How to Plan Umrah from the UK as a Somali Muslim',desc:'A practical planning guide for Somali Muslims in London, Birmingham, Manchester, Leicester and other UK communities.'},
{slug:'umrah-from-usa-for-somali-muslims',title:'How to Plan Umrah from the USA as a Somali Muslim',desc:'A practical planning guide for Somali Muslims in Minneapolis, Columbus, Washington, Seattle and communities across the United States.'},
{slug:'umrah-from-canada-for-somali-muslims',title:'How to Plan Umrah from Canada as a Somali Muslim',desc:'A practical planning guide for Somali Muslims in Toronto, Ottawa, Edmonton, Calgary and communities across Canada.'},
];
export default function Guides(){
return <main className="section"><div className="container max-w-5xl"><div className="eyebrow">UMRAH GUIDES</div><h1 className="serif mt-4 text-5xl text-forest md:text-7xl">Practical Umrah planning for the Somali diaspora.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-forest/65">Useful, straightforward guidance for Somali Muslims planning Umrah from the UK, USA and Canada. We focus on what you need to decide before requesting your journey.</p><div className="mt-10 grid gap-5 md:grid-cols-2">{guides.map(g=><Link key={g.slug} href={'/guides/'+g.slug} className="card p-7 transition hover:-translate-y-1 hover:border-gold"><div className="eyebrow">GUIDE</div><h2 className="serif mt-3 text-3xl text-forest">{g.title}</h2><p className="mt-3 leading-7 text-forest/60">{g.desc}</p><span className="mt-5 inline-flex font-semibold text-gold">Read the guide →</span></Link>)}</div></div></main>
}
