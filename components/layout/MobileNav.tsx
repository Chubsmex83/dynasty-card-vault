'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search/SearchBar'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/getDictionary'

export function MobileNav({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const reducedMotion = useReducedMotion()
  const pathname = usePathname()

  // Portal target is only available on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on route change.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on Escape + lock scroll while open.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const links = [
    { href: `/${locale}/shop?category=single`, label: dict.nav.singles },
    { href: `/${locale}/shop?category=sealed`, label: dict.nav.sealed },
    { href: `/${locale}/shop?category=memorabilia`, label: dict.nav.memorabilia },
    { href: `/${locale}/breaks`, label: dict.nav.breaks },
    { href: `/${locale}/shop`, label: dict.nav.shop },
  ]

  return (
    <>
      <button
        type="button"
        aria-label={dict.nav.shop}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-panel-2/60 text-ink transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <MenuIcon />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                className="fixed inset-0 z-[60] lg:hidden"
                initial={reducedMotion ? undefined : { opacity: 0 }}
                animate={reducedMotion ? undefined : { opacity: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  className={cn(
                    'absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-6 overflow-y-auto border-l border-gold/20 bg-panel p-6 shadow-2xl'
                  )}
                  initial={reducedMotion ? undefined : { x: '100%' }}
                  animate={reducedMotion ? undefined : { x: 0 }}
                  exit={reducedMotion ? undefined : { x: '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-semibold tracking-tight text-ink">
                      {dict.nav.brand}
                    </span>
                    <button
                      type="button"
                      aria-label={dict.cart.remove}
                      onClick={() => setOpen(false)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <SearchBar
                    locale={locale}
                    dict={dict}
                    onNavigate={() => setOpen(false)}
                  />

                  <nav className="flex flex-col">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="border-b border-white/5 py-3.5 text-base text-ink transition-colors hover:text-gold-soft"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
