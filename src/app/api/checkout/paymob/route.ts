import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import { calculateDeliveryFee, getDeliveryFeeEstimate } from '@/lib/delivery'

export const dynamic = 'force-dynamic'

const imagePath = z.string().refine(
  (v) => v.startsWith('/') || /^https?:\/\//.test(v),
  { message: 'Must be an absolute URL or a path starting with /' }
)

const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number(),
  image: imagePath,
  color: z.string(),
  colorHex: z.string().optional(),
  selectedColorId: z.string().optional(),
  quantity: z.number().int().min(1),
})

const ShippingDetailsSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default('Egypt'),
  governorate: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
})

const PaymobBodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
  shippingDetails: ShippingDetailsSchema,
})

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rawBody = await request.json()
  const parsed = PaymobBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { items, shippingDetails } = parsed.data

  const apiKey = process.env.PAYMOB_API_KEY
  const integrationId = parseInt(process.env.PAYMOB_INTEGRATION_ID ?? '0', 10)
  const iframeId = process.env.PAYMOB_IFRAME_ID

  if (!apiKey || !integrationId || !iframeId) {
    return Response.json({ error: 'Paymob not configured' }, { status: 503 })
  }

  // ── Server-side price verification ──────────────────────────────────────────
  const db = getAdminDb()
  const productDocs = await Promise.all(
    items.map((item) => db.collection('products').doc(item.productId).get())
  )

  let subtotal = 0
  const verifiedItems = items.map((item, i) => {
    const doc = productDocs[i]
    if (!doc.exists) {
      throw Object.assign(new Error(`Product not found: ${item.productId}`), { status: 404 })
    }
    const data = doc.data() as { price: number; stock?: number }
    if (typeof data.stock === 'number' && data.stock < item.quantity) {
      throw Object.assign(
        new Error(`Insufficient stock for product: ${item.productId}`),
        { status: 409 }
      )
    }
    const serverPrice = data.price
    if (item.price !== serverPrice) {
      console.warn('[price-mismatch]', { productId: item.productId, clientPrice: item.price, serverPrice, userId: user.uid })
    }
    subtotal += serverPrice * item.quantity
    return { ...item, price: serverPrice }
  })

  // ── Server-side delivery fee ─────────────────────────────────────────────────
  const { coordinates, governorate } = shippingDetails
  const deliveryResult = (coordinates && governorate)
    ? calculateDeliveryFee(coordinates.lat, coordinates.lng, governorate)
    : getDeliveryFeeEstimate()

  if (deliveryResult.blocked) {
    return Response.json({ error: deliveryResult.note ?? 'Delivery not available in your location' }, { status: 422 })
  }

  const shippingCost = deliveryResult.fee
  const serverTotal = subtotal + shippingCost
  const amountCents = Math.round(serverTotal * 100)

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
  await db.collection('orders').doc(orderId).set({
    id: orderId,
    userId: user.uid,
    userEmail: user.email,
    email: user.email ?? shippingDetails.email,
    items: verifiedItems,
    shippingDetails,
    subtotal,
    shippingCost,
    total: serverTotal,
    amountCents,
    status: 'pending-payment',
    paymentMethod: 'paymob',
    paymobOrderId: String(paymobOrderId),
    createdAt: now,
    updatedAt: now,
  })

  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`
  return Response.json({ iframeUrl, orderId })
}
