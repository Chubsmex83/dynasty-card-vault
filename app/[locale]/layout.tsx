import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      languages: {
        es: '/es',
        en: '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await getDictionary(locale);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      {/* Header */}
      {children}
      {/* Footer */}
    </>
  );
}
