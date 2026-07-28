import type { NextRequest } from 'next/server'

export function requireInternalKey(request: NextRequest): boolean {
  const key = process.env.INTERNAL_API_KEY
  if (!key) return process.env.NODE_ENV === 'development'
  return request.headers.get('x-api-key') === key
}
