import { redirect } from 'next/navigation'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

interface ProductViewDoc { productId: string; slug: string; views: number }
interface CartEventDoc {
  type: string; productId: string; productName: string; slug?: string
  price: number; quantity: number; userId: string | null; createdAt: string
}
interface SearchTermDoc { term: string; count: number }
interface PageViewDailyDoc { date: string; count: number }
interface PageViewTotalDoc { count: number }

const BADGE: Record<string, string> = {
  add_to_cart:      'px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800',
  remove_from_cart: 'px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700',
  checkout_started: 'px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700',
}

/** Compute Monday 00:00 UTC of the current ISO week. */
function mondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/** First day of the current month (YYYY-MM-DD). */
function firstOfMonth(date: Date): string {
  return date.toISOString().slice(0, 7) + '-01'
}

/** Today's date (YYYY-MM-DD). */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function AnalyticsPage() {
  try { await requireAdmin() } catch { redirect('/login?from=/admin/analytics') }

  const db = getAdminDb()
  const now = new Date()
  const today = todayStr()
  const weekStart = mondayOfWeek(now)
  const monthStart = firstOfMonth(now)

  // Fetch page view data and existing analytics in parallel
  const [viewsSnap, cartSnap, searchSnap, dailySnap, totalSnap] = await Promise.all([
    db.collection('analytics').doc('productViews').collection('products').get(),
    db.collection('analytics').doc('cartEvents').collection('events').get(),
    db.collection('analytics').doc('searchTerms').collection('terms').get(),
    db.collection('analytics').doc('pageViews').collection('daily').get(),
    db.collection('analytics').doc('pageViews').collection('counters').doc('total').get(),
  ])

  // ── Page view aggregation ──────────────────────────────────────────────
  const dailyDocs = dailySnap.docs
    .map(d => d.data() as unknown as PageViewDailyDoc)
    .filter(d => typeof d.date === 'string' && typeof d.count === 'number')

  // Today
  const todayDoc = dailyDocs.find(d => d.date === today)
  const todayViews = todayDoc?.count ?? 0

  // This week (Mon–Sun)
  const weekViews = dailyDocs
    .filter(d => d.date >= weekStart && d.date <= today)
    .reduce((sum, d) => sum + (d.count ?? 0), 0)

  // This month
  const monthViews = dailyDocs
    .filter(d => d.date >= monthStart && d.date <= today)
    .reduce((sum, d) => sum + (d.count ?? 0), 0)

  // Total views
  const totalData = totalSnap.data() as unknown as PageViewTotalDoc | undefined
  const totalViews = totalData?.count ?? dailyDocs.reduce((sum, d) => sum + (d.count ?? 0), 0)

  // Top days (for a small mini-table)
  const topDays = dailyDocs
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 7)

  // ── Existing analytics ─────────────────────────────────────────────────
  const topProducts = viewsSnap.docs
    .map(d => d.data() as unknown as ProductViewDoc)
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10)

  const cartDocs = cartSnap.docs
    .map(d => d.data() as unknown as CartEventDoc)
    .filter(e => typeof e.type === 'string' && typeof e.productName === 'string')
  const funnel = {
    addToCart:      cartDocs.filter(e => e.type === 'add_to_cart').length,
    removedFromCart: cartDocs.filter(e => e.type === 'remove_from_cart').length,
    checkoutStarted: cartDocs.filter(e => e.type === 'checkout_started').length,
  }

  const cartByProduct = new Map<string, { productId: string; productName: string; slug: string; count: number }>()
  for (const e of cartDocs.filter(e => e.type === 'add_to_cart')) {
    const ex = cartByProduct.get(e.productId)
    if (ex) { ex.count++ } else { cartByProduct.set(e.productId, { productId: e.productId, productName: e.productName, slug: e.slug ?? '', count: 1 }) }
  }
  const topCartProducts = Array.from(cartByProduct.values()).sort((a, b) => b.count - a.count).slice(0, 10)

  const topSearches = searchSnap.docs
    .map(d => d.data() as unknown as SearchTermDoc)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 10)

  const recentCartEvents = cartDocs
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, 20)

  return (
    <div>
      <h1 className="font-display text-4xl text-brown-900 mb-8">Analytics</h1>

      {/* ── Website Views ────────────────────────────────────────────────── */}
      <h2 className="font-display text-2xl text-brown-900 mb-3">Website Views</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Today',      value: todayViews, icon: '📅' },
          { label: 'This Week',  value: weekViews,  icon: '📆' },
          { label: 'This Month', value: monthViews, icon: '📊' },
          { label: 'All Time',   value: totalViews, icon: '🌐' },
        ].map(s => (
          <div key={s.label} className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <p className="text-sm text-brown-700 font-sans">{s.label}</p>
            </div>
            <p className="font-display text-3xl text-brown-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Top days mini-table */}
      {topDays.length > 0 && (
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-white/40">
            <p className="text-sm font-sans font-medium text-brown-700">Top Days</p>
          </div>
          <table className="w-full">
            <thead className="border-b border-white/40">
              <tr>
                {['#', 'Date', 'Views'].map(h => (
                  <th key={h} className="p-3 text-sm text-brown-700 font-sans text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDays.map((d, i) => (
                <tr key={d.date} className="border-b border-white/20">
                  <td className="p-3 text-sm font-sans text-brown-700">{i + 1}</td>
                  <td className="p-3 text-sm font-sans text-brown-900">
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-3 text-sm font-sans text-brown-900">{d.count?.toLocaleString() ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Cart funnel ──────────────────────────────────────────────────── */}
      <h2 className="font-display text-2xl text-brown-900 mb-3 mt-10">Cart Funnel</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Add to Cart',        value: funnel.addToCart },
          { label: 'Removed from Cart',  value: funnel.removedFromCart },
          { label: 'Checkout Started',   value: funnel.checkoutStarted },
        ].map(s => (
          <div key={s.label} className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-6">
            <p className="text-sm text-brown-700 font-sans mb-1">{s.label}</p>
            <p className="font-display text-3xl text-brown-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top product views */}
      <h2 className="font-display text-2xl text-brown-900 mb-3">Top Product Views</h2>
      <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden mb-8">
        <table className="w-full">
          <thead className="border-b border-white/40">
            <tr>
              {['#', 'Slug', 'Views'].map(h => (
                <th key={h} className="p-4 text-sm text-brown-700 font-sans text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0
              ? <tr><td colSpan={3} className="p-4 text-sm font-sans text-brown-700 text-center">No data yet</td></tr>
              : topProducts.map((p, i) => (
                <tr key={p.productId} className="border-b border-white/20">
                  <td className="p-4 text-sm font-sans text-brown-700">{i + 1}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{p.slug}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{p.views ?? 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Top cart products */}
      <h2 className="font-display text-2xl text-brown-900 mb-3">Top Products Added to Cart</h2>
      <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden mb-8">
        <table className="w-full">
          <thead className="border-b border-white/40">
            <tr>
              {['#', 'Product', 'Add-to-Cart Count'].map(h => (
                <th key={h} className="p-4 text-sm text-brown-700 font-sans text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCartProducts.length === 0
              ? <tr><td colSpan={3} className="p-4 text-sm font-sans text-brown-700 text-center">No data yet</td></tr>
              : topCartProducts.map((p, i) => (
                <tr key={p.productId} className="border-b border-white/20">
                  <td className="p-4 text-sm font-sans text-brown-700">{i + 1}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{p.productName}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{p.count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Top searches */}
      <h2 className="font-display text-2xl text-brown-900 mb-3">Top Searches</h2>
      <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden mb-8">
        <table className="w-full">
          <thead className="border-b border-white/40">
            <tr>
              {['#', 'Search Term', 'Count'].map(h => (
                <th key={h} className="p-4 text-sm text-brown-700 font-sans text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topSearches.length === 0
              ? <tr><td colSpan={3} className="p-4 text-sm font-sans text-brown-700 text-center">No searches yet</td></tr>
              : topSearches.map((s, i) => (
                <tr key={s.term} className="border-b border-white/20">
                  <td className="p-4 text-sm font-sans text-brown-700">{i + 1}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{s.term}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{s.count ?? 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Recent cart activity */}
      <h2 className="font-display text-2xl text-brown-900 mb-3">Recent Cart Activity</h2>
      <div className="backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl overflow-hidden mb-8">
        <table className="w-full">
          <thead className="border-b border-white/40">
            <tr>
              {['Type', 'Product', 'Price', 'Qty', 'User', 'Time'].map(h => (
                <th key={h} className="p-4 text-sm text-brown-700 font-sans text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentCartEvents.length === 0
              ? <tr><td colSpan={6} className="p-4 text-sm font-sans text-brown-700 text-center">No activity yet</td></tr>
              : recentCartEvents.map((e, i) => (
                <tr key={i} className="border-b border-white/20">
                  <td className="p-4">
                    <span className={BADGE[e.type ?? ''] ?? 'px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700'}>
                      {(e.type ?? 'unknown').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-sans text-brown-900">{e.productName ?? '—'}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">EGP {(e.price ?? 0).toFixed(2)}</td>
                  <td className="p-4 text-sm font-sans text-brown-900">{e.quantity ?? 1}</td>
                  <td className="p-4 text-sm font-sans text-brown-700 font-mono">
                    {e.userId ? String(e.userId).slice(0, 8) : 'guest'}
                  </td>
                  <td className="p-4 text-sm font-sans text-brown-700">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
