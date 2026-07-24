import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snap = await getAdminDb().collection('categories').get()
    const categories = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return Response.json(categories)
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
