import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/login?from=/admin");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-brown-900 text-white flex flex-col p-6 gap-2 shrink-0">
        <div className="mb-8">
          <span className="font-script text-2xl text-rose-400">Meromade</span>
          <p className="text-xs text-white/50 mt-1">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-sans"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-sans"
          >
            Products
          </Link>
          <Link
            href="/admin/categories"
            className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-sans"
          >
            Categories
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-sans"
          >
            Orders
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-sans"
          >
            Analytics
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-blush-200 p-8 overflow-auto">{children}</main>
    </div>
  );
}
