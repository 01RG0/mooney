'use client'
import { useState } from 'react'

interface Props {
  orderId: string
  currentFee: number
  subtotal: number
}

export function DeliveryFeeEditor({ orderId, currentFee, subtotal }: Props) {
  const [fee, setFee] = useState(currentFee.toString())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const parsedFee = parseFloat(fee) || 0
  const newTotal = subtotal + parsedFee

  async function handleSave() {
    const val = parseFloat(fee)
    if (!Number.isFinite(val) || val < 0) {
      setMsg('Invalid fee')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/orders/' + orderId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryFee: val }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        setMsg('Failed to save')
      }
    } catch {
      setMsg('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-sans text-brown-700 mb-2">Delivery fee (EGP)</p>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="number"
          min="0"
          step="0.01"
          value={fee}
          onChange={e => { setFee(e.target.value); setMsg('') }}
          className="w-28 bg-white/50 border border-white/60 rounded-xl px-3 py-1.5 text-brown-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-rose-400 text-white rounded-full px-4 py-1.5 text-sm font-sans hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Set Fee'}
        </button>
        {msg && <span className="text-sm text-rose-500 font-sans">{msg}</span>}
      </div>
      {fee !== currentFee.toString() && (
        <p className="text-xs font-sans text-brown-600 mt-2">
          New total: EGP {newTotal.toFixed(2)} (subtotal {subtotal.toFixed(2)} + fee {parsedFee.toFixed(2)})
        </p>
      )}
    </div>
  )
}
