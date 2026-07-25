'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Category { slug: string; name: string; tagline: string; image: string }
const emptyForm = { slug: '', name: '', tagline: '', image: '' }
const inputCls = 'w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-brown-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-rose-400'
const labelCls = 'text-sm text-brown-700 font-sans mb-1 block'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        setForm(f => ({ ...f, image: data.url }))
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch {}
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadCategories() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'name' && !editingSlug) {
      setForm(f => ({
        ...f,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }))
    }
  }

  function startEdit(c: Category) {
    setForm({ slug: c.slug, name: c.name, tagline: c.tagline, image: c.image })
    setEditingSlug(c.slug)
    setShowForm(true)
  }

  function cancelForm() {
    setForm(emptyForm)
    setEditingSlug(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingSlug) {
        await fetch('/api/admin/categories/' + editingSlug, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      cancelForm()
      await loadCategories()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!window.confirm('Delete this category?')) return
    await fetch('/api/admin/categories/' + slug, { method: 'DELETE' })
    await loadCategories()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl text-brown-900">Categories</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-rose-400 text-white rounded-full px-6 py-2 text-sm font-sans hover:opacity-90 transition-opacity"
          >
            + Add Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6 mb-8">
          <h2 className="font-display text-xl text-brown-900 mb-4">
            {editingSlug ? 'Edit Category' : 'New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="slug" value={form.slug} />
            <div>
              <label className={labelCls}>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input name="tagline" value={form.tagline} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category Image</label>
              <div className="flex items-center gap-4">
                {form.image && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/40">
                    <Image src={form.image} alt="Category" width={64} height={64} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-full border border-brown-900/20 bg-white/50 px-4 py-2 text-sm text-brown-900 hover:bg-white/80 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? 'Uploading…' : form.image ? 'Change image' : 'Upload image'}
                  </button>
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))} className="text-xs text-rose-500 hover:underline text-left">
                      Remove
                    </button>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-rose-400 text-white rounded-full px-6 py-2 text-sm font-sans hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Saving…' : editingSlug ? 'Update Category' : 'Save Category'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="text-sm text-brown-700 font-sans hover:text-brown-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(c => (
          <div key={c.slug} className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6 flex gap-4">
            {c.image && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image src={c.image} alt={c.name} width={64} height={64} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
            <p className="font-display text-xl text-brown-900 mb-1">{c.name}</p>
            <p className="text-xs text-brown-700 font-sans uppercase tracking-wide mb-2">{c.slug}</p>
            <p className="text-sm text-brown-800 font-sans mb-4">{c.tagline}</p>
            <div className="flex gap-3">
              <button onClick={() => startEdit(c)} className="text-rose-400 text-xs font-sans hover:underline">Edit</button>
              <button onClick={() => handleDelete(c.slug)} className="text-rose-500 text-xs font-sans hover:underline">Delete</button>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
