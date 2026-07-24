'use client'
import { useState } from 'react'

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export function StatusSelector({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [selected, setSelected] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleUpdate() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/orders/' + orderId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      })
      setMsg(res.ok ? 'Status updated' : 'Failed to update')
    } catch {
      setMsg('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3 flex-wrap">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="bg-white/50 border border-white/60 rounded-xl px-3 py-1.5 text-brown-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 capitalize"
      >
        {VALID_STATUSES.map(s => (
          <option key={s} value={s} className="capitalize">{s}</option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={saving}
        className="bg-rose-400 text-white rounded-full px-4 py-1.5 text-sm font-sans hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Saving…' : 'Update'}
      </button>
      {msg && (
        <span className={msg === 'Status updated' ? 'text-sm text-green-700 font-sans' : 'text-sm text-rose-500 font-sans'}>
          {msg}
        </span>
      )}
    </div>
  )
}
