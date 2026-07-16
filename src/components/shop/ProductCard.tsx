"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PlusIcon } from "@/components/ui/icons";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-cream/70 transition-colors hover:bg-cream">
      <Link
        href={`/product/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-blush-100/60 p-6"
      >
        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-brown-900 px-2.5 py-1 text-[11px] font-medium text-blush-100">
            New
          </span>
        )}
        <Image
          src={product.image}
          alt={product.name}
          width={300}
          height={300}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-brown-700">{product.maker}</p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 font-display text-[17px] font-semibold leading-snug text-brown-900 hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-brown-900">
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            aria-label={`Add ${product.name} to cart`}
            onClick={() =>
              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.image,
                color: product.colors[0]?.name ?? "Default",
              })
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-400 text-white transition-colors hover:bg-rose-500 active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
