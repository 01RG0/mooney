import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import { computeShipping } from '@/lib/cart'
import type { CartItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { items, shippingDetails }: { items: CartItem[]; shippingDetails: { fullName: string; email: string; address: string; city: string; postalCode: string; country: string } } = body

  // SECURITY: recompute total server-side — never trust client total
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const serverTotal = subtotal + computeShipping(subtotal)
  const amountCents = Math.round(serverTotal * 100)

  const apiKey = process.env.PAYMOB_API_KEY
  const integrationId = parseInt(process.env.PAYMOB_INTEGRATION_ID ?? '0', 10)
  const iframeId = process.env.PAYMOB_IFRAME_ID

  if (!apiKey || !integrationId || !iframeId) {
    return Response.json({ error: 'Paymob not configured' }, { status: 503 })
  }

  // Step 1: auth token
  const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  })
  const { token: authToken } = await authRes.json()

  // Step 2: create Paymob order
  const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_token: authToken, delivery_needed: false, amount_cents: amountCents, currency: 'EGP', items: [] }),
  })
  const { id: paymobOrderId } = await orderRes.json()

  const nameParts = shippingDetails.fullName.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || 'NA'

  // Step 3: payment key
  const pkRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      currency: 'EGP',
      order_id: paymobOrderId,
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email: shippingDetails.email,
        phone_number: 'NA',
        apartment: 'NA',
        floor: 'NA',
        street: shippingDetails.address,
        building: 'NA',
        shipping_method: 'NA',
        postal_code: shippingDetails.postalCode || 'NA',
        city: shippingDetails.city,
        country: shippingDetails.country || 'Egypt',
        state: 'NA',
      },
      integration_id: integrationId,
      expiration: 3600,
      lock_order_when_paid: false,
    }),
  })
  const { token: paymentKey } = await pkRes.json()

  // Create internal order record
  const now = new Date().toISOString()
  const orderId = 'MC-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))).join('')
  await getAdminDb().collection('orders').doc(orderId).set({
    id: orderId,
    userId: user.uid,
    email: user.email ?? shippingDetails.email,
    items,
    shippingDetails,
    total: serverTotal,
    status: 'pending-payment',
    paymentMethod: 'paymob',
    paymobOrderId: String(paymobOrderId),
    createdAt: now,
    updatedAt: now,
  })

  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`
  return Response.json({ iframeUrl, orderId })
}
