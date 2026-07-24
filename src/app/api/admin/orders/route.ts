import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const snap = await getAdminDb().collection('orders').orderBy('createdAt', 'desc').get()
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return Response.json(orders)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
