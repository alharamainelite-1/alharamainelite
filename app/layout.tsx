import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { siteConfig } from '@/lib/site';
import { cookies } from 'next/headers';
import { isLocale, defaultLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app'),
  title: { default: 'Haramain Elite — A Journey Worth Remembering.', template: '%s | Haramain Elite' },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: { title: 'Haramain Elite — A Journey Worth Remembering.', description: siteConfig.description, type: 'website', siteName: 'Haramain Elite' },
  robots: { index: true, follow: true },
  verification: { google: 'I8fq5FxZOgeBrw6JZfWTaS7GNpChbxA36iNidqaP5VM' },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: siteConfig.brandName,
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app',
  description: siteConfig.description,
  telephone: siteConfig.whatsapp,
  areaServed: 'Worldwide',
  knowsLanguage: ['English','Somali','Arabic'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('he_locale')?.value;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><body><SiteHeader /><main>{children}</main><SiteFooter />
    <Script id="organization-schema" type="application/ld+json">{JSON.stringify(structuredData)}</Script>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-S4SCC036K4" strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-S4SCC036K4');
    `}</Script>
  </body></html>;
}
