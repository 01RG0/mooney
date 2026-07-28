import { notFound } from "next/navigation";
import { StatusSelector } from "./StatusSelector";
import { MarkAsPaidButton } from "./MarkAsPaidButton";
import { DeliveryFeeEditor } from "./DeliveryFeeEditor";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  color?: string;
}

interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone?: string;
  governorate?: string;
  coordinates?: { lat: number; lng: number };
  deliveryFee?: number;
  deliveryFeeConfirmed?: boolean;
}

interface Order {
  id: string;
  email: string;
  total: number;
  subtotal?: number;
  deliveryCost?: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  paymentPhone?: string;
  paymentMethod?: string;
}

async function getOrder(id: string): Promise<Order | null> {
  try {
    await requireAdmin();
    const doc = await getAdminDb().collection('orders').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Order;
  } catch {
    return null;
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  'pending-payment': 'Pending Payment',
  'pending-manual-confirmation': 'Awaiting Payment Confirm',
  confirmed: 'Confirmed',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  paymob: 'Paymob',
  'orange-cash': 'Orange Cash',
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const sd = order.shippingDetails;
  const subtotal =
    typeof order.subtotal === 'number'
      ? order.subtotal
      : order.items.reduce((s, it) => s + (it.price ?? 0) * (it.quantity ?? 1), 0);
  const deliveryFee =
    typeof order.deliveryCost === 'number'
      ? order.deliveryCost
      : (sd.deliveryFee ?? 0);

  const mapsUrl = sd.coordinates
    ? `https://www.google.com/maps?q=${sd.coordinates.lat},${sd.coordinates.lng}`
    : null;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-brown-900 mb-2">
        Order <span className="font-mono text-2xl">{order.id}</span>
      </h1>
      <p className="text-brown-700 font-sans text-sm mb-8">
        {new Date(order.createdAt).toLocaleString("en-GB")} ·{" "}
        <span className="font-medium">{STATUS_LABELS[order.status] ?? order.status}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer & Location */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6">
          <h2 className="font-display text-lg text-brown-900 mb-3">Customer</h2>
          <p className="text-sm font-sans text-brown-900 font-medium">{sd.fullName}</p>
          <p className="text-sm font-sans text-brown-700">{order.email}</p>
          {sd.phone && (
            <p className="text-sm font-sans text-brown-700 mt-1">{sd.phone}</p>
          )}
          <div className="mt-3 space-y-0.5">
            <p className="text-sm font-sans text-brown-700">{sd.address}</p>
            {sd.governorate && (
              <p className="text-sm font-sans text-brown-700">{sd.governorate}</p>
            )}
            <p className="text-sm font-sans text-brown-700">
              {sd.city}{sd.postalCode ? `, ${sd.postalCode}` : ''}, {sd.country}
            </p>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-rose-400 hover:underline font-sans"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Open in Google Maps
            </a>
          )}
        </div>

        {/* Summary & Controls */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6">
          <h2 className="font-display text-lg text-brown-900 mb-3">Summary</h2>

          {order.paymentMethod && (
            <p className="text-sm font-sans text-brown-700 mb-1">
              Payment:{" "}
              <span className="font-medium text-brown-900">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </p>
          )}
          {order.paymentPhone && (
            <p className="text-sm font-sans text-brown-700 mb-3">
              Payment phone: <span className="font-medium text-brown-900">{order.paymentPhone}</span>
            </p>
          )}

          <div className="space-y-1 text-sm font-sans text-brown-700">
            <div className="flex justify-between">
              <span>Subtotal ({order.items.length} item{order.items.length !== 1 ? 's' : ''})</span>
              <span className="text-brown-900">EGP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-brown-900">EGP {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-display text-base text-brown-900 pt-1 border-t border-white/40">
              <span>Total</span>
              <span>EGP {(order.total ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <StatusSelector orderId={order.id} currentStatus={order.status} />

          {order.status === "pending-manual-confirmation" && (
            <MarkAsPaidButton
              orderId={order.id}
              paymentPhone={order.paymentPhone}
            />
          )}
        </div>
      </div>

      {/* Delivery fee editor */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6 mb-6">
        <h2 className="font-display text-lg text-brown-900 mb-1">Delivery Fee</h2>
        <p className="text-xs font-sans text-brown-600 mb-2">
          {sd.deliveryFeeConfirmed ? 'Fee confirmed.' : 'Fee not yet confirmed — set it below.'}
        </p>
        <DeliveryFeeEditor
          orderId={order.id}
          currentFee={deliveryFee}
          subtotal={subtotal}
        />
      </div>

      {/* Items table */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="border-b border-white/40">
            <tr className="text-left text-brown-700">
              <th className="p-4">Item</th>
              <th className="p-4">Color</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-white/20">
                <td className="p-4 text-brown-900">{item.name}</td>
                <td className="p-4 text-brown-700">{item.color ?? "—"}</td>
                <td className="p-4 text-brown-700">{item.quantity}</td>
                <td className="p-4 text-brown-900">
                  EGP {((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
