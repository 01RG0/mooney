import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

const imagePath = z.string().refine(
  (v) => v.startsWith('/') || /^https?:\/\//.test(v),
  { message: 'Must be an absolute URL or a path starting with /' }
)

const ProductBodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  image: imagePath,
  description: z.string().optional().default(''),
  details: z.array(z.string()).optional().default([]),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional().default([]),
  maker: z.string().optional().default(''),
  isNew: z.boolean().optional().default(false),
  stock: z.number().int().min(0).optional().default(0),
  images: z.array(imagePath).optional().default([]),
  mainImageIndex: z.number().int().min(0).optional().default(0),
  viewerCount: z.any().optional().default(null),
  hasColors: z.boolean().optional().default(false),
  colorVariants: z.array(z.any()).optional().default([]),
})

export async function GET() {
  try {
    await requireAdmin()
    const snap = await getAdminDb().collection('products').get()
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return Response.json(products)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const rawBody = await request.json()
    const parsed = ProductBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const product = { ...parsed.data, createdAt: new Date().toISOString() }
    const ref = await getAdminDb().collection('products').add(product)
    return Response.json({ id: ref.id, ...product }, { status: 201 })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
