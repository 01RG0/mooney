'use client'

export function MarkAsPaidButton({
  orderId,
  paymentPhone,
}: {
  orderId: string
  paymentPhone?: string
}) {
  return (
    <div className="mt-4 rounded-2xl bg-orange-50/80 border border-orange-200 p-4">
      <p className="text-sm font-medium text-brown-900 mb-1">Orange Cash — Pending Confirmation</p>
      {paymentPhone && (
        <p className="text-sm text-brown-700">
          Customer paid from: <span className="font-medium">{paymentPhone}</span>
        </p>
      )}
      <button
        onClick={async () => {
          await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' }),
          })
          window.location.reload()
        }}
        className="mt-3 rounded-full bg-rose-400 px-5 py-2 text-sm text-white hover:opacity-90 transition-opacity"
      >
        Mark as Paid
      </button>
    </div>
  )
}
