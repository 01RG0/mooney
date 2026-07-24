'use client'
import { useState, useEffect } from 'react'

export function ViewerCounter({
  product,
}: {
  product: { viewerCount?: { min: number; max: number; enabled: boolean } }
}) {
  const vc = product.viewerCount
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  const [count, setCount] = useState(() =>
    vc?.enabled ? rand(vc.min, vc.max) : 0,
  )

  useEffect(() => {
    if (!vc?.enabled) return
    const interval = setInterval(
      () => setCount(rand(vc.min, vc.max)),
      rand(15000, 20000),
    )
    return () => clearInterval(interval)
  }, [vc?.enabled, vc?.min, vc?.max])

  if (!vc?.enabled) return null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-200/80 px-3 py-1 text-xs text-brown-700">
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count} people viewing this
    </span>
  )
}
