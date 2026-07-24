import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import type { AddressProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const docRef = getAdminDb().collection('users').doc(user.uid)
  const doc = await docRef.get()
  let profiles: AddressProfile[] = (doc.data()?.addressProfiles as AddressProfile[]) ?? []

  if (body.isDefault) {
    profiles = profiles.map((p) => ({ ...p, isDefault: false }))
  }
  profiles = profiles.map((p) => (p.id === id ? { ...p, ...body, id } : p))
  await docRef.update({ addressProfiles: profiles })
  return Response.json({ success: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const docRef = getAdminDb().collection('users').doc(user.uid)
  const doc = await docRef.get()
  const profiles: AddressProfile[] = (doc.data()?.addressProfiles as AddressProfile[]) ?? []
  await docRef.update({ addressProfiles: profiles.filter((p) => p.id !== id) })
  return Response.json({ success: true })
}
