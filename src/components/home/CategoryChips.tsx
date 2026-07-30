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
              className="group flex items-center gap-3 rounded-3xl bg-cream/70 p-3 transition-colors hover:bg-cream lg:gap-4 lg:p-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blush-100 lg:h-16 lg:w-16">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt=""
                    width={64}
                    height={64}
                    priority
                    className="h-10 w-10 object-contain lg:h-14 lg:w-14"
                  />
                ) : (
                  <span className="font-display text-2xl text-brown-700">
                    {category.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-display text-sm font-semibold text-brown-900 lg:text-lg">
                  <span className="truncate">{category.name}</span>
                  <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100 lg:h-4 lg:w-4" />
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
