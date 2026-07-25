"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import { BagIcon } from "@/components/ui/icons";
import { buttonTap, ease, useReducedMotion } from "@/lib/motion";

export function CartButton() {
  const { count, isHydrated } = useCart();
  const rm = useReducedMotion();

  return (
    <motion.div whileTap={rm ? undefined : buttonTap} className="relative inline-flex">
      <Link
        href="/cart"
        aria-label={`Cart${isHydrated && count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-brown-900 transition-colors hover:bg-brown-900/8 active:bg-brown-900/12"
      >
        <BagIcon />
        <AnimatePresence>
          {isHydrated && count > 0 && (
            <motion.span
              key={count}
              initial={rm ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
              animate={rm ? { opacity: 1 } : { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 22 } }}
              exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12, ease: ease.smooth } }}
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}
