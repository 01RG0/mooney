import Link from "next/link";

export const dynamic = 'force-dynamic';

interface Order {
  id: string;
  email: string;
  total: number;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-sand/60 text-brown-800",
  confirmed: "bg-blush-200 text-brown-800",
  shipped: "bg-coral/60 text-brown-900",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

async function getOrders(): Promise<Order[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(base + "/api/admin/orders", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
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
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-white/20 hover:bg-white/20"
                >
                  <td className="p-4">
                    <Link
                      href={"/admin/orders/" + o.id}
                      className="text-rose-400 hover:underline font-mono"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="p-4 text-brown-900">{o.email}</td>
                  <td className="p-4 text-brown-900">
                    £{o.total.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        "px-3 py-1 rounded-full text-xs capitalize " +
                        (statusColors[o.status] ?? "bg-gray-100 text-gray-600")
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-brown-700">
                    {new Date(o.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
