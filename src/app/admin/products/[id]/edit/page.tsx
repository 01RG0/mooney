'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { uploadImage } from '@/lib/imagekit'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', slug: '', category: 'baskets', price: '', image: '', description: '', details: '', maker: '', isNew: false, stock: '0' })
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [viewerEnabled, setViewerEnabled] = useState(false)
  const [viewerMin, setViewerMin] = useState(8)
  const [viewerMax, setViewerMax] = useState(24)
  const imgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then((products: { id: string; name?: string; slug?: string; category?: string; price?: number; image?: string; description?: string; details?: string[]; maker?: string; isNew?: boolean; stock?: number; images?: string[]; mainImageIndex?: number; viewerCount?: { min: number; max: number; enabled: boolean } }[]) => {
        const p = products.find(p => p.id === id)
        if (p) {
          setForm({
            name: p.name ?? '',
            slug: p.slug ?? '',
            category: p.category ?? 'baskets',
            price: String(p.price ?? ''),
            image: p.image ?? '',
            description: p.description ?? '',
            details: Array.isArray(p.details) ? p.details.join('\n') : '',
            maker: p.maker ?? '',
            isNew: p.isNew ?? false,
            stock: String(p.stock ?? 0),
          })
          setImages(p.images ?? [])
          setMainImageIndex(p.mainImageIndex ?? 0)
          if (p.viewerCount) {
            setViewerEnabled(p.viewerCount.enabled)
            setViewerMin(p.viewerCount.min)
            setViewerMax(p.viewerCount.max)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          details: form.details.split('\n').filter(Boolean),
          images,
          mainImageIndex,
          viewerCount: { enabled: viewerEnabled, min: viewerMin, max: viewerMax },
        }),
      })
      if (res.ok) router.push('/admin/products')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this product?')) return
    await fetch('/api/admin/products/' + id, { method: 'DELETE' })
    router.push('/admin/products')
  }

  const inputCls = 'w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-brown-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-rose-400'
  const labelCls = 'text-sm text-brown-700 font-sans mb-1 block'

  if (loading) return <div className='animate-pulse h-96 rounded-3xl bg-white/30' />

  return (
    <div className='max-w-2xl'>
      <h1 className='font-display text-4xl text-brown-900 mb-8'>Edit Product</h1>
      <form onSubmit={handleSubmit} className='backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-8 flex flex-col gap-5'>
        <div><label className={labelCls}>Name</label><input name='name' value={form.name} onChange={handleChange} required className={inputCls} /></div>
        <div><label className={labelCls}>Slug</label><input name='slug' value={form.slug} onChange={handleChange} required className={inputCls} /></div>
        <div>
          <label className={labelCls}>Category</label>
          <select name='category' value={form.category} onChange={handleChange} className={inputCls}>
            <option value='baskets'>Baskets</option>
            <option value='florals'>Florals</option>
            <option value='stone-art'>Stone Art</option>
            <option value='home-decor'>Home Decor</option>
          </select>
        </div>
        <div><label className={labelCls}>Price (£)</label><input name='price' type='number' step='0.01' value={form.price} onChange={handleChange} required className={inputCls} /></div>
        <div><label className={labelCls}>Image path</label><input name='image' value={form.image} onChange={handleChange} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Product Images</label>
          <button
            type="button"
            onClick={() => imgRef.current?.click()}
            className="rounded-full bg-rose-400 px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
          >
            Upload Image
          </button>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const url = await uploadImage(f, 'products')
              setImages((prev) => [...prev, url])
              e.target.value = ''
            }}
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative h-16 w-16">
                  <img src={url} alt="" className="h-full w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setMainImageIndex(i)}
                    title="Set as main"
                    className={`absolute bottom-0 left-0 rounded-br-xl rounded-tl-xl px-1 text-xs ${
                      i === mainImageIndex
                        ? 'bg-rose-400 text-white'
                        : 'bg-black/30 text-white hover:bg-rose-400'
                    }`}
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImages((prev) => prev.filter((_, j) => j !== i))
                      if (mainImageIndex >= i && mainImageIndex > 0) setMainImageIndex((p) => p - 1)
                    }}
                    className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-black/40 px-1 text-xs text-white hover:bg-rose-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-brown-700 font-sans">
            <input
              type="checkbox"
              checked={viewerEnabled}
              onChange={(e) => setViewerEnabled(e.target.checked)}
              className="accent-rose-400"
            />
            Enable viewer counter
          </label>
          {viewerEnabled && (
            <div className="mt-2 flex gap-4">
              <div>
                <label className={labelCls}>Min viewers</label>
                <input
                  type="number"
                  value={viewerMin}
                  onChange={(e) => setViewerMin(Number(e.target.value))}
                  className={inputCls}
                  min={1}
                />
              </div>
              <div>
                <label className={labelCls}>Max viewers</label>
                <input
                  type="number"
                  value={viewerMax}
                  onChange={(e) => setViewerMax(Number(e.target.value))}
                  className={inputCls}
                  min={1}
                />
              </div>
            </div>
          )}
        </div>
        <div><label className={labelCls}>Description</label><textarea name='description' value={form.description} onChange={handleChange} rows={3} className={inputCls} /></div>
        <div><label className={labelCls}>Details (one per line)</label><textarea name='details' value={form.details} onChange={handleChange} rows={4} className={inputCls} /></div>
        <div><label className={labelCls}>Maker</label><input name='maker' value={form.maker} onChange={handleChange} className={inputCls} /></div>
        <div><label className={labelCls}>Stock</label><input name='stock' type='number' value={form.stock} onChange={handleChange} className={inputCls} /></div>
        <div className='flex items-center gap-2'>
          <input name='isNew' type='checkbox' checked={form.isNew} onChange={handleChange} className='accent-rose-400' />
          <span className='text-sm text-brown-700 font-sans'>Mark as New Arrival</span>
        </div>
        <button type='submit' disabled={saving} className='bg-rose-400 text-white rounded-full px-8 py-3 font-sans text-sm hover:opacity-90 transition-opacity disabled:opacity-50 self-start'>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
      <button type='button' onClick={handleDelete} className='mt-4 text-rose-500 text-sm underline cursor-pointer hover:text-rose-700 font-sans'>
        Delete Product
      </button>
    </div>
  )
}
