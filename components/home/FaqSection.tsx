import type { Dictionary } from '@/i18n/getDictionary'
import { Reveal } from '@/components/motion/Reveal'
import { JsonLd, faqJsonLd } from '@/lib/seo'

export function FaqSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="mx-auto max-w-[860px] px-6 py-16 sm:py-20">
      <JsonLd data={faqJsonLd(dict.faq.map((f) => ({ q: f.q, a: f.a })))} />

      <div className="mb-8">
        <span
          aria-hidden="true"
          className="mb-3 block h-px w-10 bg-[color-mix(in_srgb,var(--gold)_60%,transparent)]"
        />
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {dict.home.faqTitle}
        </h2>
      </div>

      <div className="divide-y divide-white/5 border-y border-white/5">
        {dict.faq.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i, 6) * 0.05}>
            <details className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-md">
                <h3 className="font-display text-base font-medium tracking-tight text-ink sm:text-lg">
                  {item.q}
                </h3>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gold ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_35%,transparent)] transition-transform duration-300 group-open:rotate-45"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-5 pr-10 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
