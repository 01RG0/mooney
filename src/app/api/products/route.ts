import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const isNewParam = sp.get('isNew')
    const category = sp.get('category')
    const exclude = sp.get('exclude')
    const limit = parseInt(sp.get('limit') ?? '20', 10)

    let query: FirebaseFirestore.Query = getAdminDb().collection('products')
    if (isNewParam === 'true') query = query.where('isNew', '==', true)
    if (category) query = query.where('category', '==', category)
    query = query.limit(limit)

    const snap = await query.get()
    let products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (exclude) products = products.filter((p) => (p as { slug?: string }).slug !== exclude)

    return Response.json(products)
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
