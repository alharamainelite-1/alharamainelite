import type { Metadata } from 'next';
import {PartnerLoginForm} from '@/components/partner/PartnerLoginForm';

export const metadata: Metadata = {
  title: 'Partner Login | ALHARAMAIN ELITE',
  description: 'Secure sign-in for approved ALHARAMAIN ELITE referral partners.',
  robots: { index: false, follow: false },
};

export default function PartnerLoginPage(){return <main className="min-h-screen bg-ivory"><section className="section"><div className="container max-w-md"><div className="card p-8 md:p-10"><div className="eyebrow">ALHARAMAIN ELITE Partner Program</div><h1 className="serif mt-4 text-4xl text-forest">Welcome back.</h1><PartnerLoginForm/></div></div></section></main>}
