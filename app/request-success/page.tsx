import Link from 'next/link';
import Script from 'next/script';

export default async function RequestSuccess({ searchParams }: { searchParams: Promise<{ reference?: string; total?: string }> }) {
  const p = await searchParams;
  const total = p.total ? Number(p.total) : null;
  return <><Script id="request-success-event">{`window.gtag&&window.gtag('event','request_success',{request_reference:'${p.reference||''}'})`}</Script><section className="section"><div className="container max-w-3xl"><div className="card overflow-hidden p-8 md:p-14">
    <div className="eyebrow">Journey request received</div>
    <h1 className="serif mt-4 text-4xl leading-tight text-forest md:text-6xl">YOUR JOURNEY REQUEST HAS BEEN RECEIVED.</h1>
    <p className="mt-6 text-lg leading-8 text-forest/65">Thank you for trusting Haramain Elite with your journey. Your journey request has been successfully received by our team. We will carefully review your details and personally contact you on WhatsApp to continue planning your journey.</p>
    <div className="mt-8 grid gap-4 bg-[#f2eee3] p-6 sm:grid-cols-2">
      <div><div className="eyebrow">Request reference</div><div className="mt-2 font-semibold tracking-wide text-forest">{p.reference || 'HE-REQUEST'}</div></div>
      <div><div className="eyebrow">Estimated total</div><div className="mt-2 font-semibold text-forest">{total !== null && Number.isFinite(total) ? '$' + total.toLocaleString() : '—'}</div></div>
    </div>
    <h2 className="serif mt-12 text-3xl text-forest">WHAT HAPPENS NEXT?</h2>
    <div className="mt-6 space-y-5 text-forest/70">
      <div className="flex gap-4"><b className="text-gold">01</b><div><b className="text-forest">REQUEST RECEIVED</b><p className="mt-1">Your journey details are safely with our team.</p></div></div>
      <div className="flex gap-4"><b className="text-gold">02</b><div><b className="text-forest">OUR TEAM REVIEWS YOUR REQUEST</b><p className="mt-1">We carefully review your preferred travel period, package and group details.</p></div></div>
      <div className="flex gap-4"><b className="text-gold">03</b><div><b className="text-forest">WE CONTACT YOU PERSONALLY</b><p className="mt-1">A member of the Haramain Elite team will contact you directly on WhatsApp.</p></div></div>
    </div>
    <div className="gold-rule my-10" /><h2 className="serif text-3xl text-forest">Your journey begins with a conversation.</h2><p className="mt-3 leading-7 text-forest/60">We look forward to welcoming you.</p>
    <Link className="btn btn-outline mt-8" href="/">Return home</Link>
  </div></div></section></>;
}
