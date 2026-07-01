import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { notFound } from 'next/navigation';

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-bg px-6 text-center text-ink">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">
        {dict.home.heroKicker}
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold text-ink sm:text-5xl">
        {dict.home.heroTitle}
      </h1>
      <p className="max-w-xl text-base text-muted">{dict.home.heroSubtitle}</p>
      <Link
        href={`/${locale}/shop`}
        className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
      >
        {dict.home.heroCta}
      </Link>
    </main>
  );
}
