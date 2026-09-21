export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';

const routes = ['', 'packages', 'packages/signature', 'packages/elite', 'umrah-from-uk', 'umrah-from-usa', 'umrah-from-canada', 'experience', 'womens-umrah', 'makkah', 'madinah', 'jeddah', 'hotels', 'transportation', 'about', 'reviews', 'faq', 'request-journey', 'contact'];
const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: path ? `${base}/${path}` : base,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('packages') || path.startsWith('umrah-from-') || path === 'request-journey' ? 0.9 : 0.7,
  }));
}
