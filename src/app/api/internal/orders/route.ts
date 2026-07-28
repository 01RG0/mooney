import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireInternalKey } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!requireInternalKey(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)
  const since = searchParams.get('since') // ISO date string

  let query = getAdminDb().collection('orders').orderBy('createdAt', 'desc') as FirebaseFirestore.Query

  if (status) query = query.where('status', '==', status)
  if (since) query = query.where('createdAt', '>=', since)
  query = query.limit(limit)

  const snap = await query.get()
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return Response.json({ orders, count: orders.length })
}
