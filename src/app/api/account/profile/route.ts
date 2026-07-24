import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, username } = await request.json()
  await getAdminDb().collection('users').doc(user.uid).update({ name, username })
  return Response.json({ success: true })
}
