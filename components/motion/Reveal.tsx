'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type RevealAs = 'div' | 'section' | 'li'

/**
 * Scroll-reveal wrapper. IMPORTANT: we do NOT branch the rendered structure on
 * useReducedMotion() — doing so makes the server (reducedMotion=false) and
 * client (real value) render different trees, which breaks hydration and, in
 * turn, prevents framer's whileInView observer from attaching (leaving content
 * stuck at opacity:0). We render one consistent structure. Opacity still
 * animates in for reduced-motion users (framer keeps opacity), so content is
 * always revealed; the small translate is negligible.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: RevealAs
}) {
  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
