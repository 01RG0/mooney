'use client'
import { useState, useEffect } from 'react'

interface Coupon {
  code: string
  description?: string
  discountType: 'percent' | 'fixed' | 'free_shipping'
  discountValue: number
  minOrderValue?: number
  maxUses?: number
  maxUsesPerCustomer?: number
  usedCount: number
  active: boolean
  expiresAt?: string
  appliesToProductIds?: string[]
  appliesToCategoryIds?: string[]
  allowedEmails?: string[]
  freeShipping?: boolean
  createdAt: string
}

const EMPTY_FORM = {
  code: '', description: '', discountType: 'percent' as 'percent' | 'fixed' | 'free_shipping',
  discountValue: '', minOrderValue: '', maxUses: '', maxUsesPerCustomer: '',
  active: true, expiresAt: '', allowedEmails: '', freeShipping: false,
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedUsage, setExpandedUsage] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<Record<string, { userId: string; orderId: string; discountAmount: number; usedAt: string }[]>>({})

  async function loadCoupons() {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadCoupons() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setError('')
    setShowForm(true)
  }

  function openEdit(c: Coupon) {
    setEditing(c.code)
    setForm({
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderValue: c.minOrderValue != null ? String(c.minOrderValue) : '',
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      maxUsesPerCustomer: c.maxUsesPerCustomer != null ? String(c.maxUsesPerCustomer) : '',
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      allowedEmails: (c.allowedEmails ?? []).join(', '),
      freeShipping: c.freeShipping ?? false,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const body = {
      code: form.code.toUpperCase(),
      description: form.description,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue) || 0,
      active: form.active,
      freeShipping: form.freeShipping,
      ...(form.minOrderValue && { minOrderValue: parseFloat(form.minOrderValue) }),
      ...(form.maxUses && { maxUses: parseInt(form.maxUses) }),
      ...(form.maxUsesPerCustomer && { maxUsesPerCustomer: parseInt(form.maxUsesPerCustomer) }),
      ...(form.expiresAt && { expiresAt: new Date(form.expiresAt).toISOString() }),
      allowedEmails: form.allowedEmails ? form.allowedEmails.split(',').map(e => e.trim()).filter(Boolean) : [],
    }
    const url = editing ? `/api/admin/coupons/${editing}` : '/api/admin/coupons'
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
    } else {
      setShowForm(false)
      loadCoupons()
    }
    setSaving(false)
  }

  async function toggleActive(code: string, current: boolean) {
    await fetch(`/api/admin/coupons/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    })
    loadCoupons()
  }

  async function deleteCoupon(code: string) {
    if (!confirm(`Delete coupon ${code}? This cannot be undone.`)) return
    await fetch(`/api/admin/coupons/${code}`, { method: 'DELETE' })
    loadCoupons()
  }

  async function loadUsage(code: string) {
    if (expandedUsage === code) { setExpandedUsage(null); return }
    const res = await fetch(`/api/admin/coupons/${code}`)
    if (res.ok) {
      const d = await res.json()
      setUsageData(prev => ({ ...prev, [code]: d.usage ?? [] }))
    }
    setExpandedUsage(code)
  }

  const inp = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-rose-400'
  const lbl = 'block text-xs font-medium text-gray-700 mb-1'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brown-900">Coupons</h1>
        <button onClick={openCreate} className="rounded-xl bg-rose-400 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">
          + New Coupon
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
            <div className="space-y-3">
              {!editing && (
                <div>
                  <label className={lbl}>Code *</label>
                  <input className={inp} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" />
                </div>
              )}
              <div>
                <label className={lbl}>Description (admin note)</label>
                <input className={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Summer campaign 2025" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Discount Type *</label>
                  <select className={inp} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value as typeof form.discountType }))}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (EGP)</option>
                    <option value="free_shipping">Free Shipping Only</option>
                  </select>
                </div>
                {(form.discountType === 'percent' || form.discountType === 'fixed') && (
                  <div>
                    <label className={lbl}>Discount Value *</label>
                    <input className={inp} type="number" min="0" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === 'percent' ? '20' : '50'} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Min Order (EGP)</label>
                  <input className={inp} type="number" min="0" value={form.minOrderValue} onChange={e => setForm(p => ({ ...p, minOrderValue: e.target.value }))} placeholder="Leave empty for none" />
                </div>
                <div>
                  <label className={lbl}>Expires At</label>
                  <input className={inp} type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Max Total Uses</label>
                  <input className={inp} type="number" min="1" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" />
                </div>
                <div>
                  <label className={lbl}>Max Uses Per Customer</label>
                  <input className={inp} type="number" min="1" value={form.maxUsesPerCustomer} onChange={e => setForm(p => ({ ...p, maxUsesPerCustomer: e.target.value }))} placeholder="Unlimited" />
                </div>
              </div>
              <div>
                <label className={lbl}>Allowed Emails (comma separated, leave empty for all)</label>
                <input className={inp} value={form.allowedEmails} onChange={e => setForm(p => ({ ...p, allowedEmails: e.target.value }))} placeholder="user@example.com, other@example.com" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.freeShipping} onChange={e => setForm(p => ({ ...p, freeShipping: e.target.checked }))} />
                  Also free shipping
                </label>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-rose-400 px-4 py-2 text-sm text-white hover:bg-rose-500 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/40" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl bg-white/40 p-8 text-center text-sm text-gray-500">No coupons yet. Create one to get started.</div>
      ) : (
        <div className="rounded-2xl bg-white shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Used</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(c => (
                <>
                  <tr key={c.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-brown-900">
                      {c.code}
                      {c.description && <span className="block text-xs font-normal text-gray-400">{c.description}</span>}
                    </td>
                    <td className="px-4 py-3 capitalize">{c.discountType.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      {c.discountType === 'percent' ? `${c.discountValue}%` :
                       c.discountType === 'fixed' ? `${c.discountValue} EGP` : '—'}
                      {c.freeShipping && c.discountType !== 'free_shipping' && <span className="ml-1 text-xs text-blue-500">+ free ship</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => loadUsage(c.code)} className="text-rose-400 hover:underline">
                        {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-EG') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c.code, c.active)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-xs text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => deleteCoupon(c.code)} className="text-xs text-rose-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                  {expandedUsage === c.code && (
                    <tr key={`${c.code}-usage`}>
                      <td colSpan={7} className="bg-gray-50 px-6 py-3">
                        {(usageData[c.code] ?? []).length === 0 ? (
                          <p className="text-xs text-gray-400">No usage yet.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead><tr className="text-gray-400"><th className="text-left pb-1">User ID</th><th className="text-left pb-1">Order</th><th className="text-left pb-1">Discount</th><th className="text-left pb-1">Date</th></tr></thead>
                            <tbody>
                              {usageData[c.code].map((u, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                  <td className="py-1 font-mono text-gray-600">{u.userId.slice(0, 12)}…</td>
                                  <td className="py-1">{u.orderId}</td>
                                  <td className="py-1">{u.discountAmount} EGP</td>
                                  <td className="py-1">{new Date(u.usedAt).toLocaleDateString('en-EG')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
