export async function uploadImage(file: File, folder: string): Promise<string | null> {
  try {
    const authRes = await fetch('/api/imagekit/auth')
    const authData = await authRes.json() as Record<string, string> & { error?: string }

    if (authData.error) return null

    const fd = new FormData()
    fd.append('file', file)
    fd.append('fileName', file.name)
    fd.append('folder', folder)
    fd.append('token', authData.token)
    fd.append('expire', String(authData.expire))
    fd.append('signature', authData.signature)
    fd.append('publicKey', authData.publicKey)

    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: fd,
    })
    const data = await res.json() as { url?: string }
    return data.url ?? null
  } catch {
    return null
  }
}
