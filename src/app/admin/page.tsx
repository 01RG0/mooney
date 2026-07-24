import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const [productsRes, ordersRes] = await Promise.all([
    fetch(base + '/api/admin/products', { cache: 'no-store' }),
    fetch(base + '/api/admin/orders', { cache: 'no-store' }),
  ]);
  const products: Array<unknown> = productsRes.ok ? await productsRes.json() : [];
  const orders: Array<{ total: number }> = ordersRes.ok ? await ordersRes.json() : [];
  const revenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  const stats = [
    { label: 'Total Orders', value: orders.length > 0 ? String(orders.length) : '—' },
    { label: 'Revenue',      value: orders.length > 0 ? '£' + revenue.toFixed(2) : '—' },
    { label: 'Products',     value: products.length > 0 ? String(products.length) : '—' },
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
