import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')
  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!lat || !lng || !apiKey) return Response.json({ features: [] })

  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ features: [] })
  }
}
