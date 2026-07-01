'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

const GLOW_SIZE = 600

/**
 * Electric-blue glow that follows the cursor, rendered above content with a
 * `screen` blend so it only lightens (adds a moving blue sheen) and never
 * hurts text legibility. Disabled on touch devices and under reduced motion.
 */
export function CursorGlow() {
  const reducedMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  const x = useMotionValue(-GLOW_SIZE)
  const y = useMotionValue(-GLOW_SIZE)
  const springX = useSpring(x, { stiffness: 140, damping: 26, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 140, damping: 26, mass: 0.5 })

  useEffect(() => {
    if (reducedMotion) return
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return

    setEnabled(true)

    const handleMove = (e: PointerEvent) => {
      x.set(e.clientX - GLOW_SIZE / 2)
      y.set(e.clientY - GLOW_SIZE / 2)
    }

    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [reducedMotion, x, y])

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
