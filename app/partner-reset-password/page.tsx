import {PartnerPasswordResetRequest} from '@/components/partner/PartnerPasswordResetRequest';

export default function PartnerPasswordResetPage(){
  return <main className="min-h-screen bg-ivory"><section className="section"><div className="container max-w-md"><div className="card p-8 md:p-10"><div className="eyebrow">ALHARAMAIN ELITE Partner Program</div><h1 className="serif mt-4 text-4xl text-forest">Reset your password.</h1><p className="mt-3 text-sm leading-6 text-forest/60">Enter the email address linked to your partner account. We will send you a secure password reset link.</p><PartnerPasswordResetRequest/></div></div></section></main>
}