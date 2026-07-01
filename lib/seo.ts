import { createElement } from 'react'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/config'
import type { Product } from '@/lib/data'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dynastycardvault.vercel.app'
export const SITE_NAME = 'Dynasty Card Vault'

const SITE_DESCRIPTION =
  'Premium marketplace for sports and TCG collectible cards: certified singles, sealed boxes, authenticated memorabilia, and live break spots.'

export function orgJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: `${SITE_URL}/logo.png`,
  }
}

export function websiteJsonLd(locale: Locale): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/${locale}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

const AVAILABILITY_MAP: Record<Product['availability'], string> = {
  in_stock: 'https://schema.org/InStock',
  sold_out: 'https://schema.org/SoldOut',
  preorder: 'https://schema.org/PreOrder',
}

export function productJsonLd(product: Product, locale: Locale): object {
  const url = `${SITE_URL}/${locale}/product/${product.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.id,
    category: product.category,
    brand: product.brand
      ? { '@type': 'Brand', name: product.brand }
      : undefined,
    url,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: AVAILABILITY_MAP[product.availability],
      url,
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function faqJsonLd(faqs: { q: string; a: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export function pageMetadata(opts: {
  title: string
  description: string
  path: string
  locale: Locale
  images?: string[]
}): Metadata {
  const { title, description, path, locale } = opts
  const images = opts.images ?? ['/logo.png']
  const canonical = `${SITE_URL}/${locale}${path}`
  const ogLocale = locale === 'es' ? 'es_ES' : 'en_US'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        es: `${SITE_URL}/es${path}`,
        en: `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: ogLocale,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  }
}

export function JsonLd({ data }: { data: object | object[] }) {
  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  })
}
