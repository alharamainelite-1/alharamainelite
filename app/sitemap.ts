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
  'guides',
  'guides/umrah-for-somali-muslims-abroad',
  'guides/umrah-from-uk-for-somali-muslims',
  'guides/umrah-from-usa-for-somali-muslims',
  'guides/umrah-from-canada-for-somali-muslims',
] as const;

const lastModified = new Date('2026-09-24T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((path) => {
    if (path.startsWith('guides')) { return [{ url: `${SITE_URL}/${path}`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 }]; }

    const basePath = path ? `/${path}` : '/';
    return (['en','so','ar'] as const).map((locale) => ({
      url: `${SITE_URL}${localizedPath(basePath, locale)}`,
      lastModified,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : path.startsWith('packages') || path.startsWith('umrah-from-') || path === 'request-journey' ? 0.9 : 0.7,
    }));
  });
}
