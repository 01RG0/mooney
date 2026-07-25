import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
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
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
    if (!privateKey || !publicKey) throw new Error('not configured')

    const token = crypto.randomUUID()
    const expire = Math.floor(Date.now() / 1000) + 2400
    const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('fileName', file.name)
    fd.append('folder', 'avatars')
    fd.append('token', token)
    fd.append('expire', String(expire))
    fd.append('signature', signature)
    fd.append('publicKey', publicKey)
    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: fd })
    const ikData = await ikRes.json()
    url = ikData.url
  } catch {
    // Fallback: local
    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))
    url = `/uploads/${filename}`
  }

  await getAdminDb().collection('users').doc(user.uid).set(
    { avatarUrl: url, updatedAt: new Date().toISOString() },
    { merge: true },
  )
  return Response.json({ url })
}
