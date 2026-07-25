import { notFound } from "next/navigation";
import { StatusSelector } from "./StatusSelector";
import { MarkAsPaidButton } from "./MarkAsPaidButton";
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
}

interface Order {
  id: string;
  email: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  paymentPhone?: string;
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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-brown-900 mb-2">
        Order {order.id}
      </h1>
      <p className="text-brown-700 font-sans text-sm mb-8">
        {new Date(order.createdAt).toLocaleString("en-GB")} ·{" "}
        <span className="capitalize">{order.status}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6">
          <h2 className="font-display text-lg text-brown-900 mb-3">Customer</h2>
          <p className="text-sm font-sans text-brown-800">
            {order.shippingDetails.fullName}
          </p>
          <p className="text-sm font-sans text-brown-700">{order.email}</p>
          <p className="text-sm font-sans text-brown-700 mt-2">
            {order.shippingDetails.address}
          </p>
          <p className="text-sm font-sans text-brown-700">
            {order.shippingDetails.city}, {order.shippingDetails.postalCode}
          </p>
          <p className="text-sm font-sans text-brown-700">
            {order.shippingDetails.country}
          </p>
        </div>
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6">
          <h2 className="font-display text-lg text-brown-900 mb-3">Summary</h2>
          <p className="text-sm font-sans text-brown-700">
            Items: {order.items.length}
          </p>
          <p className="font-display text-2xl text-brown-900 mt-2">
            £{order.total.toFixed(2)}
          </p>
          <StatusSelector orderId={order.id} currentStatus={order.status} />
          {order.status === "pending-manual-confirmation" && (
            <MarkAsPaidButton
              orderId={order.id}
              paymentPhone={order.paymentPhone}
            />
          )}
        </div>
      </div>

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
                  £{(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
