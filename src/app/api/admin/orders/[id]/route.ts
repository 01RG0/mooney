import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const doc = await getAdminDb().collection('orders').doc(id).get()
    if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ id: doc.id, ...doc.data() })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { status } = await request.json()
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 })
    await getAdminDb().collection('orders').doc(id).update({ status, updatedAt: new Date().toISOString() })
    const updated = await getAdminDb().collection('orders').doc(id).get()
    return Response.json({ id: updated.id, ...updated.data() })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
