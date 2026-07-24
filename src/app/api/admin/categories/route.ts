import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { slug, name, tagline, image } = body
    const category = { slug, name, tagline, image }
    await getAdminDb().collection('categories').doc(slug).set(category)
    return Response.json(category, { status: 201 })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
