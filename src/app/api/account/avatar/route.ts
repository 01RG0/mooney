import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/session'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const FREEIMAGE_KEY = '6d207e02198a847aa98d0a2a901485a5'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  try {
    const uploadForm = new FormData()
    uploadForm.append('key', FREEIMAGE_KEY)
    uploadForm.append('action', 'upload')
    uploadForm.append('source', file)
    uploadForm.append('format', 'json')

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: uploadForm,
    })

    const data = await res.json() as {
      status_code: number
      image?: { url: string }
      error?: { message: string }
    }

    if (data.status_code !== 200 || !data.image?.url) {
      throw new Error(data.error?.message ?? 'Upload failed')
    }

    const url = data.image.url

    await getAdminDb().collection('users').doc(user.uid).set(
      { avatarUrl: url, updatedAt: new Date().toISOString() },
      { merge: true },
    )
    return Response.json({ url })
  } catch (e) {
    console.error('avatar upload error', e)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
