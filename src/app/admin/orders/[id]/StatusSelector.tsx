'use client'
import { useState } from 'react'

const STATUSES: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'pending-payment', label: 'Pending Payment' },
  { value: 'pending-manual-confirmation', label: 'Awaiting Payment Confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

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
      if (res.ok) {
        window.location.reload()
      } else {
        setMsg('Failed to update')
      }
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
        className="bg-white/50 border border-white/60 rounded-xl px-3 py-1.5 text-brown-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={saving || selected === currentStatus}
        className="bg-rose-400 text-white rounded-full px-4 py-1.5 text-sm font-sans hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Saving…' : 'Update Status'}
      </button>
      {msg && (
        <span className="text-sm text-rose-500 font-sans">{msg}</span>
      )}
    </div>
  )
}
