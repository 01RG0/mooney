import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import type { Coupon } from '@/lib/types'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
  productIds: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
})

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = await request.json()
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const { code, subtotal, productIds, categoryIds } = parsed.data
  const upperCode = code.trim().toUpperCase()

  const db = getAdminDb()
  const doc = await db.collection('coupons').doc(upperCode).get()
  if (!doc.exists) return Response.json({ error: 'Coupon not found', message: 'Invalid coupon code' }, { status: 404 })

  const coupon = doc.data() as Coupon

  if (!coupon.active) return Response.json({ error: 'Coupon is inactive', message: 'This coupon is no longer active' }, { status: 410 })

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return Response.json({ error: 'Coupon expired', message: 'This coupon has expired' }, { status: 410 })
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return Response.json({ error: 'Coupon exhausted', message: 'This coupon has reached its usage limit' }, { status: 410 })
  }

  if (coupon.minOrderValue != null && subtotal < coupon.minOrderValue) {
    return Response.json({
      error: 'Minimum order not met',
      message: `Minimum order of ${coupon.minOrderValue.toLocaleString()} EGP required`,
    }, { status: 422 })
  }

  // Per-customer limit check
  if (coupon.maxUsesPerCustomer != null) {
    const usageSnap = await db.collection('couponUsage')
      .where('couponCode', '==', upperCode)
      .where('userId', '==', user.uid)
      .get()
    if (usageSnap.size >= coupon.maxUsesPerCustomer) {
      return Response.json({ error: 'Customer limit reached', message: 'You have already used this coupon' }, { status: 410 })
    }
  }

  // Allowed emails check
  if (coupon.allowedEmails && coupon.allowedEmails.length > 0) {
    if (!user.email || !coupon.allowedEmails.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) {
      return Response.json({ error: 'Not eligible', message: 'This coupon is not available for your account' }, { status: 403 })
    }
  }

  // Product/category restriction check
  if (coupon.appliesToProductIds && coupon.appliesToProductIds.length > 0) {
    const hasMatch = productIds.some(id => coupon.appliesToProductIds!.includes(id))
    if (!hasMatch) return Response.json({ error: 'Not applicable', message: 'This coupon does not apply to items in your cart' }, { status: 422 })
  }
  if (coupon.appliesToCategoryIds && coupon.appliesToCategoryIds.length > 0) {
    const hasMatch = categoryIds.some(id => coupon.appliesToCategoryIds!.includes(id))
    if (!hasMatch) return Response.json({ error: 'Not applicable', message: 'This coupon does not apply to items in your cart' }, { status: 422 })
  }

  // Calculate discount
  let discountAmount = 0
  let freeShipping = false

  if (coupon.discountType === 'percent') {
    discountAmount = Math.round((subtotal * coupon.discountValue) / 100)
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue, subtotal)
  } else if (coupon.discountType === 'free_shipping') {
    freeShipping = true
    discountAmount = 0
  }

  if (coupon.freeShipping) freeShipping = true

  return Response.json({
    valid: true,
    code: upperCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    freeShipping,
    description: coupon.description ?? '',
  })
}
