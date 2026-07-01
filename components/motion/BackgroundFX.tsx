'use client'

import Image from 'next/image'

/**
 * Site-wide fixed background layer:
 *  - a large brand logo watermark (mix-blend-screen drops the PNG's dark
 *    starfield so only the chrome/glow shows — a "gota de agua" mark)
 *  - two slow-drifting electric-blue aurora blobs
 * Sits behind all content (-z-10, fixed) and stays put while scrolling.
 * The cursor-following glow lives in CursorGlow (rendered above content).
 *
 * The aurora drift is a subtle ambient brand effect and runs regardless of
 * prefers-reduced-motion; heavier content animations still respect it.
 */
export function BackgroundFX() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Electric-blue drifting aurora */}
      <div
        className="bg-aurora bg-aurora-a"
        style={{
          top: '2%',
          left: '4%',
          background:
            'radial-gradient(circle, rgba(61,231,255,0.42), transparent 64%)',
        }}
      />
      <div
        className="bg-aurora bg-aurora-b"
        style={{
          bottom: '2%',
          right: '2%',
          background:
            'radial-gradient(circle, rgba(76,134,255,0.40), transparent 64%)',
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
