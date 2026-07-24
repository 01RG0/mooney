export async function uploadImage(file: File, folder: string): Promise<string> {
  let authData: Record<string, string> & { error?: string }
  try {
    const authRes = await fetch('/api/imagekit/auth')
    authData = await authRes.json()
  } catch {
    authData = { error: 'imagekit_not_configured' }
  }

  if (authData.error === 'imagekit_not_configured') {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/local', { method: 'POST', body: fd })
    const data = await res.json()
    return data.url as string
  }

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
  const data = await res.json()
  return data.url as string
}
