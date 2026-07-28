import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireInternalKey } from '../../_auth'
import type { OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'pending-payment', 'pending-manual-confirmation',
  'confirmed', 'shipped', 'delivered', 'cancelled',
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireInternalKey(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const doc = await getAdminDb().collection('orders').doc(id).get()
  if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ id: doc.id, ...doc.data() })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireInternalKey(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json() as { status?: string; note?: string }

  if (body.status && !VALID_STATUSES.includes(body.status as OrderStatus)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const ref = getAdminDb().collection('orders').doc(id)
  const doc = await ref.get()
  if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (body.status) updates.status = body.status
  if (body.note) updates.adminNote = body.note

  await ref.update(updates)
  const updated = await ref.get()
  return Response.json({ id: updated.id, ...updated.data() })
}
