import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import { computeShipping } from '@/lib/cart'
import type { CartItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { items, shippingDetails, paymentMethod, paymentPhone } = await request.json() as {
      items: CartItem[]
      shippingDetails: { fullName: string; email: string; phone?: string; address: string; city: string; postalCode: string; country: string }
      paymentMethod?: string
      paymentPhone?: string
    }

    // SECURITY: always recompute total server-side — never trust client value
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const shippingCost = computeShipping(subtotal)
    const total = subtotal + shippingCost

    const orderId = 'MC-' + Array.from({ length: 6 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))
    ).join('')

    const now = new Date().toISOString()
    const order = {
      id: orderId,
      userId: user.uid,
      userEmail: user.email,
      email: user.email ?? shippingDetails.email,
      items,
      shippingDetails,
      subtotal,
      shippingCost,
      total,
      status: paymentMethod === 'orange-cash' ? 'pending-manual-confirmation' : 'pending',
      createdAt: now,
      updatedAt: now,
      ...(paymentMethod && { paymentMethod }),
      ...(paymentPhone  && { paymentPhone  }),
    }

    await getAdminDb().collection('orders').doc(orderId).set(order)

    return Response.json({
      orderId,
      total,
      email: order.email,
      estimatedDelivery: '5-7 business days',
    })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
