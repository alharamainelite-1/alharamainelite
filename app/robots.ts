export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';
const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${base}/sitemap.xml` };
}
