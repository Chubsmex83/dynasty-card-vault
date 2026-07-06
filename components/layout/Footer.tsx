import Link from 'next/link'
import Image from 'next/image'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function Footer({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const explore = [
    { href: `/${locale}/shop`, label: dict.nav.shop },
    { href: `/${locale}/breaks`, label: dict.nav.breaks },
    { href: `/${locale}/cart`, label: dict.nav.cart },
  ]

  const categories = [
    { href: `/${locale}/shop?category=single`, label: dict.categories.single },
    { href: `/${locale}/shop?category=sealed`, label: dict.categories.sealed },
    { href: `/${locale}/shop?category=memorabilia`, label: dict.categories.memorabilia },
    { href: `/${locale}/shop?category=accessories`, label: dict.categories.accessories },
  ]

  const legal = [
    { href: `/${locale}/legal/privacy`, label: dict.legal.privacyTitle },
    { href: `/${locale}/legal/terms`, label: dict.legal.termsTitle },
    { href: `/${locale}/legal/sales`, label: dict.legal.salesTitle },
  ]

  return (
    <footer className="mt-24 border-t border-gold/15 bg-panel/40">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand + business paragraph */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Dynasty Card Vault"
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-lg object-contain"
              />
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                {dict.nav.brand}
              </span>
            </div>
            <p className="mt-4 font-display text-sm text-gold-soft">
              {dict.footer.tagline}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              {dict.footer.business}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {dict.footer.explore}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {dict.footer.categories}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {dict.footer.legal}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6">
          <p className="text-xs text-muted">
            © 2026 Dynasty Card Vault. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
