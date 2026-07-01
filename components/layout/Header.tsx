'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchBar } from '@/components/search/SearchBar'
import { CursorGlow } from '@/components/motion/CursorGlow'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { CartButton } from '@/components/layout/CartButton'
import { MobileNav } from '@/components/layout/MobileNav'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function Header({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const navLinks = [
    { href: `/${locale}/shop?category=single`, label: dict.nav.singles },
    { href: `/${locale}/shop?category=sealed`, label: dict.nav.sealed },
    { href: `/${locale}/shop?category=memorabilia`, label: dict.nav.memorabilia },
    { href: `/${locale}/breaks`, label: dict.nav.breaks },
  ]

  return (
    <>
      <CursorGlow />
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-panel/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:h-20 lg:gap-6">
          {/* Brand */}
          <Link
            href={`/${locale}`}
            className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label={dict.nav.brand}
          >
            <Image
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-9 w-9 shrink-0 rounded-lg object-contain lg:h-11 lg:w-11"
            />
            <span className="hidden font-display text-base font-semibold tracking-tight text-ink sm:inline lg:text-lg">
              {dict.nav.brand}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop search — flexible fill */}
          <div className="ml-auto hidden max-w-md flex-1 lg:block">
            <SearchBar locale={locale} dict={dict} />
          </div>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="hidden sm:block">
              <Suspense fallback={null}>
                <LocaleSwitcher locale={locale} />
              </Suspense>
            </div>
            <CartButton locale={locale} dict={dict} />
            <div className="lg:hidden">
              <MobileNav locale={locale} dict={dict} />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
