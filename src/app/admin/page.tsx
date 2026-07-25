import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireAdmin();
  const db = getAdminDb();
  const [productsSnap, ordersSnap] = await Promise.all([
    db.collection('products').get(),
    db.collection('orders').get(),
  ]);
  const orders = ordersSnap.docs.map(d => d.data() as { total: number });
  const revenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  const stats = [
    { label: 'Total Orders', value: orders.length > 0 ? String(orders.length) : '—' },
    { label: 'Revenue',      value: orders.length > 0 ? '£' + revenue.toFixed(2) : '—' },
    { label: 'Products',     value: productsSnap.size > 0 ? String(productsSnap.size) : '—' },
    { label: 'Categories',   value: '4' },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-brown-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6"
          >
            <p className="text-sm text-brown-700 font-sans mb-1">{s.label}</p>
            <p className="font-display text-3xl text-brown-900">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <Link
          href="/admin/products/new"
          className="bg-rose-400 text-white rounded-full px-6 py-2 text-sm font-sans hover:opacity-90 transition-opacity"
        >
          + Add Product
        </Link>
        <Link
          href="/admin/orders"
          className="border border-brown-700 text-brown-900 rounded-full px-6 py-2 text-sm font-sans hover:bg-brown-700/10 transition-colors"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}
