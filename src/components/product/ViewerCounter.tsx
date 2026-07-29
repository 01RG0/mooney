'use client'

import { useState, useEffect } from 'react'
import { useReducedMotion } from '@/lib/motion'

export function ViewerCounter({
  product,
}: {
  product: { viewerCount?: { min: number; max: number; enabled: boolean } }
}) {
  const vc = product.viewerCount
  const rm = useReducedMotion()
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const [count, setCount] = useState(() =>
    vc?.enabled ? rand(vc.min, vc.max) : 0,
  )

  useEffect(() => {
    if (!vc?.enabled) return
    const interval = setInterval(
      () => setCount(rand(vc.min, vc.max)),
      rand(3000, 6000),
    )
    return () => clearInterval(interval)
  }, [vc?.enabled, vc?.min, vc?.max])

  if (!vc?.enabled) return null

  return (
    <span
      className="inline-flex max-w-full items-center gap-2.5 rounded-[16px] px-3.5 py-2"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,248,247,0.95) 0%, rgba(248,217,216,0.72) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(231,154,147,0.28), 0 6px 18px -12px rgba(180,110,110,0.35)',
      }}
    >
      <span className="relative grid h-2.5 w-2.5 shrink-0 place-items-center" aria-hidden>
        {!rm && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: '#E79A93',
              animation: 'viewerPulse 2.2s ease-out infinite',
            }}
          />
        )}
        <span
          className="relative h-2 w-2 rounded-full"
          style={{
            background: '#E79A93',
            boxShadow: '0 0 0 3px rgba(231,154,147,0.18)',
          }}
        />
      </span>

      <span className="min-w-0 text-[13px] leading-none tracking-wide text-[#6b5b57]">
        <span
          key={count}
          className="font-semibold tabular-nums text-[#3d2f2c]"
          style={rm ? undefined : { animation: 'popIn 0.35s ease-out both' }}
        >
          {count}
        </span>
        <span className="ml-1.5 font-medium text-[#9A7E7B]">viewing now</span>
      </span>
    </span>
  )
}
