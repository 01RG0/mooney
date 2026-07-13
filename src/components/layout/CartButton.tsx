"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { BagIcon } from "@/components/ui/icons";

export function CartButton() {
  const { count, isHydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart${isHydrated && count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-brown-900 transition-colors hover:bg-brown-900/8"
    >
      <BagIcon />
      {isHydrated && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
