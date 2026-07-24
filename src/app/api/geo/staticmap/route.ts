import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')
  const apiKey = process.env.GEOAPIFY_API_KEY

  if (!lat || !lng) return new Response('Missing lat/lng', { status: 400 })
  if (!apiKey) return new Response('Not configured', { status: 503 })

  const url = `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=400&height=180&center=lonlat:${lng},${lat}&zoom=14&apiKey=${apiKey}`
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  return new Response(buffer, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } })
}
