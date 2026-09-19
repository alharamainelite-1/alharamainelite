import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app'),
  title: { default: 'Haramain Elite — A Journey Worth Remembering.', template: '%s | Haramain Elite' },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { languages: { en: '/', so: '/', ar: '/' } },
  openGraph: { title: 'Haramain Elite — A Journey Worth Remembering.', description: siteConfig.description, type: 'website', siteName: 'Haramain Elite' },
  robots: { index: true, follow: true },
  verification: { google: 'XxC2aFwSZ9538k7OmwEWza2NocoEvV_ku7Xf1zJg08E' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" dir="ltr"><body><SiteHeader /><main>{children}</main><SiteFooter />
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-S4SCC036K4" strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-S4SCC036K4');
    `}</Script>
  </body></html>;
}
