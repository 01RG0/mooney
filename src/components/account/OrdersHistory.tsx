'use client'
import { useState, useEffect } from 'react'

interface OrderItem {
  name: string
  quantity: number
  price: number
  color?: string
}

interface Order {
  id: string
  createdAt: string
  status: string
  total: number
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  'pending-manual-confirmation': 'bg-orange-100 text-orange-700',
  confirmed: 'bg-rose-100 text-rose-600',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  'pending-manual-confirmation': 'Awaiting Payment',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000

function canCancel(order: Order): boolean {
  if (['cancelled', 'shipped', 'delivered'].includes(order.status)) return false
  return Date.now() - new Date(order.createdAt).getTime() < CANCEL_WINDOW_MS
}

function CancelButton({ order, onCancelled }: { order: Order; onCancelled: () => void }) {
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - new Date(order.createdAt).getTime()
      const remaining = CANCEL_WINDOW_MS - elapsed
      if (remaining <= 0) { setTimeLeft(''); return }
      const m = Math.floor(remaining / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${m}m ${s}s left`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [order.createdAt])

  if (!timeLeft) return null

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    setError('')
    try {
      const res = await fetch(`/api/account/orders/${order.id}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Could not cancel order')
        return
      }
      onCancelled()
    } catch {
      setError('Something went wrong')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel Order'}
        </button>
        <span className="text-xs text-brown-600">{timeLeft} to cancel</span>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

export function OrdersHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  function loadOrders() {
    setLoading(true)
    fetch('/api/account/orders')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setOrders)
      .catch(() => setError('Could not load orders. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/30" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300/40 bg-rose-50/60 px-5 py-4 text-sm text-rose-600">
        {error}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-white/40 bg-white/30 p-8 text-center">
        <p className="text-sm text-brown-700">You haven't placed any orders yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded((v) => (v === order.id ? null : order.id))}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <p className="font-medium text-sm text-brown-900">{order.id}</p>
              <p className="text-xs text-brown-700 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <span className="text-sm font-semibold text-brown-900">
                EGP {(order.total ?? 0).toFixed(2)}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 text-brown-700 transition-transform duration-200 ${expanded === order.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>

          {expanded === order.id && (
            <div className="border-t border-brown-900/8 px-5 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-brown-700">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium text-center">Qty</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-900/6">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 text-brown-900">
                        {item.name}
                        {item.color && <span className="ml-1 text-xs text-brown-600">· {item.color}</span>}
                      </td>
                      <td className="py-2 text-center text-brown-700">{item.quantity}</td>
                      <td className="py-2 text-right text-brown-900">EGP {(item.price ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="pt-3 text-right text-xs font-medium text-brown-700">Total</td>
                    <td className="pt-3 text-right font-semibold text-brown-900">EGP {(order.total ?? 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              {canCancel(order) && (
                <CancelButton
                  order={order}
                  onCancelled={() => {
                    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: 'cancelled' } : o))
                  }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
