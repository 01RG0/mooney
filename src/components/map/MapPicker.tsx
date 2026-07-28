'use client'
import { useEffect, useRef, useState } from 'react'

interface PickResult {
  address: string
  city: string
  governorate: string
  postalCode?: string
  countryCode?: string
  country?: string
  lat: number
  lng: number
}

interface MapPickerProps {
  onConfirm: (result: PickResult) => void
  onClose: () => void
  initialLat?: number
  initialLng?: number
}

// Egypt center
const DEFAULT_LAT = 26.8
const DEFAULT_LNG = 30.8
const DEFAULT_ZOOM = 6

// Inline SVG for the map pin — fully self-contained, no external image dependency
const PIN_SVG = '<svg viewBox="0 0 24 36" width="24" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0zm0 18a6 6 0 110-12 6 6 0 010 12z" fill="#944a19"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>'

export function MapPicker({ onConfirm, onClose, initialLat, initialLng }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<import('leaflet').Map | null>(null)
  const marker = useRef<import('leaflet').Marker | null>(null)
  const [pinLat, setPinLat] = useState<number | null>(initialLat ?? null)
  const [pinLng, setPinLng] = useState<number | null>(initialLng ?? null)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ label: string; lat: number; lng: number }[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    // Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      // SVG pin icon — fully inline, no external image dependencies
      const makePin = (lat: number, lng: number) =>
        L.marker([lat, lng], {
          icon: L.divIcon({
            html: '<svg viewBox="0 0 24 36" width="24" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0zm0 18a6 6 0 110-12 6 6 0 010 12z" fill="#944a19"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>',
            className: '',
            iconSize: [24, 36],
            iconAnchor: [12, 36],
          }),
          draggable: true,
        })

      const startLat = initialLat ?? DEFAULT_LAT
      const startLng = initialLng ?? DEFAULT_LNG
      const startZoom = initialLat ? 14 : DEFAULT_ZOOM

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([startLat, startLng], startZoom)
      leafletMap.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      if (initialLat && initialLng) {
        marker.current = makePin(initialLat, initialLng).addTo(map)
        marker.current.on('dragend', () => {
          const pos = marker.current!.getLatLng()
          void reverseGeocode(pos.lat, pos.lng)
        })
        void reverseGeocode(initialLat, initialLng)
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (marker.current) {
          marker.current.setLatLng([lat, lng])
        } else {
          marker.current = makePin(lat, lng).addTo(map)
          marker.current.on('dragend', () => {
            const pos = marker.current!.getLatLng()
            void reverseGeocode(pos.lat, pos.lng)
          })
        }
        void reverseGeocode(lat, lng)
      })
    })

    return () => {
      leafletMap.current?.remove()
      leafletMap.current = null
      marker.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reverseGeocode(lat: number, lng: number) {
    setPinLat(lat)
    setPinLng(lng)
    setLoading(true)
    setAddress('')
    try {
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      const f = data.features?.[0]
      if (f) {
        setAddress(f.properties.formatted ?? '')
        setPinLat(lat)
        setPinLng(lng)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setSuggestions([]); setSearchOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geo/autocomplete?text=${encodeURIComponent(value)}`)
        const data = await res.json()
        const items = (data.features ?? []).map((f: { properties: { formatted: string }; geometry: { coordinates: [number, number] } }) => ({
          label: f.properties.formatted,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }))
        setSuggestions(items)
        setSearchOpen(true)
      } catch {
        setSuggestions([])
      }
    }, 400)
  }

  function flyTo(lat: number, lng: number, label: string) {
    setQuery(label)
    setSuggestions([])
    setSearchOpen(false)
    leafletMap.current?.flyTo([lat, lng], 16)
    import('leaflet').then((L) => {
      if (marker.current) {
        marker.current.setLatLng([lat, lng])
      } else {
        marker.current = L.marker([lat, lng], {
          icon: L.divIcon({
            html: '<svg viewBox="0 0 24 36" width="24" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0zm0 18a6 6 0 110-12 6 6 0 010 12z" fill="#944a19"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>',
            className: '',
            iconSize: [24, 36],
            iconAnchor: [12, 36],
          }),
          draggable: true,
        }).addTo(leafletMap.current!)
        marker.current.on('dragend', () => {
          const pos = marker.current!.getLatLng()
          void reverseGeocode(pos.lat, pos.lng)
        })
      }
      void reverseGeocode(lat, lng)
    })
  }

  function handleConfirm() {
    if (!pinLat || !pinLng) return
    // Parse address details from the last reverse geocode — we stored them in `address`
    // Ask the API again so we have structured fields
    setLoading(true)
    fetch(`/api/geo/reverse?lat=${pinLat}&lng=${pinLng}`)
      .then((r) => r.json())
      .then((data) => {
        const f = data.features?.[0]?.properties ?? {}
        // Geoapify Egyptian addresses: city may be in district, suburb, quarter, or county
        const city = f.city ?? f.district ?? f.suburb ?? f.quarter ?? f.county ?? ''
        const governorate = f.state ?? f.county ?? ''
        // Build a clean street address from components if formatted is too long
        const streetParts = [f.housenumber, f.street, f.neighbourhood].filter(Boolean)
        const streetAddress = streetParts.length > 0 ? streetParts.join(' ') : (f.formatted ?? address)
        onConfirm({
          address: streetAddress,
          city,
          governorate,
          postalCode: f.postcode ?? '',
          countryCode: f.country_code ?? '',
          country: f.country ?? '',
          lat: pinLat,
          lng: pinLng,
        })
      })
      .catch(() => {
        onConfirm({ address, city: '', governorate: '', countryCode: '', country: '', lat: pinLat, lng: pinLng })
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brown-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-3xl bg-blush-50 shadow-2xl overflow-hidden" style={{ height: '90vh', maxHeight: 640 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brown-900/10">
          <h2 className="font-display text-lg text-brown-900">Choose Location</h2>
          <button type="button" onClick={onClose} className="text-brown-700 hover:text-brown-900 transition-colors" aria-label="Close">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative px-4 pt-3 pb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search an address…"
            className="w-full rounded-2xl border border-brown-900/15 bg-white/70 px-4 py-2.5 pr-10 text-sm text-brown-900 placeholder:text-brown-700/50 focus:border-rose-400/60 focus:outline-none"
          />
          <svg className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-700/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          {searchOpen && suggestions.length > 0 && (
            <ul className="absolute left-4 right-4 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-brown-900/10 bg-blush-50 shadow-lg">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => flyTo(s.lat, s.lng, s.label)}
                    className={`w-full px-4 py-2.5 text-left text-sm text-brown-900 hover:bg-rose-400/10 transition-colors ${i < suggestions.length - 1 ? 'border-b border-brown-900/6' : ''}`}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {/* Tap hint */}
          {!pinLat && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="rounded-full bg-white/80 px-4 py-1.5 text-xs text-brown-700 shadow">
                Tap the map to drop a pin
              </span>
            </div>
          )}
        </div>

        {/* Footer — address preview + confirm */}
        <div className="border-t border-brown-900/10 px-5 py-4 bg-white/60 backdrop-blur-sm">
          {loading ? (
            <p className="text-sm text-brown-700 animate-pulse">Looking up address…</p>
          ) : pinLat ? (
            <p className="text-sm text-brown-800 line-clamp-2">{address || `${pinLat.toFixed(5)}, ${pinLng?.toFixed(5)}`}</p>
          ) : (
            <p className="text-sm text-brown-700/60">No location selected yet</p>
          )}
          <button
            type="button"
            disabled={!pinLat || loading}
            onClick={handleConfirm}
            className="mt-3 w-full rounded-full bg-rose-400 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}
