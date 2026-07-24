import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await getAdminDb().collection('users').doc(user.uid).get()
  return Response.json(snap.exists ? snap.data() : {})
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, username, phone, firstName, lastName, avatarUrl } = body

  const update: Record<string, string> = { updatedAt: new Date().toISOString() }
  if (name      !== undefined) update.name      = name
  if (username  !== undefined) update.username  = username
  if (phone     !== undefined) update.phone     = phone
  if (firstName !== undefined) update.firstName = firstName
  if (lastName  !== undefined) update.lastName  = lastName
  if (avatarUrl !== undefined) update.avatarUrl = avatarUrl

  await getAdminDb().collection('users').doc(user.uid).set(update, { merge: true })
  return Response.json({ success: true })
}
