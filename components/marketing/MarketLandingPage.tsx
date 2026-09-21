import Link from 'next/link';

type Market = { country:string; countryCode:string; slug:string; title:string; intro:string; cities:string[]; metaTitle:string; metaDescription:string };

export function MarketLandingPage({market}:{market:Market}){
  return <div>
    <section className="relative overflow-hidden bg-forest text-white">
      <div className="container py-24 md:py-32">
        <div className="max-w-4xl">
          <div className="eyebrow">ALHARAMAIN ELITE · {market.countryCode}</div>
          <h1 className="serif mt-5 text-5xl leading-[.98] md:text-7xl">{market.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">{market.intro}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/packages" className="btn bg-gold text-forest">Explore Umrah journeys</Link>
            <Link href="/request-journey" className="btn border border-white/35 text-white">Request your journey</Link>
          </div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="eyebrow">Planning from {market.country}</div>
            <h2 className="serif mt-3 text-4xl text-forest md:text-5xl">A clear path from interest to journey.</h2>
            <p className="mt-5 max-w-3xl leading-8 text-forest/65">
              ALHARAMAIN ELITE offers two clearly priced small-group Umrah journeys: SIGNATURE at $2,000 per guest and ELITE at $2,500 per guest. Both are 10 days / 9 nights. International flights and personal expenses are not included unless expressly confirmed in the final itinerary.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link href="/packages/signature" className="card p-6 hover:border-gold"><div className="eyebrow">SIGNATURE</div><div className="serif mt-2 text-3xl text-forest">$2,000</div><p className="mt-2 text-sm text-forest/55">per guest · 10 days / 9 nights</p></Link>
              <Link href="/packages/elite" className="card p-6 hover:border-gold"><div className="eyebrow">ELITE</div><div className="serif mt-2 text-3xl text-forest">$2,500</div><p className="mt-2 text-sm text-forest/55">per guest · 10 days / 9 nights</p></Link>
            </div>
          </div>
          <aside className="card h-fit bg-[#f7f3ea] p-7">
            <div className="eyebrow">How it works</div>
            <ol className="mt-5 space-y-5">
              {[
                ['01','Choose your journey','Select SIGNATURE or ELITE.'],
                ['02','Choose your group','Tell us the number of guests, from 1–8.'],
                ['03','Share your period','An expected travel date or approximate period is enough to start.'],
                ['04','Speak with us','We review your request and continue the details with you.'],
              ].map(([n,t,d])=><li key={n} className="border-b border-forest/10 pb-4"><div className="eyebrow">{n}</div><h3 className="mt-1 font-semibold text-forest">{t}</h3><p className="mt-1 text-sm leading-6 text-forest/55">{d}</p></li>)}
            </ol>
          </aside>
        </div>
      </div>
    </section>

    <section className="section bg-[#f7f3ea]">
      <div className="container">
        <div className="max-w-3xl"><div className="eyebrow">Somali diaspora</div><h2 className="serif mt-3 text-4xl text-forest md:text-5xl">A service shaped around language, culture and small groups.</h2><p className="mt-5 leading-8 text-forest/65">English, Somali and Arabic support is built into the experience. The journey request lets you select your preferred language and share the period you expect to travel.</p></div>
        <div className="mt-8 flex flex-wrap gap-3">{market.cities.map(c=><span key={c} className="rounded-full border border-forest/15 bg-white px-4 py-2 text-sm text-forest/70">{c}</span>)}</div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="max-w-3xl"><div className="eyebrow">Questions before you request?</div><h2 className="serif mt-3 text-4xl text-forest">Start with the essentials.</h2></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card p-6"><h3 className="font-semibold text-forest">Do I need confirmed flights?</h3><p className="mt-2 text-sm leading-6 text-forest/60">No. You can provide an expected date or approximate travel period when you begin your request.</p></div>
          <div className="card p-6"><h3 className="font-semibold text-forest">What are the package prices?</h3><p className="mt-2 text-sm leading-6 text-forest/60">SIGNATURE is $2,000 per guest and ELITE is $2,500 per guest.</p></div>
          <div className="card p-6"><h3 className="font-semibold text-forest">How do I start?</h3><p className="mt-2 text-sm leading-6 text-forest/60">Choose a package, select your guest count and submit a journey request. Our team then follows up with you.</p></div>
        </div>
        <div className="mt-10 rounded-[28px] bg-forest p-8 text-white md:p-10"><div className="eyebrow">Ready to plan?</div><h2 className="serif mt-3 text-4xl">Begin your journey request.</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">Tell us where you are, who is travelling and the period you expect to travel.</p><Link href="/request-journey" className="btn mt-7 bg-gold text-forest">Request your journey</Link></div>
      </div>
    </section>
  </div>;
}
