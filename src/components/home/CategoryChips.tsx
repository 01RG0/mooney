import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getCategories } from "@/lib/repository/products";
import { ArrowUpRightIcon } from "@/components/ui/icons";

export async function CategoryChips() {
  const categories = await getCategories();

  return (
    <section className="py-6">
      <Container>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="group flex items-center gap-4 rounded-3xl bg-cream/70 p-4 transition-colors hover:bg-cream"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blush-100">
                <Image
                  src={category.image}
                  alt=""
                  width={64}
                  height={64}
                  className="h-14 w-14 object-contain"
                />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-display text-lg font-semibold text-brown-900">
                  {category.name}
                  <ArrowUpRightIcon className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-0.5 block truncate text-xs text-brown-700">
                  {category.tagline}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
