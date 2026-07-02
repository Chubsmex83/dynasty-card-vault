'use client'

import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { cn } from '@/lib/utils'

const MAX_TILT = 7

export function MotionCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  // normalized pointer position: -0.5 .. 0.5 (0 = center)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  // sheen position in %
  const sheenX = useMotionValue(50)
  const sheenY = useMotionValue(50)
  const sheenOpacity = useMotionValue(0)

  const springConfig = { stiffness: 220, damping: 20, mass: 0.5 }
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), springConfig)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), springConfig)
  const smoothSheenX = useSpring(sheenX, springConfig)
  const smoothSheenY = useSpring(sheenY, springConfig)
  const smoothSheenOpacity = useSpring(sheenOpacity, { stiffness: 160, damping: 24 })

  const sheenBackground = useMotionTemplate`radial-gradient(60% 60% at ${smoothSheenX}% ${smoothSheenY}%, rgba(61,231,255,0.5), rgba(179,107,255,0.35) 40%, rgba(201,162,75,0.25) 65%, transparent 80%)`

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    px.set(nx - 0.5)
    py.set(ny - 0.5)
    sheenX.set(nx * 100)
    sheenY.set(ny * 100)
    sheenOpacity.set(0.55)
  }

  function handlePointerLeave() {
    px.set(0)
    py.set(0)
    sheenX.set(50)
    sheenY.set(50)
    sheenOpacity.set(0)
  }

  // NOTE: the DOM structure must be identical on server and client to avoid a
  // hydration mismatch. useReducedMotion() is false during SSR and the real
  // value on the client, so we must NOT branch the markup on it — we only gate
  // the interaction (pointer handlers / hover), keeping the tree constant.
  return (
    <div className={cn('relative', className)} style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onPointerMove={reducedMotion ? undefined : handlePointerMove}
        onPointerLeave={reducedMotion ? undefined : handlePointerLeave}
        className="relative h-full rounded-2xl"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={reducedMotion ? undefined : { z: 12 }}
        transition={{ type: 'spring', ...springConfig }}
      >
        {children}
        {/* prismatic foil sheen — tracks the cursor like light across a refractor */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl mix-blend-screen"
          style={{
            background: sheenBackground,
            opacity: smoothSheenOpacity,
          }}
        />
      </motion.div>
    </div>
  )
}
