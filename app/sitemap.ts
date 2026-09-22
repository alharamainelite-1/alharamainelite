export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';
import { SITE_URL, localizedPath } from '@/lib/seo';

const routes = [
  '',
  'packages',
  'packages/signature',
  'packages/elite',
  'umrah-from-uk',
  'umrah-from-usa',
  'umrah-from-canada',
  'experience',
  'womens-umrah',
  'makkah',
  'madinah',
  'jeddah',
  'hotels',
  'transportation',
  'about',
  'reviews',
  'faq',
  'request-journey',
  'contact',
] as const;

const lastModified = new Date('2026-09-22T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((path) => {
    const basePath = path ? `/${path}` : '/';
    return (['en','so','ar'] as const).map((locale) => ({
      url: `${SITE_URL}${localizedPath(basePath, locale)}`,
      lastModified,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : path.startsWith('packages') || path.startsWith('umrah-from-') || path === 'request-journey' ? 0.9 : 0.7,
    }));
  });
}
