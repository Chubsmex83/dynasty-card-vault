import type { ReactNode } from 'react'
import type { Dictionary } from '@/i18n/getDictionary'
import { Reveal } from '@/components/motion/Reveal'

// Trust-forward marks: authenticity shield, grading slab, insured shipping.
const ICONS: ReactNode[] = [
  <path key="shield" d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z M9 12l2 2 4-4" />,
  <path key="grade" d="M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5" />,
  <path key="ship" d="M3 8h11v8H3z M14 11h4l3 3v2h-7 M6.5 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M17.5 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
]

export function ValueProps({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-y border-white/5 bg-panel/40">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:py-20">
        <div className="mb-10">
          <span
            aria-hidden="true"
            className="mb-3 block h-px w-10 bg-[color-mix(in_srgb,var(--gold)_60%,transparent)]"
          />
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {dict.home.whyTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {dict.why.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <div className="flex flex-col gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--gold)_10%,var(--panel-2))] text-gold ring-1 ring-inset ring-[color-mix(in_srgb,var(--gold)_30%,transparent)]"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {ICONS[i % ICONS.length]}
                  </svg>
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
