import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireInternalKey } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!requireInternalKey(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const db = getAdminDb()
  const snap = await db.collection('orders').where('createdAt', '>=', date).get()

  const stats = {
    date,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  }

  for (const doc of snap.docs) {
    const d = doc.data() as { status?: string; total?: number; createdAt?: string }
    if (!d.createdAt?.startsWith(date)) continue
    stats.totalOrders++
    if (d.status === 'pending' || d.status === 'pending-manual-confirmation') stats.pendingOrders++
    if (d.status === 'confirmed' || d.status === 'shipped') stats.confirmedOrders++
    if (d.status === 'delivered') { stats.deliveredOrders++; stats.totalRevenue += d.total ?? 0 }
    if (d.status === 'cancelled') stats.cancelledOrders++
  }

  return Response.json(stats)
}
