import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await getAdminDb()
    .collection('orders')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const orders = snap.docs.map((d) => d.data())
  return Response.json(orders)
}
