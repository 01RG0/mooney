import type { Category, Product } from '@/lib/types'

const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function getAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${base}/api/products`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${base}/api/products/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${base}/api/categories`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getNewArrivals(limit = 6): Promise<Product[]> {
  try {
    const res = await fetch(`${base}/api/products?isNew=true&limit=${limit}`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  try {
    const current = await getProductBySlug(slug)
    if (!current) return []
    const res = await fetch(`${base}/api/products?category=${current.category}&exclude=${slug}&limit=${limit}`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}
