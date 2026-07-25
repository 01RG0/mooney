"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import {
  computeShipping,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/cart";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <Container className="py-16">
        <div className="h-40 animate-pulse rounded-3xl bg-cream/60" />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl font-semibold text-brown-900">
            Your cart is empty
          </h1>
          <p className="text-brown-700">
            Nothing gathered yet. Wander the collection and find a piece made by
            hand.
          </p>
          <ButtonLink href="/shop" size="lg" className="mt-2">
            Browse the shop
            <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <Container className="py-10">
      <h1 className="font-display text-4xl font-semibold text-brown-900">
        Your cart
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Line items */}
        <ul className="divide-y divide-brown-900/10">
          {items.map((item) => (
            <li key={item.id} className="flex min-w-0 gap-4 py-5">
              <Link
                href={`/product/${item.slug}`}
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream/70 p-2"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-display text-lg font-semibold leading-snug text-brown-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brown-700">
                      {item.colorHex && (
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-black/10"
                          style={{ background: item.colorHex }}
                        />
                      )}
                      Colour: {item.color}
                    </p>
                  </div>
                  <span className="font-display text-lg font-semibold text-brown-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                  <div className="inline-flex items-center rounded-full border border-brown-900/20 bg-cream/60">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-brown-900 hover:bg-brown-900/8 active:bg-brown-900/12"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-brown-900 hover:bg-brown-900/8 active:bg-brown-900/12"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-brown-700 transition-colors hover:text-rose-500 active:text-rose-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-3xl bg-cream/80 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-brown-900">
            Order summary
          </h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brown-700">Subtotal</dt>
              <dd className="font-medium text-brown-900">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brown-700">Shipping</dt>
              <dd className="font-medium text-brown-900">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
          </dl>

          {remaining > 0 && (
            <p className="mt-3 rounded-2xl bg-blush-100 px-4 py-3 text-xs text-brown-700">
              Add {formatPrice(remaining)} more for free shipping.
            </p>
          )}

          <div className="mt-4 flex justify-between border-t border-brown-900/10 pt-4">
            <span className="font-display text-lg font-semibold text-brown-900">
              Total
            </span>
            <span className="font-display text-lg font-semibold text-brown-900">
              {formatPrice(total)}
            </span>
          </div>

          <ButtonLink
            href="/checkout"
            size="lg"
            className="mt-6 w-full"
          >
            Checkout
            <ArrowRightIcon className="h-4 w-4" />
          </ButtonLink>

          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 text-sm text-brown-700 hover:text-brown-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Continue shopping
          </Link>
        </aside>
      </div>
    </Container>
  );
}
