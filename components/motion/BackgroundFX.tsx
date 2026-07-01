'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Site-wide fixed background layer:
 *  - a large brand logo watermark (mix-blend-screen drops the PNG's dark
 *    starfield so only the chrome/glow shows faintly — a "gota de agua" mark)
 *  - two slow-drifting electric-blue aurora blobs
 *  - an electric-blue glow that eases toward the cursor
 * Sits behind all content (-z-10, fixed) and stays put while scrolling.
 * Fully static under prefers-reduced-motion.
 */
export function BackgroundFX() {
  const reduce = useReducedMotion()
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    if (
      typeof window !== 'undefined' &&
      !window.matchMedia('(pointer: fine)').matches
    ) {
      return
    }

    const target = { x: 0.5, y: 0.4 }
    const cur = { x: 0.5, y: 0.4 }
    let raf = 0

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth
      target.y = e.clientY / window.innerHeight
    }

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.05
      cur.y += (target.y - cur.y) * 0.05
      const el = glowRef.current
      if (el) {
        el.style.left = `${cur.x * 100}%`
        el.style.top = `${cur.y * 100}%`
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduce])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Electric-blue drifting aurora */}
      <div
        className={`bg-aurora ${reduce ? '' : 'bg-aurora-a'}`}
        style={{
          top: '2%',
          left: '4%',
          background:
            'radial-gradient(circle, rgba(61,231,255,0.42), transparent 64%)',
        }}
      />
      <div
        className={`bg-aurora ${reduce ? '' : 'bg-aurora-b'}`}
        style={{
          bottom: '2%',
          right: '2%',
          background:
            'radial-gradient(circle, rgba(76,134,255,0.40), transparent 64%)',
        }}
      />

      {/* Cursor-following electric-blue glow */}
      <div
        ref={glowRef}
        className="absolute h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          top: '40%',
          left: '50%',
          background:
            'radial-gradient(circle, rgba(61,231,255,0.20), transparent 60%)',
        }}
      />

      {/* Brand logo watermark */}
      <div className="absolute left-1/2 top-1/2 w-[min(94vw,1040px)] -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/logo.png"
          alt=""
          width={1040}
          height={1040}
          className="h-auto w-full select-none opacity-[0.24] mix-blend-screen"
        />
      </div>
    </div>
  )
}
