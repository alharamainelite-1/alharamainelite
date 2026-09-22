import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app';

export const SEO_PAGES: Record<string, { title: string; description: string }> = {
  '/': { title: 'Premium Umrah Journeys for Somali Muslims Abroad', description: 'AlHaramain Elite offers premium 10-day, 9-night Umrah journeys for Somali Muslims living abroad, with clear pricing, small groups and personal support.' },
  '/packages': { title: 'Umrah Packages for Somali Travelers | AlHaramain Elite', description: 'Compare AlHaramain Elite SIGNATURE and ELITE Umrah journeys: 10 days / 9 nights, transparent pricing, small groups and clear inclusions.' },
  '/packages/signature': { title: 'SIGNATURE Umrah Journey — $2,000 per Guest', description: 'A 10-day / 9-night SIGNATURE Umrah journey at $2,000 per guest, with premium accommodation, breakfast, private transportation, ziyarat, Jeddah experience and journey support.' },
  '/packages/elite': { title: 'ELITE Umrah Journey — $2,500 per Guest', description: 'A 10-day / 9-night ELITE Umrah journey at $2,500 per guest, adding Haramain Train where applicable to the confirmed journey plan.' },
  '/experience': { title: 'The AlHaramain Elite Umrah Experience', description: 'Explore how AlHaramain Elite brings together Makkah, Madinah, Jeddah, accommodation, transportation and personal journey support for small groups.' },
  '/womens-umrah': { title: "Women's Umrah Journeys for Somali Travelers", description: 'Explore AlHaramain Elite Women’s Umrah planning for small groups, with clear packages, personal communication and support confirmed in the final itinerary.' },
  '/makkah': { title: 'Makkah Umrah Experience | AlHaramain Elite', description: 'Plan a thoughtful Makkah stay with accommodation, transportation and ziyarat arranged according to the confirmed Umrah itinerary.' },
  '/madinah': { title: 'Madinah Umrah Experience | AlHaramain Elite', description: 'Explore a carefully planned Madinah stay with accommodation, transportation, ziyarat and Haramain Train in ELITE where applicable.' },
  '/jeddah': { title: 'Jeddah Experience for Umrah Travelers | AlHaramain Elite', description: 'Discover a planned Jeddah experience with culture, shopping and an opportunity to visit the Somali Market where included in the journey.' },
  '/hotels': { title: 'Umrah Hotels in Makkah and Madinah | AlHaramain Elite', description: 'Learn how AlHaramain Elite selects and confirms accommodation in Makkah and Madinah for each journey.' },
  '/transportation': { title: 'Umrah Transportation | AlHaramain Elite', description: 'Learn about private transportation and Haramain Train arrangements included in ELITE where applicable to the confirmed journey.' },
  '/about': { title: 'About AlHaramain Elite | Somali Umrah Travel', description: 'Learn about AlHaramain Elite and its focus on premium Umrah journeys for Somali Muslims living in the diaspora.' },
  '/reviews': { title: 'Guest Experiences | AlHaramain Elite', description: 'Verified guest experiences from AlHaramain Elite will be published here when available.' },
  '/faq': { title: 'Umrah FAQ | AlHaramain Elite', description: 'Clear answers about AlHaramain Elite Umrah packages, flights, expected travel dates, groups, payment, transportation and Haramain Train.' },
  '/request-journey': { title: 'Request Your Umrah Journey | AlHaramain Elite', description: 'Choose your Umrah journey, guest count and expected travel period, then send a request to AlHaramain Elite for personal follow-up.' },
  '/contact': { title: 'Contact AlHaramain Elite | Umrah Travel Support', description: 'Contact AlHaramain Elite about your Umrah journey, expected travel period, package choice and group details.' },
  '/umrah-from-usa': { title: 'Umrah from the USA for Somali Muslims | AlHaramain Elite', description: 'Plan a premium small-group Umrah journey from the United States for Somali Muslims, with transparent packages and personal support.' },
  '/umrah-from-uk': { title: 'Umrah from the UK for Somali Muslims | AlHaramain Elite', description: 'Plan a premium small-group Umrah journey from the United Kingdom for Somali Muslims, with transparent packages and personal support.' },
  '/umrah-from-canada': { title: 'Umrah from Canada for Somali Muslims | AlHaramain Elite', description: 'Plan a premium small-group Umrah journey from Canada for Somali Muslims, with transparent packages and personal support.' },
};

export function stripLocale(pathname: string) {
  const clean = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  return clean.replace(/^\/(so|ar)(?=\/|$)/, '') || '/';
}

export function localizedPath(path: string, locale: 'en' | 'so' | 'ar') {
  const clean = path === '/' ? '' : path.replace(/^\//, '');
  return locale === 'en' ? (`/${clean}`.replace(/\/$/, '') || '/') : (`/${locale}/${clean}`.replace(/\/$/, '') || `/${locale}`);
}

export function hreflangAlternates(path: string) {
  const clean = stripLocale(path);
  return {
    en: `${SITE_URL}${localizedPath(clean, 'en')}`,
    so: `${SITE_URL}${localizedPath(clean, 'so')}`,
    ar: `${SITE_URL}${localizedPath(clean, 'ar')}`,
    'x-default': `${SITE_URL}${localizedPath(clean, 'en')}`,
  };
}

export function localizedMetadata(path: string, locale: 'en' | 'so' | 'ar', base: { title: string; description: string }): Metadata {
  const canonical = localizedPath(stripLocale(path), locale);
  return {
    title: base.title,
    description: base.description,
    alternates: { canonical, languages: hreflangAlternates(path) },
    openGraph: { title: base.title, description: base.description, type: 'website', url: `${SITE_URL}${canonical}` },
    twitter: { card: 'summary_large_image', title: base.title, description: base.description },
  };
}