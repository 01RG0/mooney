import crypto from 'crypto'
export const dynamic = 'force-dynamic'

export async function GET() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!privateKey || !publicKey || !urlEndpoint) {
    return Response.json({ error: 'imagekit_not_configured' })
  }

  const token = crypto.randomUUID()
  const expire = Math.floor(Date.now() / 1000) + 2400
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex')

  return Response.json({ token, expire, signature, publicKey })
}
