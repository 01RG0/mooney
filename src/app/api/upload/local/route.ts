import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

  return Response.json({ url: `/uploads/${filename}` })
}
