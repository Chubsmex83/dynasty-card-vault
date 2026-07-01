import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { locales } from '@/i18n/config'
import { getProducts } from '@/lib/data'

const LAST_MODIFIED = '2026-07-01'

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getProducts()
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    entries.push(
      {
        url: `${SITE_URL}/${locale}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${SITE_URL}/${locale}/shop`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/${locale}/breaks`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/${locale}/cart`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly',
        priority: 0.3,
      }
    )

    for (const product of products) {
      entries.push({
        url: `${SITE_URL}/${locale}/product/${product.slug}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  }

  return entries
}
