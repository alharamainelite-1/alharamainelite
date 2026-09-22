import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {SEO_PAGES, localizedMetadata} from '@/lib/seo';
import {isLocale, defaultLocale, type Locale} from '@/lib/i18n';
import {MarketLandingPage} from '@/components/marketing/MarketLandingPage';

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const raw = h.get('x-he-locale');
  const locale: Locale = isLocale(raw ?? undefined) ? (raw as Locale) : defaultLocale;
  return localizedMetadata('/umrah-from-canada', locale, SEO_PAGES['/umrah-from-canada']);
}

export default function Page(){
  return <MarketLandingPage market={{
    country: 'Canada', countryCode: 'Canada', slug: 'canada',
    title: 'Umrah from Canada for Somali Muslims', intro: 'A premium, small-group Umrah planning experience for Somali Muslims living in Canada. Explore two transparent journeys, choose your group size and share your expected travel period.',
    cities: ["Toronto","Ottawa","Edmonton","Calgary"],
    metaTitle: 'Umrah from Canada for Somali Muslims', metaDescription: 'A premium, small-group Umrah planning experience for Somali Muslims living in Canada. Explore two transparent journeys, choose your group size and share your expected travel period.'
  }} />;
}
