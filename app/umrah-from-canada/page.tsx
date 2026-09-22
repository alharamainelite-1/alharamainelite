import type {Metadata} from 'next';
import { SITE_URL } from '@/lib/seo';
import {MarketLandingPage} from '@/components/marketing/MarketLandingPage';

export const metadata: Metadata = {
  title: 'Umrah from Canada for Somali Muslims',
  description: 'A premium, small-group Umrah planning experience for Somali Muslims living in Canada. Explore two transparent journeys, choose your group size and share your expected travel period.',
  alternates: { canonical: '/umrah-from-canada', languages: { en: `${SITE_URL}/umrah-from-canada`, so: `${SITE_URL}/so/umrah-from-canada`, ar: `${SITE_URL}/ar/umrah-from-canada`, 'x-default': `${SITE_URL}/umrah-from-canada` } },
  openGraph: { title: 'Umrah from Canada for Somali Muslims', description: 'A premium, small-group Umrah planning experience for Somali Muslims living in Canada. Explore two transparent journeys, choose your group size and share your expected travel period.', type: 'website' },
};

export default function Page(){
  return <MarketLandingPage market={{
    country: 'Canada', countryCode: 'Canada', slug: 'canada',
    title: 'Umrah from Canada for Somali Muslims', intro: 'A premium, small-group Umrah planning experience for Somali Muslims living in Canada. Explore two transparent journeys, choose your group size and share your expected travel period.',
    cities: ["Toronto","Ottawa","Edmonton","Calgary"],
    localIntro: 'For Somali Muslims in Canada, planning a shared Umrah journey can mean coordinating family members across different cities. ALHARAMAIN ELITE offers a simple starting process with clear package pricing, small groups and direct communication.',
    travelNote: 'Whether your group is in Toronto, Ottawa, Edmonton or Calgary, you can begin with an expected travel period rather than a confirmed flight date.'
    metaTitle: 'Umrah from Canada for Somali Muslims', metaDescription: 'A premium, small-group Umrah planning experience for Somali Muslims living in Canada. Explore two transparent journeys, choose your group size and share your expected travel period.'
  }} />;
}
