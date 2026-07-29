"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { BagIcon, CheckIcon } from "@/components/ui/icons";
import { ViewerCounter } from '@/components/product/ViewerCounter'
import { trackProductView } from "@/lib/analytics";
import { buttonTap, useReducedMotion } from "@/lib/motion";

/**
 * Premium, Apple-ad style product detail. The whole frame IS the soft rose
 * surface: the product floats directly on it (no inner box), and a raised cream
 * card sits *in front*, overlapping upward so the product clearly reads as the
 * backdrop and the copy/CTA card as a separate layer on top.
 *
 * Spec palette (locked to the reference, independent of the site theme tokens):
 *   frame gradient  #F8D2D1 → #F5C4C3
 *   colour tiles    #F8D9D8
 *   card            #FFF8F7
 *   button          #F5B9B7
 * Motion is pure CSS (spring-ish keyframes in globals.css) so it stays
 * SSR-clean with no extra runtime.
 */
export function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const rm = useReducedMotion();
  const [colorIndex, setColorIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(product.mainImageIndex ?? 0)

  const useVariants = !!(product.hasColors && product.colorVariants?.length);
  const activeVariant = useVariants ? product.colorVariants![selectedVariantIndex] : undefined;

  useEffect(() => {
    void trackProductView(product.id, product.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function handleVariantChange(idx: number) {
    setSelectedVariantIndex(idx);
    setActiveIndex(0);
  }

  const color = useVariants
    ? (activeVariant?.name ?? "Default")
    : (product.colors[colorIndex]?.name ?? "Default");

  const variantImages = useVariants ? (activeVariant?.images ?? []) : null;
  const productImages = product.images ?? [];
  const galleryImages = variantImages !== null
    ? [...variantImages, ...productImages]
    : productImages;

  function handleAdd() {
    if (useVariants && activeVariant) {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: activeVariant.images[0] ?? product.image,
        color: activeVariant.name,
        colorHex: activeVariant.hex,
        selectedColorId: activeVariant.id,
        quantity: 1,
      });
    } else {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        color,
        quantity: 1,
      });
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const displayImage = galleryImages.length
    ? galleryImages[activeIndex] ?? galleryImages[0] ?? product.image
    : product.image

  const descriptionText =
    product.description?.trim() || " ";

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-[400px] lg:max-w-5xl">
        {/* Frame — mobile: stacked pink frame · desktop: two-column split */}
        <div
          className="font-sf relative flex w-full flex-col overflow-hidden rounded-[40px] shadow-[0_40px_80px_-24px_rgba(180,110,110,0.45)] ring-1 ring-white/40 lg:grid lg:grid-cols-2 lg:items-stretch"
          style={{
            background: "linear-gradient(to bottom, #F8D2D1, #F5C4C3)",
            animation: "fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
        {/* ── Pink stage: product floats directly on the background ── */}
        <div className="relative px-6 pt-6 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:pt-0">
          {/* soft studio glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-6 h-56 w-56 -translate-x-1/2 rounded-full bg-white/30 blur-3xl lg:top-1/2 lg:h-80 lg:w-80 lg:-translate-y-1/2"
          />

          {/* hero product — floating, no box around it */}
          <div className="flex h-[300px] items-center justify-center px-2 sm:h-[330px] lg:h-[460px]">
            {/* layoutId matches ProductCard to enable shared-element morph on navigation */}
            <motion.div
              layoutId={rm ? undefined : `product-image-${product.id}`}
              className="h-full w-full max-w-[280px] lg:max-w-[420px]"
            >
              <Image
                src={displayImage}
                alt={product.name}
                width={620}
                height={620}
                priority
                className="h-full w-full object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.18)]"
                style={{ animation: "floatY 5s ease-in-out infinite" }}
              />
            </motion.div>
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`h-12 w-12 overflow-hidden rounded-xl border-2 transition-all ${
                    i === activeIndex ? 'border-rose-400' : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* ── Colour selector — rounded-square tiles, evenly spread ── */}
          {useVariants ? (
            <div className="mt-4 mb-2 flex justify-center gap-3.5 lg:mt-8 lg:mb-0">
              {product.colorVariants!.map((v, i) => {
                const isActive = i === selectedVariantIndex;
                const isOutOfStock = v.stock === 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantChange(i)}
                    aria-label={v.name}
                    aria-pressed={isActive}
                    title={v.name}
                    className={`grid h-14 w-14 place-items-center rounded-[20px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOutOfStock ? 'opacity-40' : ''}`}
                    style={{
                      background: "#F8D9D8",
                      boxShadow: isActive
                        ? "inset 0 0 0 2px rgba(0,0,0,0.12), 0 8px 18px -8px rgba(0,0,0,0.25)"
                        : "0 4px 12px -8px rgba(0,0,0,0.18)",
                    }}
                  >
                    <span
                      className="block rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{
                        width: 22,
                        height: 22,
                        transform: isActive ? "scale(1.12)" : "scale(1)",
                        backgroundColor: v.hex,
                        boxShadow: isActive
                          ? "0 0 0 3px #FFF8F7, 0 0 0 5px rgba(0,0,0,0.22), 0 4px 8px -2px rgba(0,0,0,0.3)"
                          : "0 2px 6px -1px rgba(0,0,0,0.25)",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : product.colors.length > 0 ? (
            <div className="mt-4 mb-2 flex justify-center gap-3.5 lg:mt-8 lg:mb-0">
              {product.colors.map((c, i) => {
                const isActive = i === colorIndex;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColorIndex(i)}
                    aria-label={c.name}
                    aria-pressed={isActive}
                    title={c.name}
                    className="grid h-14 w-14 place-items-center rounded-[20px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                      background: "#F8D9D8",
                      boxShadow: isActive
                        ? "inset 0 0 0 2px rgba(0,0,0,0.12), 0 8px 18px -8px rgba(0,0,0,0.25)"
                        : "0 4px 12px -8px rgba(0,0,0,0.18)",
                    }}
                  >
                    <span
                      className="block rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{
                        width: 22,
                        height: 22,
                        transform: isActive ? "scale(1.12)" : "scale(1)",
                        backgroundColor: c.hex,
                        boxShadow: isActive
                          ? "0 0 0 3px #FFF8F7, 0 0 0 5px rgba(0,0,0,0.22), 0 4px 8px -2px rgba(0,0,0,0.3)"
                          : "0 2px 6px -1px rgba(0,0,0,0.25)",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* ── Cream card — mobile: overlaps stage · desktop: right column ── */}
        {/* z-0 on mobile so it never sits above the colour buttons in the pink stage above */}
        <div
          className="relative z-0 -mt-1 rounded-t-[36px] px-7 pb-9 pt-7 shadow-[0_-12px_40px_-18px_rgba(0,0,0,0.18)] lg:z-10 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:rounded-none lg:px-14 lg:py-16 lg:shadow-[-20px_0_50px_-30px_rgba(0,0,0,0.2)]"
          style={{ background: "#FFF8F7" }}
        >
          <p className="text-[13px] font-medium tracking-wide text-[#B79A98]">
            {product.maker}
          </p>

          <h1 className="mt-1.5 text-[32px] font-bold leading-[1.05] tracking-tight text-[#111111] sm:text-[36px] lg:text-[46px]">
            {product.name}
          </h1>

          <div className="mt-2">
            <ViewerCounter product={product} />
          </div>

          {/* Feature list — desktop only, fills the column nicely */}
          {product.details.length > 0 && (
            <ul className="mt-7 hidden space-y-3 lg:block">
              {product.details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-start gap-3 text-[15px] text-[#6b5b57]"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "#E79A93" }}
                  />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 lg:mt-10">
            <span
              key={product.price}
              className="text-[26px] font-bold tracking-tight text-[#111111] lg:text-[32px]"
              style={{ animation: "popIn 0.4s ease-out both" }}
            >
              {product.salePrice != null ? (
                <>
                  <span className="text-rose-500">{formatPrice(product.salePrice)}</span>
                  <span className="ml-2 text-base font-normal text-[#B79A98] line-through">{formatPrice(product.price)}</span>
                </>
              ) : formatPrice(product.price)}
            </span>

            <motion.button
              type="button"
              onClick={handleAdd}
              whileTap={rm ? undefined : buttonTap}
              className="group inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-[#111111] shadow-[0_10px_24px_-8px_rgba(220,120,120,0.7)] transition-all duration-200 hover:brightness-105 lg:h-[52px] lg:px-8"
              style={{ background: "#F5B9B7" }}
            >
              {added ? (
                <>
                  <CheckIcon className="h-[18px] w-[18px]" />
                  Added
                </>
              ) : (
                <>
                  Add to cart
                  <BagIcon className="h-[18px] w-[18px]" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

        {/* Description — separate frosted card below the product frame */}
        <section
          aria-labelledby="product-description-heading"
          className="mt-6 w-full overflow-hidden rounded-[40px] px-7 py-8 shadow-[0_40px_80px_-24px_rgba(180,110,110,0.35)] ring-1 ring-white/40 sm:px-9 lg:px-14 lg:py-10"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,248,247,0.92) 0%, rgba(248,210,209,0.55) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            animation: rm
              ? undefined
              : "fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.18s both",
          }}
        >
          <h2
            id="product-description-heading"
            className="font-display text-xl font-semibold text-brown-900 sm:text-2xl"
          >
            Description
          </h2>
          <p className="mt-3 max-w-2xl font-sans text-[15px] leading-relaxed text-brown-700 lg:text-base">
            {descriptionText}
          </p>
        </section>
      </div>
    </div>
  );
}
