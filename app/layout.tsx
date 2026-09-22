import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { siteConfig } from '@/lib/site';
import { cookies, headers } from 'next/headers';
import { isLocale, defaultLocale, type Locale } from '@/lib/i18n';
import { SEO_PAGES, SITE_URL, localizedMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const localeHeader = h.get('x-he-locale');
  const locale: Locale = isLocale(localeHeader ?? undefined) ? (localeHeader as Locale) : defaultLocale;
  const path = h.get('x-he-path') || '/';
  const base = SEO_PAGES[path] || SEO_PAGES['/'];
  return {
    metadataBase: new URL(SITE_URL),
    ...localizedMetadata(path, locale, base),
    applicationName: siteConfig.name,
    robots: { index: true, follow: true },
    verification: { google: 'I8fq5FxZOgeBrw6JZfWTaS7GNpChbxA36iNidqaP5VM' },
    icons: { icon: '/brand/alharamainelite-logo.png', apple: '/brand/alharamainelite-logo.png' },
  };
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: siteConfig.brandName,
  url: SITE_URL,
  description: siteConfig.description,
  telephone: siteConfig.whatsapp,
  areaServed: 'Worldwide',
  knowsLanguage: ['English','Somali','Arabic'],
};


const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.brandName,
  url: SITE_URL,
  inLanguage: ['en', 'so', 'ar'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rawLocale = (await cookies()).get('he_locale')?.value;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <body>
      <SiteHeader locale={locale} />
      <main>{children}</main>
      <SiteFooter locale={locale} />
      <Script id="organization-schema" type="application/ld+json">{JSON.stringify(structuredData)}</Script>
      <Script id="website-schema" type="application/ld+json">{JSON.stringify(websiteSchema)}</Script>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-S4SCC036K4" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-S4SCC036K4');`}</Script>
    </body>
  </html>;
}
