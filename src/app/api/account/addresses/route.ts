import type { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import type { AddressProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await getAdminDb().collection('users').doc(user.uid).get()
  const data = doc.data() ?? {}
  return Response.json((data.addressProfiles as AddressProfile[]) ?? [])
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const newProfile: AddressProfile = { ...body, id: crypto.randomUUID() }

  const docRef = getAdminDb().collection('users').doc(user.uid)
  const doc = await docRef.get()
  const profiles: AddressProfile[] = (doc.data()?.addressProfiles as AddressProfile[]) ?? []

  let updated = [...profiles]
  if (newProfile.isDefault) {
    updated = updated.map((p) => ({ ...p, isDefault: false }))
  }
  updated.push(newProfile)
  await docRef.update({ addressProfiles: updated })
  return Response.json(newProfile, { status: 201 })
}
