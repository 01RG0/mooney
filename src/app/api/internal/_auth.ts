import type { NextRequest } from 'next/server'

export function requireInternalKey(request: NextRequest): boolean {
  const key = process.env.INTERNAL_API_KEY
  if (!key) return false
  const header = request.headers.get('x-api-key')
  return header === key
}
