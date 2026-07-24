import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text') ?? ''
  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey || !text.trim()) return Response.json({ features: [] })

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:eg&limit=5&apiKey=${apiKey}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ features: [] })
  }
}
