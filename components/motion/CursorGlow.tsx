'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

const GLOW_SIZE = 500

export function CursorGlow() {
  const reducedMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  const x = useMotionValue(-GLOW_SIZE)
  const y = useMotionValue(-GLOW_SIZE)
  const springX = useSpring(x, { stiffness: 120, damping: 30, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 120, damping: 30, mass: 0.6 })

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
          'radial-gradient(circle, color-mix(in srgb, var(--gold) 100%, transparent) 0%, transparent 60%)',
        opacity: 0.06,
        filter: 'blur(40px)',
      }}
    />
  )
}
