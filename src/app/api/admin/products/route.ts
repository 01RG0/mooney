import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const snap = await getAdminDb().collection('products').get()
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return Response.json(products)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { name, slug, category, price, image, description, details, colors, maker, isNew, stock } = body
    const product = { name, slug, category, price, image, description, details: details ?? [], colors: colors ?? [], maker, isNew: isNew ?? false, stock: stock ?? 0, createdAt: new Date().toISOString() }
    const ref = await getAdminDb().collection('products').add(product)
    return Response.json({ id: ref.id, ...product }, { status: 201 })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
