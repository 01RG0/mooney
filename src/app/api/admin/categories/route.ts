import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

const imagePath = z.string().refine(
  (v) => v.startsWith('/') || /^https?:\/\//.test(v),
  { message: 'Must be an absolute URL or a path starting with /' }
)

const CategoryBodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional().default(''),
  image: imagePath,
})

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const rawBody = await request.json()
    const parsed = CategoryBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const category = parsed.data
    await getAdminDb().collection('categories').doc(category.slug).set(category)
    return Response.json(category, { status: 201 })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
