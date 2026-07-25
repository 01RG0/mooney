"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { type OrderConfirmation } from "@/lib/repository/orders";
import { ArrowLeftIcon, CheckIcon } from "@/components/ui/icons";
import { trackCartEvent } from "@/lib/analytics";
import {
  calculateDeliveryFee,
  getDeliveryFeeEstimate,
  type DeliveryFeeResult,
} from "@/lib/delivery";

const MapPicker = dynamic(
  () => import("@/components/map/MapPicker").then((m) => m.MapPicker),
  { ssr: false },
);

type Fields = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  governorate: string;
};

const EMPTY: Fields = {
  fullName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Egypt",
  governorate: "",
};

const FIELD_LABELS: Record<keyof Fields, string> = {
  fullName: "Full name",
  email: "Email",
  address: "Street address",
  city: "City",
  postalCode: "Postal code",
  country: "Country",
  governorate: "Governorate",
};

const REQUIRED_FIELDS: (keyof Fields)[] = [
  "fullName",
  "email",
  "address",
  "city",
  "country",
];

export default function CheckoutPage() {
  const { items, subtotal, clear, isHydrated } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [orderError, setOrderError] = useState("");
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"orange-cash">("orange-cash");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<DeliveryFeeResult>(getDeliveryFeeEstimate());

  const deliveryFee = deliveryResult.fee;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    fetch("/api/checkout/orange-cash-number")
      .then((r) => r.json())
      .then((d) => setBusinessNumber(d.number ?? ""))
      .catch(() => {});
  }, []);

  function validate(): boolean {
    const next: Partial<Record<keyof Fields, string>> = {};
    REQUIRED_FIELDS.forEach((key) => {
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
    setOrderError("");
    void trackCartEvent("checkout_started", {
      productId: "cart",
      productName: "checkout",
      price: total,
      quantity: items.reduce((n, i) => n + i.quantity, 0),
    });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingDetails: {
            ...fields,
            ...(locationCoords && { coordinates: locationCoords }),
            deliveryFee,
            deliveryFeeConfirmed: deliveryResult.confirmed,
          },
          total,
          paymentMethod: "orange-cash",
          paymentPhone,
        }),
      });
      if (!res.ok) throw new Error("Order submission failed");
      const result = await res.json();
      clear();
      setConfirmation(result);
    } catch {
      setOrderError("Something went wrong placing your order. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleMapConfirm(result: {
    address: string;
    city: string;
    governorate: string;
    postalCode?: string;
    lat: number;
    lng: number;
  }) {
    setMapOpen(false);
    setLocationCoords({ lat: result.lat, lng: result.lng });
    setFields((prev) => ({
      ...prev,
      address: result.address || prev.address,
      city: result.city || prev.city,
      governorate: result.governorate || prev.governorate,
      postalCode: result.postalCode || prev.postalCode,
    }));
    if (result.governorate) {
      setDeliveryResult(calculateDeliveryFee(result.lat, result.lng, result.governorate));
    }
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

  if (!isHydrated || authLoading) {
    return (
      <Container className="py-16">
        <div className="h-40 animate-pulse rounded-3xl bg-cream/60" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl font-semibold text-brown-900">
            Sign in to check out
          </h1>
          <p className="text-brown-700">
            You need an account to place an order.
          </p>
          <ButtonLink href="/login?from=/checkout" size="lg" className="mt-2">
            Sign in to continue
          </ButtonLink>
        </div>
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
      {mapOpen && (
        <MapPicker
          onConfirm={handleMapConfirm}
          onClose={() => setMapOpen(false)}
          initialLat={locationCoords?.lat}
          initialLng={locationCoords?.lng}
        />
      )}

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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-brown-900">
              Shipping details
            </h2>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-brown-900/15 bg-white/60 px-3 py-1.5 text-xs font-medium text-brown-900 transition-colors hover:border-rose-400/60 hover:text-rose-500"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {locationCoords ? "Change location" : "Find on map"}
            </button>
          </div>

          {locationCoords && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/5 px-4 py-2.5 text-xs text-brown-700">
              <svg
                className="h-3.5 w-3.5 shrink-0 text-rose-400"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Location confirmed on map
            </div>
          )}

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
              name="governorate"
              value={fields.governorate}
              error={errors.governorate}
              onChange={update}
              autoComplete="address-level1"
            />
            <Field
              name="postalCode"
              value={fields.postalCode}
              error={errors.postalCode}
              onChange={update}
              autoComplete="postal-code"
            />
            <Field
              name="country"
              value={fields.country}
              error={errors.country}
              onChange={update}
              autoComplete="country-name"
            />
          </div>
        </div>

        {/* Payment method */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-semibold text-brown-900 mb-4">
            Payment Method
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Paymob — coming soon */}
            <div className="relative cursor-not-allowed rounded-2xl border-2 border-brown-900/10 bg-white/10 p-4 opacity-50 select-none">
              <span className="absolute right-2 top-2 rounded-full bg-brown-900/10 px-2 py-0.5 text-xs text-brown-700">
                Coming soon
              </span>
              <svg
                className="h-6 w-6 text-brown-700 mb-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <p className="font-medium text-sm text-brown-900">Pay by Card</p>
              <p className="text-xs text-brown-700 mt-0.5">
                Secure payment via Paymob
              </p>
            </div>

            {/* Orange Cash */}
            <div
              onClick={() => setPaymentMethod("orange-cash")}
              className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${paymentMethod === "orange-cash" ? "border-rose-400 bg-rose-400/5" : "border-brown-900/15 bg-white/20 hover:border-brown-900/30"}`}
            >
              <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                E£
              </div>
              <p className="font-medium text-sm text-brown-900">Orange Cash</p>
              <p className="text-xs text-brown-700 mt-0.5">
                Transfer to our number
              </p>
              {paymentMethod === "orange-cash" && (
                <div className="mt-3 space-y-2">
                  {businessNumber && (
                    <p className="text-xs text-brown-900 font-medium">
                      Transfer to:{" "}
                      <span className="text-rose-500">{businessNumber}</span>
                    </p>
                  )}
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="Your Orange Cash number"
                    className="w-full rounded-xl border border-brown-900/15 bg-white/60 px-3 py-2 text-xs text-brown-900 focus:outline-none focus:border-rose-400/60"
                  />
                  <p className="text-xs text-brown-700">
                    Order confirmed after we verify transfer.
                  </p>
                </div>
              )}
            </div>

            {/* COD — disabled */}
            <div className="relative cursor-not-allowed rounded-2xl border-2 border-brown-900/10 bg-white/10 p-4 opacity-50 select-none">
              <span className="absolute right-2 top-2 rounded-full bg-brown-900/10 px-2 py-0.5 text-xs text-brown-700">
                Coming soon
              </span>
              <svg
                className="h-6 w-6 text-brown-700 mb-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M22 10H2" />
                <path d="M7 15h.01M11 15h2" />
              </svg>
              <p className="font-medium text-sm text-brown-900">
                Cash on Delivery
              </p>
              <p className="text-xs text-brown-700 mt-0.5">
                Pay when order arrives
              </p>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-3xl bg-cream/80 p-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
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
              <dt className="text-brown-700">
                Delivery
                {!deliveryResult.confirmed && (
                  <span className="ml-1 text-xs text-brown-700/60">(est.)</span>
                )}
              </dt>
              <dd className="font-medium text-brown-900">
                {deliveryFee} EGP
              </dd>
            </div>
            {!deliveryResult.confirmed && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {deliveryResult.note ?? "Confirm your location on the map for an exact delivery fee"}
              </div>
            )}
            <div className="flex justify-between border-t border-brown-900/10 pt-2">
              <dt className="font-display text-base font-semibold text-brown-900">
                Total
              </dt>
              <dd className="font-display text-base font-semibold text-brown-900">
                {formatPrice(subtotal)}{" "}
                <span className="text-sm font-normal text-brown-700">
                  + {deliveryFee} EGP delivery
                </span>
              </dd>
            </div>
          </dl>

          {orderError && (
            <p className="mt-3 text-sm text-rose-500 text-center">{orderError}</p>
          )}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-400 px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-60"
          >
            {status === "submitting" ? "Placing order…" : `Place Order · ${formatPrice(subtotal)} + ${deliveryFee} EGP`}
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
