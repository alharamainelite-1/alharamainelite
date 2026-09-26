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
    localized:{so:{title:'Cumro laga bilaabo Canada oo loogu talagalay Muslimiinta Soomaalida',intro:'Qorshayn Cumro oo koox yar ah oo loogu talagalay Muslimiinta Soomaalida ku nool Canada, leh qiime cad, 5–8 marti iyo taageero qofeed.'},ar:{title:'العمرة من كندا للمسلمين الصوماليين',intro:'تخطيط رحلة عمرة ضمن مجموعة صغيرة للمسلمين الصوماليين في كندا، مع أسعار واضحة ودعم شخصي.'}}
  }} />;
}
