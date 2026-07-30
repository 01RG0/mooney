"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { PlusIcon } from "@/components/ui/icons";
import { buttonTap, cardHover, useReducedMotion } from "@/lib/motion";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const rm = useReducedMotion();

  const firstVariant = product.hasColors ? product.colorVariants?.[0] : undefined;
  const cardImage = product.image ?? firstVariant?.images?.[0];
  const defaultColor = firstVariant?.name ?? product.colors[0]?.name ?? "Default";
  const defaultColorHex = firstVariant?.hex ?? product.colors[0]?.hex;
  const defaultColorId = firstVariant?.id;

  return (
    <motion.div
      initial="rest"
      whileHover={rm ? undefined : "hover"}
      variants={rm ? undefined : cardHover}
      className="flex flex-col overflow-hidden rounded-3xl bg-cream/70 transition-colors hover:bg-cream"
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-blush-100/60 p-6"
      >
        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-brown-900 px-2.5 py-1 text-[11px] font-medium text-blush-100">
            New
          </span>
        )}
        {/* layoutId enables morph to ProductDetailClient hero image */}
        <motion.div
          layoutId={rm ? undefined : `product-image-${product.id}`}
          className="h-full w-full"
        >
          <Image
            src={cardImage}
            alt={product.name}
            width={300}
            height={300}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="h-full w-full object-contain"
          />
        </motion.div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-brown-700">{product.maker}</p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 font-display text-[17px] font-semibold leading-snug text-brown-900 hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-3 flex items-end justify-between gap-2">
          <span className="font-display text-base font-semibold leading-tight text-brown-900 sm:text-lg">
            {product.salePrice != null ? (
              <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-1.5">
                <span className="text-rose-500">{formatPrice(product.salePrice)}</span>
                <span className="text-sm font-normal text-brown-500 line-through">{formatPrice(product.price)}</span>
              </span>
            ) : (
              formatPrice(product.price)
            )}
          </span>
          <motion.button
            type="button"
            whileTap={rm ? undefined : buttonTap}
            aria-label={`Add ${product.name} to cart`}
            onClick={() =>
              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: cardImage,
                color: defaultColor,
                colorHex: defaultColorHex,
                selectedColorId: defaultColorId,
              })
            }
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-400 text-white transition-colors hover:bg-rose-500 sm:h-11 sm:w-11"
          >
            <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
