import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'
import type { OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'pending-payment',
  'pending-manual-confirmation',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]

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
    const body = await request.json() as {
      status?: string
      deliveryFee?: number
    }

    const ref = getAdminDb().collection('orders').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })

    const data = doc.data() ?? {}
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as OrderStatus)) {
        return Response.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
    }

    if (body.deliveryFee !== undefined) {
      const fee = Number(body.deliveryFee)
      if (!Number.isFinite(fee) || fee < 0) {
        return Response.json({ error: 'Invalid delivery fee' }, { status: 400 })
      }

      const items = (data.items ?? []) as { price?: number; quantity?: number }[]
      const subtotal =
        typeof data.subtotal === 'number'
          ? data.subtotal
          : items.reduce(
              (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
              0,
            )

      const shippingDetails = {
        ...(data.shippingDetails ?? {}),
        deliveryFee: fee,
        deliveryFeeConfirmed: true,
      }

      updates.subtotal = subtotal
      updates.deliveryCost = fee
      updates.total = subtotal + fee
      updates.shippingDetails = shippingDetails
    }

    if (body.status === undefined && body.deliveryFee === undefined) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 })
    }

    await ref.update(updates)
    const updated = await ref.get()
    return Response.json({ id: updated.id, ...updated.data() })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
