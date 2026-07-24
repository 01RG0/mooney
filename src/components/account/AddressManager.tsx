'use client'
import { useState, useEffect } from 'react'
import type { AddressProfile } from '@/lib/types'
import { MapPicker } from '@/components/map/MapPicker'

const GOVERNORATES = ['Cairo','Giza','Alexandria','Dakahlia','Red Sea','Beheira','Fayoum','Gharbiya','Ismailia','Menofia','Minya','Qaliubiya','New Valley','Suez','Aswan','Assiut','Beni Suef','Port Said','Damietta','Sharkia','South Sinai','Kafr El-Sheikh','Matrouh','Luxor','Qena','North Sinai','Sohag']

const emptyForm = { label: '', fullName: '', phone: '', address: '', governorate: '', city: '', postalCode: '', isDefault: false }
const inputCls = 'w-full rounded-2xl border border-brown-900/15 bg-white/40 px-4 py-3 text-sm text-brown-900 focus:border-rose-400/60 focus:outline-none'
const labelCls = 'mb-1.5 block text-sm font-medium text-brown-900'

export function AddressManager() {
  const [addresses, setAddresses] = useState<AddressProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showMap, setShowMap] = useState(false)

  async function load() {
    const res = await fetch('/api/account/addresses')
    if (res.ok) setAddresses(await res.json())
  }

  useEffect(() => { void load() }, [])

  function startAdd() { setForm(emptyForm); setEditId(null); setShowForm(true); setShowMap(false) }
  function startEdit(a: AddressProfile) {
    setForm({ label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, governorate: a.governorate, city: a.city, postalCode: a.postalCode ?? '', isDefault: a.isDefault })
    setEditId(a.id); setShowForm(true); setShowMap(false)
  }
  function cancel() { setShowForm(false); setEditId(null); setForm(emptyForm); setShowMap(false) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (editId) {
      await fetch(`/api/account/addresses/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/account/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    cancel(); await load()
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this address?')) return
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
    await load()
  }

  async function setDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
    await load()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-brown-900">Saved Addresses</h2>
        {!showForm && (
          <button onClick={startAdd} className="rounded-full bg-rose-400 px-5 py-2 text-sm text-white hover:opacity-90 transition-opacity">
            + Add Address
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 rounded-3xl bg-cream/80 p-6 space-y-4">
          <h3 className="font-display text-lg text-brown-900">{editId ? 'Edit Address' : 'New Address'}</h3>
          {[
            { key: 'label', label: 'Label (e.g. Home, Work)' },
            { key: 'fullName', label: 'Full Name' },
            { key: 'phone', label: 'Phone Number' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input value={(form as Record<string, unknown>)[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} required />
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="text-sm text-rose-400 hover:underline mb-2 flex items-center gap-1"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Find on map
            </button>
          </div>
          {[
            { key: 'address', label: 'Street Address' },
            { key: 'city', label: 'City' },
            { key: 'postalCode', label: 'Postal Code (optional)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input value={(form as Record<string, unknown>)[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} required={key !== 'postalCode'} />
            </div>
          ))}
          <div>
            <label className={labelCls}>Governorate</label>
            <select value={form.governorate} onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))} className={inputCls} required>
              <option value="">Select governorate…</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-brown-700">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="accent-rose-400" />
            Set as default address
          </label>
          <div className="flex gap-3">
            <button type="submit" className="rounded-full bg-rose-400 px-6 py-2.5 text-sm text-white hover:opacity-90">Save</button>
            <button type="button" onClick={cancel} className="text-sm text-brown-700 hover:text-brown-900">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="rounded-3xl bg-white/30 border border-white/40 p-8 text-center text-sm text-brown-700">
          No saved addresses yet. Add one to speed up checkout.
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a.id} className="relative rounded-2xl bg-white/30 border border-white/40 p-4">
            {a.isDefault && (
              <span className="absolute right-4 top-4 rounded-full bg-rose-400 px-2 py-0.5 text-xs text-white">Default</span>
            )}
            <p className="font-display text-base font-semibold text-brown-900">{a.label}</p>
            <p className="text-sm text-brown-800">{a.fullName} · {a.phone}</p>
            <p className="text-sm text-brown-700">{a.address}, {a.city}, {a.governorate}</p>
            <div className="mt-3 flex gap-4">
              <button onClick={() => startEdit(a)} className="text-xs text-rose-400 hover:underline">Edit</button>
              <button onClick={() => remove(a.id)} className="text-xs text-rose-500 hover:underline">Delete</button>
              {!a.isDefault && (
                <button onClick={() => setDefault(a.id)} className="text-xs text-brown-700 hover:text-brown-900 hover:underline">Set default</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showMap && (
        <MapPicker
          onClose={() => setShowMap(false)}
          onConfirm={(r) => {
            setForm((f) => ({
              ...f,
              address: r.address,
              city: r.city,
              governorate: r.governorate,
              postalCode: r.postalCode ?? f.postalCode,
            }))
            setShowMap(false)
          }}
        />
      )}
    </div>
  )
}
