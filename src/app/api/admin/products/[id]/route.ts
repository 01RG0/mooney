import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    await getAdminDb().collection('products').doc(id).update({ ...body, updatedAt: new Date().toISOString() })
    const updated = await getAdminDb().collection('products').doc(id).get()
    return Response.json({ id: updated.id, ...updated.data() })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    await getAdminDb().collection('products').doc(id).delete()
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
