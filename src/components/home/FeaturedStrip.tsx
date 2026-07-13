import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { getNewArrivals } from "@/lib/repository/products";
import { ArrowRightIcon } from "@/components/ui/icons";

export async function FeaturedStrip() {
  const products = await getNewArrivals(4);

  return (
    <section className="py-10">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-brown-700">
              Fresh from the studio
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-brown-900">
              New arrivals
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 text-sm font-medium text-brown-900 underline-offset-4 hover:underline sm:inline-flex"
          >
            View all
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
