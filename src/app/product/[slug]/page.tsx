import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { ProductCard } from "@/components/shop/ProductCard";
import { ArrowLeftIcon } from "@/components/ui/icons";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/repository/products";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found — Mermaid Crafted" };
  return {
    title: `${product.name} — Mermaid Crafted`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, 4);

  return (
    <Container className="py-8">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-brown-700 transition-colors hover:text-brown-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="mt-6">
        <ProductDetailClient product={product} />
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-brown-900">
            You might also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
