"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { computeShipping } from "@/lib/cart";
import { submitOrder, type OrderConfirmation } from "@/lib/repository/orders";
import { ArrowLeftIcon, CheckIcon } from "@/components/ui/icons";

type Fields = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

const EMPTY: Fields = {
  fullName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
};

const FIELD_LABELS: Record<keyof Fields, string> = {
  fullName: "Full name",
  email: "Email",
  address: "Street address",
  city: "City",
  postalCode: "Postal code",
  country: "Country",
};

export default function CheckoutPage() {
  const { items, subtotal, clear, isHydrated } = useCart();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  );

  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;

  function validate(): boolean {
    const next: Partial<Record<keyof Fields, string>> = {};
    (Object.keys(fields) as (keyof Fields)[]).forEach((key) => {
      if (!fields[key].trim()) next[key] = `${FIELD_LABELS[key]} is required`;
    });
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      next.email = "Enter a valid email address";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    const result = await submitOrder(items, fields, total);
    clear();
    setConfirmation(result);
    setStatus("idle");
  }

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // Confirmation screen
  if (confirmation) {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-400 text-white">
            <CheckIcon className="h-8 w-8" />
          </span>
          <h1 className="font-display text-3xl font-semibold text-brown-900">
            Thank you — your order is placed
          </h1>
          <p className="text-brown-700">
            Order{" "}
            <span className="font-semibold text-brown-900">
              {confirmation.orderId}
            </span>{" "}
            is confirmed. We&apos;ve sent a receipt to {confirmation.email}.
          </p>
          <div className="mt-2 rounded-2xl bg-cream/80 px-6 py-4 text-sm text-brown-700">
            <p>
              Total paid:{" "}
              <span className="font-semibold text-brown-900">
                {formatPrice(confirmation.total)}
              </span>
            </p>
            <p className="mt-1">
              Estimated delivery: {confirmation.estimatedDelivery}
            </p>
          </div>
          <ButtonLink href="/shop" size="lg" className="mt-3">
            Continue shopping
          </ButtonLink>
        </div>
      </Container>
    );
  }

  if (!isHydrated) {
    return (
      <Container className="py-16">
        <div className="h-40 animate-pulse rounded-3xl bg-cream/60" />
      </Container>
    );
  }

  // Guard: nothing to check out.
  if (items.length === 0) {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl font-semibold text-brown-900">
            Your cart is empty
          </h1>
          <p className="text-brown-700">
            Add a piece to the cart before heading to checkout.
          </p>
          <ButtonLink href="/shop" size="lg" className="mt-2">
            Browse the shop
          </ButtonLink>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-brown-700 transition-colors hover:text-brown-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to cart
      </Link>

      <h1 className="mt-4 font-display text-4xl font-semibold text-brown-900">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Shipping form */}
        <div>
          <h2 className="font-display text-xl font-semibold text-brown-900">
            Shipping details
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              name="fullName"
              value={fields.fullName}
              error={errors.fullName}
              onChange={update}
              autoComplete="name"
            />
            <Field
              className="sm:col-span-2"
              name="email"
              type="email"
              value={fields.email}
              error={errors.email}
              onChange={update}
              autoComplete="email"
            />
            <Field
              className="sm:col-span-2"
              name="address"
              value={fields.address}
              error={errors.address}
              onChange={update}
              autoComplete="street-address"
            />
            <Field
              name="city"
              value={fields.city}
              error={errors.city}
              onChange={update}
              autoComplete="address-level2"
            />
            <Field
              name="postalCode"
              value={fields.postalCode}
              error={errors.postalCode}
              onChange={update}
              autoComplete="postal-code"
            />
            <Field
              className="sm:col-span-2"
              name="country"
              value={fields.country}
              error={errors.country}
              onChange={update}
              autoComplete="country-name"
            />
          </div>
          <p className="mt-4 text-xs text-brown-700">
            This is a demo checkout — no payment is taken and no card details are
            collected.
          </p>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-3xl bg-cream/80 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-brown-900">
            Order summary
          </h2>

          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blush-100 p-1.5">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium text-brown-900">
                    {item.name}
                  </p>
                  <p className="text-brown-700">
                    {item.color} · ×{item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-brown-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-brown-900/10 pt-4 text-sm">
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
            <div className="flex justify-between border-t border-brown-900/10 pt-2">
              <dt className="font-display text-base font-semibold text-brown-900">
                Total
              </dt>
              <dd className="font-display text-base font-semibold text-brown-900">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-400 px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-60"
          >
            {status === "submitting"
              ? "Placing order…"
              : `Place order · ${formatPrice(total)}`}
          </button>
        </aside>
      </form>
    </Container>
  );
}

function Field({
  name,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  className = "",
}: {
  name: keyof Fields;
  value: string;
  error?: string;
  onChange: (name: keyof Fields, value: string) => void;
  type?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-brown-900"
      >
        {FIELD_LABELS[name]}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(name, e.target.value)}
        className={`mt-1.5 w-full rounded-2xl border bg-cream/60 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/50 focus:outline-none ${
          error
            ? "border-rose-500 focus:border-rose-500"
            : "border-brown-900/15 focus:border-brown-900/40"
        }`}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
