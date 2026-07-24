'use client'
import { useState, useEffect, useRef } from 'react'

interface GeoapifyFeature {
  properties: {
    formatted: string
    city?: string
    county?: string
    state?: string
    postcode?: string
  }
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
}

interface SelectResult {
  address: string
  city: string
  governorate: string
  postalCode?: string
  lat: number
  lng: number
}

export interface GeoapifyPickerProps {
  onSelect: (result: SelectResult) => void
  initialValue?: string
  className?: string
}

export function GeoapifyPicker({ onSelect, initialValue = '', className = '' }: GeoapifyPickerProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<GeoapifyFeature[]>([])
  const [selected, setSelected] = useState<SelectResult | null>(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    setSelected(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geo/autocomplete?text=${encodeURIComponent(value)}`)
        const data = await res.json()
        setResults(data.features ?? [])
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 400)
  }

  function handleSelect(feature: GeoapifyFeature) {
    const [lng, lat] = feature.geometry.coordinates
    const result: SelectResult = {
      address: feature.properties.formatted,
      city: feature.properties.city ?? feature.properties.county ?? '',
      governorate: feature.properties.state ?? '',
      postalCode: feature.properties.postcode,
      lat,
      lng,
    }
    setSelected(result)
    setQuery(feature.properties.formatted)
    setResults([])
    setOpen(false)
    onSelect(result)
  }

  function clear() {
    setQuery('')
    setSelected(null)
    setResults([])
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="Search address in Egypt…"
        className="w-full rounded-2xl border border-brown-900/15 bg-white/40 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/50 focus:border-rose-400/60 focus:outline-none"
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-brown-900/10 bg-blush-50 shadow-lg">
          {results.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(f)}
                className={`w-full px-4 py-2.5 text-left text-sm text-brown-900 hover:bg-rose-400/10 transition-colors ${i < results.length - 1 ? 'border-b border-brown-900/6' : ''}`}
              >
                {f.properties.formatted}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="mt-3">
          <img
            src={`/api/geo/staticmap?lat=${selected.lat}&lng=${selected.lng}`}
            alt="Selected location map"
            className="w-full max-h-48 rounded-2xl object-cover"
          />
          <button
            type="button"
            onClick={clear}
            className="mt-1.5 text-xs text-rose-400 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  )
}
