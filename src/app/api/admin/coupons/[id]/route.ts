import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  description: z.string().optional(),
  discountType: z.enum(['percent', 'fixed', 'free_shipping']).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  maxUsesPerCustomer: z.number().int().min(1).nullable().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  appliesToProductIds: z.array(z.string()).optional(),
  appliesToCategoryIds: z.array(z.string()).optional(),
  allowedEmails: z.array(z.string()).optional(),
  freeShipping: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = getAdminDb()
    const doc = await db.collection('coupons').doc(id.toUpperCase()).get()
    if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })

    const usageSnap = await db.collection('couponUsage')
      .where('couponCode', '==', id.toUpperCase())
      .orderBy('usedAt', 'desc')
      .get()
    const usage = usageSnap.docs.map(d => d.data())

    return Response.json({ ...doc.data(), code: doc.id, usage })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = getAdminDb()
    const ref = db.collection('coupons').doc(id.toUpperCase())
    const doc = await ref.get()
    if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })

    const raw = await request.json()
    const parsed = PatchSchema.safeParse(raw)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const update = { ...parsed.data, updatedAt: new Date().toISOString() }
    await ref.update(update)
    const updated = await ref.get()
    return Response.json({ ...updated.data(), code: updated.id })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = getAdminDb()
    const ref = db.collection('coupons').doc(id.toUpperCase())
    const doc = await ref.get()
    if (!doc.exists) return Response.json({ error: 'Not found' }, { status: 404 })
    await ref.delete()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
