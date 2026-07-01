'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const GLOW_SIZE = 600

/**
 * Electric-blue glow that follows the cursor, rendered above content with a
 * `screen` blend so it only lightens (adds a moving blue sheen) and never
 * hurts text legibility. Disabled only on devices with no fine pointer.
 *
 * Intentionally NOT gated by prefers-reduced-motion: this is a subtle ambient
 * brand effect (no large translation/parallax). Heavier content animations
 * (hero parallax, 3D card tilt, scroll reveals) still respect reduced-motion.
 */
export function CursorGlow() {
  const [enabled, setEnabled] = useState(false)

  const x = useMotionValue(-GLOW_SIZE)
  const y = useMotionValue(-GLOW_SIZE)
  const springX = useSpring(x, { stiffness: 140, damping: 26, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 140, damping: 26, mass: 0.5 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    // any-pointer (not pointer) so a mouse still counts on touchscreen laptops
    if (!window.matchMedia('(any-pointer: fine)').matches) return

    setEnabled(true)

    const handleMove = (e: PointerEvent) => {
      x.set(e.clientX - GLOW_SIZE / 2)
      y.set(e.clientY - GLOW_SIZE / 2)
    }

    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [x, y])

  if (!enabled) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 rounded-full"
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        x: springX,
        y: springY,
        background:
          'radial-gradient(circle, rgba(61,231,255,0.40) 0%, rgba(76,134,255,0.18) 35%, transparent 65%)',
        mixBlendMode: 'screen',
        filter: 'blur(30px)',
      }}
    />
  )
}
