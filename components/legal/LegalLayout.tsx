import type { ReactNode } from 'react'

/**
 * Shared frame for legal pages: title, "last updated" line, reading width and
 * prose styling. The prose styling targets the child content module's raw
 * <h2>/<p>/<ul> elements (no typography plugin in this project).
 */
export function LegalLayout({
  title,
  lastUpdatedLabel,
  children,
}: {
  title: string
  lastUpdatedLabel: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {lastUpdatedLabel}: [TODO: fecha de publicación]
      </p>
      <div
        className="mt-10 text-sm leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-ink [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-gold [&_a]:underline-offset-4 hover:[&_a]:underline"
      >
        {children}
      </div>
    </section>
  )
}
