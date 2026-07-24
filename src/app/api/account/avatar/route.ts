import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  let url: string

  // Try ImageKit first
  try {
    const authRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/imagekit/auth`)
    const authData = await authRes.json()

    if (!authData.error) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('fileName', file.name)
      fd.append('folder', 'avatars')
      fd.append('token', authData.token)
      fd.append('expire', String(authData.expire))
      fd.append('signature', authData.signature)
      fd.append('publicKey', authData.publicKey)
      const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: fd })
      const ikData = await ikRes.json()
      url = ikData.url
    } else {
      throw new Error('not configured')
    }
  } catch {
    // Fallback: local
    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))
    url = `/uploads/${filename}`
  }

  await getAdminDb().collection('users').doc(user.uid).update({ avatarUrl: url })
  return Response.json({ url })
}
