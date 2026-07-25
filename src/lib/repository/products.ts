import { getAdminDb } from '@/lib/firebase-admin'
import type { Category, Product } from '@/lib/types'

export async function getAllProducts(): Promise<Product[]> {
  try {
    const snap = await getAdminDb().collection('products').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]
  } catch {
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const snap = await getAdminDb().collection('products').where('slug', '==', slug).limit(1).get()
    if (snap.empty) return null
    const doc = snap.docs[0]
    return { id: doc.id, ...doc.data() } as Product
  } catch {
    return null
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getAdminDb().collection('categories').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as Category[]
  } catch {
    return []
  }
}

export async function getNewArrivals(limit = 6): Promise<Product[]> {
  try {
    const snap = await getAdminDb().collection('products').where('isNew', '==', true).limit(limit).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]
  } catch {
    return []
  }
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  try {
    const current = await getProductBySlug(slug)
    if (!current) return []
    const snap = await getAdminDb()
      .collection('products')
      .where('category', '==', current.category)
      .limit(limit + 1)
      .get()
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }) as Product)
      .filter(p => p.slug !== slug)
      .slice(0, limit)
  } catch {
    return []
  }
}
