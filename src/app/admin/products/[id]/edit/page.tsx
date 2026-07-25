'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { uploadImage } from '@/lib/imagekit'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])
  const [form, setForm] = useState({ name: '', slug: '', category: '', price: '', image: '', description: '', details: '', maker: '', isNew: false, stock: '0' })
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [viewerEnabled, setViewerEnabled] = useState(false)
  const [viewerMin, setViewerMin] = useState(8)
  const [viewerMax, setViewerMax] = useState(24)
  const imgRef = useRef<HTMLInputElement>(null)

  const [hasColors, setHasColors] = useState(false)
  const [colorVariants, setColorVariants] = useState<{ id: string; name: string; hex: string; images: string[] }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).catch(() => []),
      fetch('/api/admin/products').then(r => r.json()),
    ]).then(([cats, products]: [{ slug: string; name: string }[], { id: string; name?: string; slug?: string; category?: string; price?: number; image?: string; description?: string; details?: string[]; maker?: string; isNew?: boolean; stock?: number; images?: string[]; mainImageIndex?: number; viewerCount?: { min: number; max: number; enabled: boolean }; hasColors?: boolean; colorVariants?: { id: string; name: string; hex: string; images: string[]; stock?: number }[] }[]]) => {
      setCategories(cats)
      const p = products.find(p => p.id === id)
        if (p) {
          setForm({
            name: p.name ?? '',
            slug: p.slug ?? '',
            category: p.category ?? (cats.length > 0 ? cats[0].slug : ''),
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
          setHasColors(p.hasColors ?? false)
          setColorVariants(
            (p.colorVariants ?? []).map((v) => ({
              id: v.id,
              name: v.name,
              hex: v.hex,
              images: v.images,
            }))
          )
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
    if (name === 'name') {
      setForm(f => ({
        ...f,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }))
    }
  }

  function addVariant() {
    setColorVariants((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', hex: '#000000', images: [] },
    ])
  }

  function removeVariant(variantId: string) {
    setColorVariants((prev) => prev.filter((v) => v.id !== variantId))
  }

  function updateVariantField(variantId: string, field: 'name' | 'hex', value: string) {
    setColorVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
    )
  }

  function addVariantImage(variantId: string, url: string) {
    setColorVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, images: [...v.images, url] } : v))
    )
  }

  function removeVariantImage(variantId: string, imgIndex: number) {
    setColorVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, images: v.images.filter((_, i) => i !== imgIndex) }
          : v
      )
    )
  }

  const colorVariantsValid =
    !hasColors ||
    (colorVariants.length >= 2 &&
      colorVariants.every((v) => v.name.trim() && v.images.length > 0))

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
          hasColors,
          colorVariants,
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
        <input type="hidden" name="slug" value={form.slug} />
        <div>
          <label className={labelCls}>Category</label>
          <select name='category' value={form.category} onChange={handleChange} className={inputCls}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div><label className={labelCls}>Price (EGP)</label><input name='price' type='number' step='0.01' value={form.price} onChange={handleChange} required className={inputCls} /></div>
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

        {/* Color variant toggle */}
        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            id='hasColors'
            checked={hasColors}
            onChange={(e) => setHasColors(e.target.checked)}
            className='accent-rose-400'
          />
          <label htmlFor='hasColors' className='text-sm text-brown-700 font-sans cursor-pointer'>
            This product has multiple color variants
          </label>
        </div>

        {/* Color variant editor */}
        {hasColors && (
          <div className='flex flex-col gap-3'>
            {colorVariants.map((variant) => (
              <div
                key={variant.id}
                className='backdrop-blur-xl bg-white/20 border border-white/40 rounded-2xl p-4 flex flex-col gap-3'
              >
                <div className='flex items-center gap-3'>
                  <input
                    type='text'
                    value={variant.name}
                    onChange={(e) => updateVariantField(variant.id, 'name', e.target.value)}
                    placeholder='Color name (e.g. Natural)'
                    className={inputCls}
                  />
                  <input
                    type='color'
                    value={variant.hex}
                    onChange={(e) => updateVariantField(variant.id, 'hex', e.target.value)}
                    className='h-9 w-14 rounded-lg cursor-pointer border border-white/60 bg-transparent'
                  />
                  <button
                    type='button'
                    onClick={() => removeVariant(variant.id)}
                    className='text-rose-500 text-sm underline whitespace-nowrap font-sans hover:text-rose-700'
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Images for {variant.name || 'this color'}</label>
                  <label className='rounded-full bg-rose-400 px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity cursor-pointer inline-block'>
                    Upload Image
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const url = await uploadImage(f, 'products')
                        addVariantImage(variant.id, url)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {variant.images.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {variant.images.map((url, i) => (
                        <div key={i} className='relative h-12 w-12'>
                          <img src={url} alt='' className='h-full w-full rounded-xl object-cover' />
                          <button
                            type='button'
                            onClick={() => removeVariantImage(variant.id, i)}
                            className='absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-black/40 px-1 text-xs text-white hover:bg-rose-500'
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button
              type='button'
              onClick={addVariant}
              className='self-start rounded-full bg-rose-400 px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity'
            >
              + Add color
            </button>
            {hasColors && colorVariants.length < 2 && (
              <p className='text-sm text-rose-500 font-sans'>Add at least 2 color variants</p>
            )}
            {colorVariants.filter((v) => !v.name.trim()).map((v) => (
              <p key={v.id + '-name'} className='text-sm text-rose-500 font-sans'>Each color needs a name</p>
            ))}
            {colorVariants.filter((v) => v.name.trim() && v.images.length === 0).map((v) => (
              <p key={v.id + '-img'} className='text-sm text-rose-500 font-sans'>{v.name} needs at least one image</p>
            ))}
          </div>
        )}

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
        <button
          type='submit'
          disabled={saving || !colorVariantsValid}
          className='bg-rose-400 text-white rounded-full px-8 py-3 font-sans text-sm hover:opacity-90 transition-opacity disabled:opacity-50 self-start'
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
      <button type='button' onClick={handleDelete} className='mt-4 text-rose-500 text-sm underline cursor-pointer hover:text-rose-700 font-sans'>
        Delete Product
      </button>
    </div>
  )
}
