import type {Metadata} from 'next';
import { SITE_URL } from '@/lib/seo';
import {MarketLandingPage} from '@/components/marketing/MarketLandingPage';

export const metadata: Metadata = {
  title: 'Umrah from the UK for Somali Muslims',
  description: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United Kingdom. Explore two transparent journeys, choose your group size and share your expected travel period.',
  alternates: { canonical: '/umrah-from-uk', languages: { en: `${SITE_URL}/umrah-from-uk`, so: `${SITE_URL}/so/umrah-from-uk`, ar: `${SITE_URL}/ar/umrah-from-uk`, 'x-default': `${SITE_URL}/umrah-from-uk` } },
  openGraph: { title: 'Umrah from the UK for Somali Muslims', description: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United Kingdom. Explore two transparent journeys, choose your group size and share your expected travel period.', type: 'website' },
};

export default function Page(){
  return <MarketLandingPage market={{
    country: 'United Kingdom', countryCode: 'UK', slug: 'uk',
    title: 'Umrah from the UK for Somali Muslims', intro: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United Kingdom. Explore two transparent journeys, choose your group size and share your expected travel period.',
    cities: ["London","Birmingham","Manchester","Leicester"],
    metaTitle: 'Umrah from the UK for Somali Muslims', metaDescription: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United Kingdom. Explore two transparent journeys, choose your group size and share your expected travel period.'
  }} />;
}
