import Link from "next/link";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock?: number;
  slug: string;
}

async function getProducts(): Promise<Product[]> {
  try {
    await requireAdmin();
    const snap = await getAdminDb().collection('products').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl text-brown-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-rose-400 text-white rounded-full px-6 py-2 text-sm font-sans hover:opacity-90 transition-opacity"
        >
          + Add Product
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-12 text-center text-brown-700">
          No products yet.
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead className="border-b border-white/40">
              <tr className="text-left text-brown-700">
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/20 hover:bg-white/20"
                >
                  <td className="p-4 text-brown-900 font-medium">{p.name}</td>
                  <td className="p-4 text-brown-700 capitalize">
                    {p.category}
                  </td>
                  <td className="p-4 text-brown-900">
                    EGP {(p.price ?? 0).toFixed(2)}
                  </td>
                  <td className="p-4 text-brown-700">{p.stock ?? "—"}</td>
                  <td className="p-4">
                    <Link href={'/admin/products/' + p.id + '/edit'} className="text-rose-400 hover:underline text-xs">Edit</Link>
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
