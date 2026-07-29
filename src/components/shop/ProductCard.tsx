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
  const cardImage = firstVariant?.images?.[0] ?? product.image;
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

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-brown-900">
            {product.salePrice != null ? (
              <>
                <span className="text-rose-500">{formatPrice(product.salePrice)}</span>
                <span className="ml-1.5 text-sm font-normal text-brown-500 line-through">{formatPrice(product.price)}</span>
              </>
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-400 text-white transition-colors hover:bg-rose-500"
          >
            <PlusIcon className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
