import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const snap = await getAdminDb().collection('products').where('slug', '==', slug).limit(1).get()
    if (snap.empty) return Response.json({ error: 'Not found' }, { status: 404 })
    const doc = snap.docs[0]
    return Response.json({ id: doc.id, ...doc.data() })
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
