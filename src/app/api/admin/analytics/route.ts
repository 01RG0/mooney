import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

interface ProductViewDoc {
  productId: string
  slug: string
  views: number
}

interface CartEventDoc {
  type: string
  productId: string
  productName: string
  slug?: string
  price: number
  quantity: number
  color?: string
  userId: string | null
  createdAt: string
}

interface SearchTermDoc {
  term: string
  count: number
  lastSearchedAt: string
}

export async function GET() {
  try {
    await requireAdmin()
    const db = getAdminDb()

    const [viewsSnap, cartSnap, searchSnap] = await Promise.all([
      db.collection('analytics').doc('productViews').collection('products').get(),
      db.collection('analytics').doc('cartEvents').collection('events').get(),
      db.collection('analytics').doc('searchTerms').collection('terms').get(),
    ])

    // Top products by view count
    const topProducts = viewsSnap.docs
      .map(d => d.data() as unknown as ProductViewDoc)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 10)

    // Cart event aggregation
    const cartDocs = cartSnap.docs
      .map(d => d.data() as unknown as CartEventDoc)
      .filter(e => typeof e.type === 'string' && typeof e.productName === 'string')
    const cartEvents = {
      addToCart: cartDocs.filter(e => e.type === 'add_to_cart').length,
      removedFromCart: cartDocs.filter(e => e.type === 'remove_from_cart').length,
      checkoutStarted: cartDocs.filter(e => e.type === 'checkout_started').length,
    }

    // Top products added to cart
    const addEvents = cartDocs.filter(e => e.type === 'add_to_cart')
    const cartByProduct = new Map<string, { productId: string; productName: string; slug: string; count: number }>()
    for (const e of addEvents) {
      const existing = cartByProduct.get(e.productId)
      if (existing) {
        existing.count++
      } else {
        cartByProduct.set(e.productId, { productId: e.productId, productName: e.productName, slug: e.slug ?? '', count: 1 })
      }
    }
    const topCartProducts = Array.from(cartByProduct.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top search terms
    const topSearches = searchSnap.docs
      .map(d => d.data() as unknown as SearchTermDoc)
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .slice(0, 10)
      .map(({ term, count }) => ({ term, count }))

    // Recent cart activity
    const recentCartEvents = cartDocs
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .slice(0, 20)
      .map(e => ({
        type: e.type,
        productName: e.productName,
        price: e.price,
        quantity: e.quantity,
        userId: e.userId ?? null,
        createdAt: e.createdAt,
      }))

    return Response.json({ topProducts, cartEvents, topCartProducts, topSearches, recentCartEvents })
  } catch {
    return Response.json({ error: 'Unauthorized or server error' }, { status: 401 })
  }
}
