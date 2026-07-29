import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

const CouponSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric or dash').transform(v => v.toUpperCase()),
  description: z.string().optional().default(''),
  discountType: z.enum(['percent', 'fixed', 'free_shipping']),
  discountValue: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  maxUsesPerCustomer: z.number().int().min(1).optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().optional(),
  appliesToProductIds: z.array(z.string()).optional().default([]),
  appliesToCategoryIds: z.array(z.string()).optional().default([]),
  allowedEmails: z.array(z.string().email()).optional().default([]),
  freeShipping: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    await requireAdmin()
    const db = getAdminDb()
    const snap = await db.collection('coupons').orderBy('createdAt', 'desc').get()
    const coupons = snap.docs.map(d => ({ ...d.data(), code: d.id }))
    return Response.json(coupons)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const raw = await request.json()
    // Pre-uppercase the code before validation
    if (raw.code) raw.code = String(raw.code).toUpperCase()
    const parsed = CouponSchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { code, ...rest } = parsed.data
    const db = getAdminDb()
    const existing = await db.collection('coupons').doc(code).get()
    if (existing.exists) return Response.json({ error: 'Coupon code already exists' }, { status: 409 })

    const now = new Date().toISOString()
    const coupon = { ...rest, code, usedCount: 0, createdAt: now, updatedAt: now }
    await db.collection('coupons').doc(code).set(coupon)
    return Response.json(coupon, { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
