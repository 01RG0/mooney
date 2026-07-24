import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await getAdminDb()
    .collection('orders')
    .where('userId', '==', user.uid)
    .get()

  const orders = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = (a as Record<string, string>).createdAt ?? ''
      const tb = (b as Record<string, string>).createdAt ?? ''
      return tb.localeCompare(ta)
    })
  return Response.json(orders)
}
