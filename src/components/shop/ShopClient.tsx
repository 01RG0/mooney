"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { SearchIcon } from "@/components/ui/icons";
import type { Category, Product } from "@/lib/types";
import { trackSearch } from "@/lib/analytics";

export function ShopClient({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  initialCategory: string;
}) {
  const [active, setActive] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search tracking — fires 1 s after the user stops typing
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) return;
    searchTimer.current = setTimeout(() => {
      void trackSearch(query.trim());
    }, 1000);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = active === "all" || p.category === active;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.maker.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, active, query]);

  const filters = [{ slug: "all", name: "All" }, ...categories];

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-brown-700">
            The collection
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brown-900">
            New arrivals
          </h1>
        </div>

        {/* Search */}
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search products</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brown-700" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search baskets, blooms, stones…"
            className="w-full rounded-full border border-brown-900/15 bg-cream/70 py-3 pl-11 pr-4 text-sm text-brown-900 placeholder:text-brown-700/60 focus:border-brown-900/40 focus:outline-none"
          />
        </label>
      </div>

      {/* Category filter pills */}
      <div className="mt-6 flex flex-wrap gap-2.5">
        {filters.map((f) => {
          const isActive = active === f.slug;
          return (
            <button
              key={f.slug}
              type="button"
              onClick={() => setActive(f.slug)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brown-900 bg-brown-900 text-blush-100"
                  : "border-brown-900/20 bg-cream/60 text-brown-800 hover:border-brown-900/50"
              }`}
            >
              {f.name}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 rounded-3xl bg-cream/60 py-16 text-center">
          <p className="font-display text-xl font-semibold text-brown-900">
            Nothing here yet
          </p>
          <p className="max-w-sm text-sm text-brown-700">
            No pieces match that search. Try another word, or clear the filters
            to see the whole collection.
          </p>
          <button
            type="button"
            onClick={() => {
              setActive("all");
              setQuery("");
            }}
            className="mt-2 rounded-full bg-rose-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500"
          >
            Clear filters
          </button>
        </div>
      )}
    </Container>
  );
}
