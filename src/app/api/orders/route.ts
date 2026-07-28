import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import { calculateDeliveryFee, getDeliveryFeeEstimate } from '@/lib/delivery'
import { sendTelegramMessage, formatOrderMessage, getOrderKeyboard } from '@/lib/telegram'

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

const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

const ShippingDetailsSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional().default(''),
  country: z.string().min(1),
  governorate: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),
  // client-submitted fee is accepted for logging/fraud-detection but never trusted for billing
  deliveryFee: z.number().optional(),
  deliveryFeeConfirmed: z.boolean().optional(),
})

const OrderBodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
  shippingDetails: ShippingDetailsSchema,
  paymentMethod: z.string().optional(),
  paymentPhone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const rawBody = await request.json()
    const parsed = OrderBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { items, shippingDetails, paymentMethod, paymentPhone } = parsed.data

    // ── Server-side price verification ────────────────────────────────────────
    // Fetch all product prices from Firestore; never trust client-submitted prices
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
      const data = doc.data() as { price: number; stock?: number; name?: string }
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

    // ── Server-side delivery fee ───────────────────────────────────────────────
    const { coordinates, governorate } = shippingDetails
    let deliveryResult
    if (coordinates && governorate) {
      deliveryResult = calculateDeliveryFee(coordinates.lat, coordinates.lng, governorate)
    } else {
      deliveryResult = getDeliveryFeeEstimate()
    }

    if (deliveryResult.blocked) {
      return Response.json({ error: deliveryResult.note ?? 'Delivery not available in your location' }, { status: 422 })
    }

    const deliveryCost = deliveryResult.fee
    const total = subtotal + deliveryCost

    // Log if client tried to submit a tampered delivery fee
    if (
      typeof shippingDetails.deliveryFee === 'number' &&
      shippingDetails.deliveryFee !== deliveryCost
    ) {
      console.warn('[delivery-fee-mismatch]', {
        clientFee: shippingDetails.deliveryFee,
        serverFee: deliveryCost,
        userId: user.uid,
      })
    }

    const orderId = 'MC-' + Array.from({ length: 6 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))
    ).join('')

    const now = new Date().toISOString()
    const order = {
      id: orderId,
      userId: user.uid,
      userEmail: user.email,
      email: user.email ?? shippingDetails.email,
      items: verifiedItems,
      shippingDetails,
      subtotal,
      deliveryCost,
      total,
      status: paymentMethod === 'orange-cash' ? 'pending-manual-confirmation' : 'pending',
      createdAt: now,
      updatedAt: now,
      ...(paymentMethod && { paymentMethod }),
      ...(paymentPhone  && { paymentPhone  }),
    }

    await db.collection('orders').doc(orderId).set(order)

    // ── Telegram notification (non-blocking) ──────────────────────────────────
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
    if (chatId && process.env.TELEGRAM_BOT_TOKEN) {
      sendTelegramMessage(
        chatId,
        formatOrderMessage(order as Parameters<typeof formatOrderMessage>[0]),
        getOrderKeyboard(orderId, order.status),
      ).catch((e) => console.error('[telegram] notify failed', e))
    }

    // ── Pipedream order notification webhook (non-blocking) ───────────────────
    const pipedreamUrl = process.env.PIPEDREAM_ORDER_WEBHOOK_URL
    if (pipedreamUrl) {
      fetch(pipedreamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: order.status,
          total: String(total),
          paymentMethod: paymentMethod ?? 'N/A',
          shippingDetails: order.shippingDetails,
          items: order.items.map((i) => JSON.stringify(i)),
          deliveryCost: String(deliveryCost),
        }),
      }).catch((e) => console.error('[pipedream] notify failed', e))
    }

    return Response.json({
      orderId,
      total,
      deliveryFee: deliveryCost,
      email: order.email,
      estimatedDelivery: '5-7 business days',
    })
  } catch (err: unknown) {
    const typed = err as { status?: number; message?: string }
    if (typed?.status === 404 || typed?.status === 409) {
      return Response.json({ error: typed.message }, { status: typed.status })
    }
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
