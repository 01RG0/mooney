import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000 // 2 hours

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: orderId } = await params
  const db = getAdminDb()
  const ref = db.collection('orders').doc(orderId)
  const doc = await ref.get()

  if (!doc.exists) return Response.json({ error: 'Order not found' }, { status: 404 })

  const order = doc.data() as { userId: string; status: string; createdAt: string }

  if (order.userId !== user.uid) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status === 'cancelled') {
    return Response.json({ error: 'Order is already cancelled' }, { status: 409 })
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    return Response.json({ error: 'Cannot cancel an order that has already shipped' }, { status: 409 })
  }

  const createdAt = new Date(order.createdAt).getTime()
  if (Date.now() - createdAt > CANCEL_WINDOW_MS) {
    return Response.json({ error: 'Cancellation window has passed (2 hours)' }, { status: 409 })
  }

  await ref.update({ status: 'cancelled', updatedAt: new Date().toISOString() })

  return Response.json({ ok: true })
}
