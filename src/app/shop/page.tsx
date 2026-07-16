import { ShopClient } from "@/components/shop/ShopClient";
import { getAllProducts, getCategories } from "@/lib/repository/products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop — Meromade",
  description: "Browse hand-made baskets, chiffon florals, stone art and home décor.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, products, categories] = await Promise.all([
    searchParams,
    getAllProducts(),
    getCategories(),
  ]);

  const validCategory =
    category && categories.some((c) => c.slug === category) ? category : "all";

  return (
    <ShopClient
      key={validCategory}
      products={products}
      categories={categories}
      initialCategory={validCategory}
    />
  );
}
