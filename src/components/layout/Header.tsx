"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { CartButton } from "./CartButton";
import { SearchIcon, MenuIcon } from "@/components/ui/icons";
import { Container } from "@/components/ui/Container";

const NAV = [
  { label: "About", href: "/#story" },
  { label: "Products", href: "/shop" },
  { label: "Promotions", href: "/#community" },
  { label: "Contact", href: "/#contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/shop" ? pathname.startsWith("/shop") : false;

  return (
    <header className="sticky top-0 z-40 border-b border-brown-900/8 bg-blush-200/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-[15px] transition-colors hover:text-brown-900 ${
                isActive(item.href)
                  ? "font-semibold text-brown-900"
                  : "text-brown-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/shop"
            aria-label="Search the shop"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-brown-900 transition-colors hover:bg-brown-900/8 sm:inline-flex"
          >
            <SearchIcon />
          </Link>
          <CartButton />
          <span
            aria-hidden
            className="ml-1 hidden h-9 w-9 rounded-full bg-gradient-to-br from-rose-300 to-brown-700 ring-2 ring-cream sm:inline-block"
          />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brown-900 hover:bg-brown-900/8 md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </Container>

      {open && (
        <nav
          className="border-t border-brown-900/8 bg-blush-100 md:hidden"
          aria-label="Mobile"
        >
          <Container className="flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[15px] text-brown-800"
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
