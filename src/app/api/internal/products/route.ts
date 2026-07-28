import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireInternalKey } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!requireInternalKey(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const lowStock = searchParams.get('lowStock') === 'true'

  let query = getAdminDb().collection('products') as FirebaseFirestore.Query
  if (lowStock) query = query.where('stock', '<=', 3)

  const snap = await query.get()
  const products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return Response.json({ products, count: products.length })
}
