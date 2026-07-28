import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface Order {
  id: string;
  email: string;
  total: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  deliveryCost?: number;
  shippingDetails?: { deliveryFee?: number };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  'pending-payment': 'Pending Payment',
  'pending-manual-confirmation': 'Awaiting Confirm',
  confirmed: 'Confirmed',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-sand/60 text-brown-800',
  'pending-payment': 'bg-yellow-100 text-yellow-800',
  'pending-manual-confirmation': 'bg-orange-100 text-orange-800',
  confirmed: 'bg-blush-200 text-brown-800',
  shipped: 'bg-coral/60 text-brown-900',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-600',
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'COD',
  paymob: 'Paymob',
  'orange-cash': 'Orange Cash',
}

async function getOrders(): Promise<Order[]> {
  try {
    await requireAdmin();
    const snap = await getAdminDb().collection('orders').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
  } catch {
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();
  return (
    <div>
      <h1 className="font-display text-4xl text-brown-900 mb-8">Orders</h1>
      {orders.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-12 text-center text-brown-700">
          No orders yet.
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead className="border-b border-white/40">
              <tr className="text-left text-brown-700">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total</th>
                <th className="p-4">Delivery</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const fee = typeof o.deliveryCost === 'number'
                  ? o.deliveryCost
                  : (o.shippingDetails?.deliveryFee ?? null)
                return (
                  <tr
                    key={o.id}
                    className="border-b border-white/20 hover:bg-white/20"
                  >
                    <td className="p-4">
                      <span className="text-brown-700 font-mono text-xs">{o.id.slice(0, 8)}…</span>
                    </td>
                    <td className="p-4 text-brown-900">{o.email}</td>
                    <td className="p-4 text-brown-700">
                      {o.paymentMethod ? (PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod) : '—'}
                    </td>
                    <td className="p-4 text-brown-900">
                      EGP {(o.total ?? 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-brown-700">
                      {fee !== null ? `EGP ${fee.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={
                          "px-3 py-1 rounded-full text-xs " +
                          (STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600")
                        }
                      >
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="p-4 text-brown-700">
                      {new Date(o.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4">
                      <Link
                        href={"/admin/orders/" + o.id}
                        className="text-rose-400 hover:underline font-sans text-xs font-medium"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
