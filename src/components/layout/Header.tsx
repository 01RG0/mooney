"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
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
  const { user, loading } = useAuth();
  const router = useRouter();

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
          {/* Placeholder keeps layout stable while Firebase resolves */}
          {loading && (
            <div className="ml-1 h-9 w-9 rounded-full bg-brown-900/10" />
          )}
          {!loading && user && (
            <UserMenu
              user={user}
              onLogout={async () => {
                await signOut(auth);
                router.replace("/login");
              }}
            />
          )}
          {!loading && !user && (
            <Link
              href="/login"
              aria-label="Sign in"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-brown-700 ring-2 ring-cream"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          )}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brown-900 hover:bg-brown-900/8 active:bg-brown-900/12 md:hidden"
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

function UserMenu({
  user,
  onLogout,
}: {
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (user.displayName ?? user.email ?? "?")[0].toUpperCase();

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-300 to-brown-700 ring-2 ring-cream text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-rose-400"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-brown-900/10 bg-blush-50 shadow-[0_8px_32px_rgba(31,14,0,0.12)]">
          {/* User info */}
          <div className="border-b border-brown-900/8 px-4 py-3">
            <p className="truncate text-sm font-medium text-brown-900">
              {user.displayName ?? "Account"}
            </p>
            <p className="truncate text-xs text-brown-700">{user.email}</p>
          </div>

          {/* Actions */}
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-brown-900 transition-colors hover:bg-rose-400/10"
          >
            <SettingsIcon className="h-4 w-4 shrink-0 text-brown-700" />
            Profile settings
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-3 border-t border-brown-900/8 px-4 py-3 text-sm text-rose-500 transition-colors hover:bg-rose-400/10"
          >
            <LogOutIcon className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
