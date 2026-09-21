import type {Metadata} from 'next';
import {MarketLandingPage} from '@/components/marketing/MarketLandingPage';

export const metadata: Metadata = {
  title: 'Umrah from the USA for Somali Muslims',
  description: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United States. Explore two transparent journeys, choose your group size and share your expected travel period.',
  alternates: { canonical: '/umrah-from-usa' },
  openGraph: { title: 'Umrah from the USA for Somali Muslims', description: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United States. Explore two transparent journeys, choose your group size and share your expected travel period.', type: 'website' },
};

export default function Page(){
  return <MarketLandingPage market={{
    country: 'United States', countryCode: 'USA', slug: 'usa',
    title: 'Umrah from the USA for Somali Muslims', intro: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United States. Explore two transparent journeys, choose your group size and share your expected travel period.',
    cities: ["Minneapolis","Columbus","Washington, D.C.","Seattle"],
    metaTitle: 'Umrah from the USA for Somali Muslims', metaDescription: 'A premium, small-group Umrah planning experience for Somali Muslims living in the United States. Explore two transparent journeys, choose your group size and share your expected travel period.'
  }} />;
}
