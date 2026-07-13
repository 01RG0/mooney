import productsData from "@/lib/data/products.json";
import categoriesData from "@/lib/data/categories.json";
import type { Category, Product } from "@/lib/types";

/*
 * Data-access layer. Pages and components import ONLY from here — never from the
 * JSON directly. Today these read bundled seed data; to move to a real Node/DB
 * backend, swap each body for a `fetch(process.env.API_URL + ...)` or ORM call.
 * The async signatures already match, so callers won't change.
 */

const products = productsData as Product[];
const categories = categoriesData as Category[];

export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return products.find((p) => p.slug === slug) ?? null;
}

async function getProductsByCategory(category: string): Promise<Product[]> {
  return products.filter((p) => p.category === category);
}

async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.maker.toLowerCase().includes(q),
  );
}

export async function getCategories(): Promise<Category[]> {
  return categories;
}

async function getCategory(slug: string): Promise<Category | null> {
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getNewArrivals(limit = 6): Promise<Product[]> {
  return products.filter((p) => p.isNew).slice(0, limit);
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const current = products.find((p) => p.slug === slug);
  if (!current) return [];
  return products
    .filter((p) => p.category === current.category && p.slug !== slug)
    .slice(0, limit);
}
