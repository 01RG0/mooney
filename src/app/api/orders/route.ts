import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { items, shippingDetails, total, paymentMethod, paymentPhone } = await request.json()

    const orderId = 'MC-' + Array.from({ length: 6 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))
    ).join('')

    const now = new Date().toISOString()
    const order = {
      id: orderId,
      userId: user.uid,
      email: user.email ?? shippingDetails.email,
      items,
      shippingDetails,
      total,
      status: paymentMethod === 'orange-cash' ? 'pending-manual-confirmation' : 'pending',
      createdAt: now,
      updatedAt: now,
      ...(paymentMethod && { paymentMethod }),
      ...(paymentPhone && { paymentPhone }),
    }

    await getAdminDb().collection('orders').doc(orderId).set(order)

    return Response.json({ orderId, total, email: order.email, estimatedDelivery: '5-7 business days' })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
