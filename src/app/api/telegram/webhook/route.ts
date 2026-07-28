import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  answerCallbackQuery,
  editTelegramMessage,
  formatOrderMessage,
  getOrderKeyboard,
  getStatusKeyboard,
  sendTelegramMessage,
} from '@/lib/telegram'
import type { Order, OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'pending-payment', 'pending-manual-confirmation',
  'confirmed', 'shipped', 'delivered', 'cancelled',
]

// ── Conversation state for multi-step interactions ────────────────────────────
type ConversationState =
  | { type: 'awaiting_fee'; orderId: string; messageId?: number }
  | { type: 'awaiting_note'; orderId: string }
  | { type: 'awaiting_cancel_reason'; orderId: string }
  | { type: 'awaiting_search' }

const pendingState = new Map<string, ConversationState>()

// ── Helpers ───────────────────────────────────────────────────────────────────
function verifySecret(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  return request.headers.get('x-telegram-bot-api-secret-token') === secret
}

function adminChatId(): number | null {
  const id = process.env.TELEGRAM_ADMIN_CHAT_ID
  return id ? Number(id) : null
}

type FullOrder = Order & { id: string; adminNote?: string; deliveryCost?: number; subtotal?: number; cancelReason?: string }

async function getOrder(orderId: string): Promise<FullOrder | null> {
  const db = getAdminDb()
  const doc = await db.collection('orders').doc(orderId).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as FullOrder
}

async function updateOrder(orderId: string, data: Record<string, unknown>): Promise<void> {
  const db = getAdminDb()
  await db.collection('orders').doc(orderId).update({ ...data, updatedAt: new Date().toISOString() })
}

// ── Text command handlers ─────────────────────────────────────────────────────
async function handleCommand(chatId: number, text: string): Promise<void> {
  const parts = text.trim().split(/\s+/)
  const command = parts[0].toLowerCase()
  const arg = parts.slice(1).join(' ')

  if (command === '/start' || command === '/help') {
    await sendTelegramMessage(
      chatId,
      `👋 <b>Meromade Admin Bot</b>

<b>Order Commands</b>
/order &lt;ID&gt; — view order details &amp; actions
/pending — pending orders needing action
/orders — 10 most recent orders
/search &lt;name/phone&gt; — search orders by customer

<b>Product Commands</b>
/lowstock — products with stock ≤ 3

<b>Stats</b>
/stats — today's order summary

<b>AI Assistant</b>
Just type any question in plain text!`,
    )
    return
  }

  if (command === '/order' || command === '/o') {
    if (!arg) {
      await sendTelegramMessage(chatId, '❌ Usage: /order &lt;ORDER_ID&gt;\nExample: /order MC-123456')
      return
    }
    const orderId = arg.toUpperCase()
    const order = await getOrder(orderId)
    if (!order) {
      await sendTelegramMessage(chatId, `❌ Order <code>${orderId}</code> not found.`)
      return
    }
    await sendTelegramMessage(chatId, formatOrderMessage(order), getOrderKeyboard(order.id, order.status))
    return
  }

  if (command === '/pending') {
    await listOrders(chatId, ['pending', 'pending-manual-confirmation', 'pending-payment'])
    return
  }

  if (command === '/orders') {
    await listOrders(chatId, null, 10)
    return
  }

  if (command === '/search' || command === '/s') {
    if (!arg) {
      pendingState.set(String(chatId), { type: 'awaiting_search' })
      await sendTelegramMessage(chatId, '🔍 Enter a name, phone, or email to search:')
      return
    }
    await searchOrders(chatId, arg)
    return
  }

  if (command === '/lowstock') {
    await handleLowStock(chatId)
    return
  }

  if (command === '/stats') {
    await handleStats(chatId)
    return
  }

  // Not a recognised command — forward to AI assistant
  const apWebhook = process.env.PIPEDREAM_AI_WEBHOOK_URL ?? process.env.ACTIVEPIECES_AI_WEBHOOK_URL
  if (apWebhook && !text.startsWith('/')) {
    const aiSecret = process.env.AI_WEBHOOK_SECRET
    fetch(apWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(aiSecret && { 'x-webhook-secret': aiSecret }),
      },
      body: JSON.stringify({ question: text }),
    }).catch((e) => console.error('[telegram] ai webhook failed', e))
  }
}

async function listOrders(chatId: number, statuses: string[] | null, limit = 8): Promise<void> {
  const db = getAdminDb()

  let snap
  if (statuses?.length === 1) {
    snap = await db.collection('orders')
      .where('status', '==', statuses[0])
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
  } else {
    snap = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(statuses ? limit * 3 : limit)
      .get()
  }

  const STATUS_EMOJI: Record<string, string> = {
    pending: '⏳', 'pending-payment': '💳',
    'pending-manual-confirmation': '🟡', confirmed: '✅',
    shipped: '🚚', delivered: '📦', cancelled: '❌',
  }

  const docs = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Order & { id: string }))
    .filter((o) => !statuses || statuses.includes(o.status))
    .slice(0, limit)

  if (docs.length === 0) {
    await sendTelegramMessage(chatId, '📭 No orders found.')
    return
  }

  const title = statuses ? '⏳ Pending Orders' : '📋 Recent Orders'
  const lines = docs.map((o) => {
    const emoji = STATUS_EMOJI[o.status] ?? '❓'
    const name = o.shippingDetails?.fullName ?? 'Unknown'
    const date = new Date(o.createdAt).toLocaleDateString('en-EG', {
      timeZone: 'Africa/Cairo', day: '2-digit', month: 'short',
    })
    return `${emoji} <code>${o.id}</code> — ${name} — ${o.total.toLocaleString()} EGP — ${date}`
  })

  await sendTelegramMessage(chatId, `${title} (${docs.length})\n\n${lines.join('\n')}\n\n<i>Use /order &lt;ID&gt; to view details</i>`)
}

async function searchOrders(chatId: number, query: string): Promise<void> {
  const db = getAdminDb()
  const q = query.trim().toLowerCase()

  const snap = await db.collection('orders').orderBy('createdAt', 'desc').limit(100).get()
  const results = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Order & { id: string }))
    .filter((o) => {
      const s = o.shippingDetails
      const name = (s?.fullName ?? '').toLowerCase()
      const email = (s?.email ?? '').toLowerCase()
      const phone = ((s as { phone?: string }).phone ?? '').toLowerCase()
      const payPhone = (o.paymentPhone ?? '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q) || payPhone.includes(q) || o.id.toLowerCase().includes(q)
    })
    .slice(0, 8)

  if (results.length === 0) {
    await sendTelegramMessage(chatId, `🔍 No results for: <b>${query}</b>`)
    return
  }

  const lines = results.map((o) => {
    const name = o.shippingDetails?.fullName ?? 'Unknown'
    return `• <code>${o.id}</code> — ${name} — ${o.total.toLocaleString()} EGP — ${o.status}`
  })

  await sendTelegramMessage(chatId, `🔍 <b>Search: "${query}"</b>\n\n${lines.join('\n')}\n\n<i>Use /order &lt;ID&gt; to view details</i>`)
}

async function handleLowStock(chatId: number): Promise<void> {
  const db = getAdminDb()
  const snap = await db.collection('products').where('stock', '<=', 3).get()

  if (snap.empty) {
    await sendTelegramMessage(chatId, '✅ All products are well stocked.')
    return
  }

  const lines = snap.docs
    .map((d) => {
      const p = d.data() as { name?: string; stock?: number; price?: number }
      const stock = p.stock ?? 0
      const emoji = stock === 0 ? '🔴' : '🟡'
      return `${emoji} <b>${p.name ?? d.id}</b> — stock: <b>${stock}</b> — ${(p.price ?? 0).toLocaleString()} EGP`
    })
    .join('\n')

  await sendTelegramMessage(chatId, `⚠️ <b>Low Stock (${snap.size} products)</b>\n\n${lines}`)
}

async function handleStats(chatId: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const db = getAdminDb()
  const snap = await db.collection('orders').where('createdAt', '>=', today).get()

  const stats = { total: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0 }
  for (const doc of snap.docs) {
    const d = doc.data() as { status?: string; total?: number; createdAt?: string }
    if (!d.createdAt?.startsWith(today)) continue
    stats.total++
    if (d.status === 'pending' || d.status === 'pending-manual-confirmation') stats.pending++
    if (d.status === 'confirmed') stats.confirmed++
    if (d.status === 'shipped') stats.shipped++
    if (d.status === 'delivered') { stats.delivered++; stats.revenue += d.total ?? 0 }
    if (d.status === 'cancelled') stats.cancelled++
  }

  const cairoDate = new Date().toLocaleDateString('en-EG', { timeZone: 'Africa/Cairo', dateStyle: 'full' })
  await sendTelegramMessage(
    chatId,
    `📊 <b>Stats — ${cairoDate}</b>

📦 Total: <b>${stats.total}</b>
⏳ Pending: ${stats.pending}
✅ Confirmed: ${stats.confirmed}
🚚 Shipped: ${stats.shipped}
📦 Delivered: ${stats.delivered}
❌ Cancelled: ${stats.cancelled}

💰 Revenue (delivered): <b>${stats.revenue.toLocaleString()} EGP</b>`,
  )
}

// ── Callback query handler ────────────────────────────────────────────────────
async function handleCallback(
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  data: string,
): Promise<void> {
  const parts = data.split(':')
  const action = parts[0]
  const orderId = parts[1]

  // status:orderId:newStatus
  if (action === 'status' && parts.length === 3) {
    const newStatus = parts[2] as OrderStatus
    if (!VALID_STATUSES.includes(newStatus)) {
      await answerCallbackQuery(callbackQueryId, '❌ Invalid status')
      return
    }
    const order = await getOrder(orderId)
    if (!order) {
      await answerCallbackQuery(callbackQueryId, '❌ Order not found')
      return
    }
    await updateOrder(orderId, { status: newStatus })
    order.status = newStatus
    await editTelegramMessage(chatId, messageId, formatOrderMessage(order), getOrderKeyboard(orderId, newStatus))
    await answerCallbackQuery(callbackQueryId, `✅ Status → ${newStatus}`)
    return
  }

  // changestatus:orderId — show full status picker keyboard
  if (action === 'changestatus') {
    const order = await getOrder(orderId)
    if (!order) {
      await answerCallbackQuery(callbackQueryId, '❌ Order not found')
      return
    }
    await editTelegramMessage(chatId, messageId, formatOrderMessage(order), getStatusKeyboard(orderId))
    await answerCallbackQuery(callbackQueryId, 'Pick a status')
    return
  }

  // vieworder:orderId — refresh order message with updated data
  if (action === 'vieworder') {
    const order = await getOrder(orderId)
    if (!order) {
      await answerCallbackQuery(callbackQueryId, '❌ Order not found')
      return
    }
    await editTelegramMessage(chatId, messageId, formatOrderMessage(order), getOrderKeyboard(orderId, order.status))
    await answerCallbackQuery(callbackQueryId, 'Refreshed ✅')
    return
  }

  // editfee:orderId — prompt for new delivery fee
  if (action === 'editfee') {
    pendingState.set(String(chatId), { type: 'awaiting_fee', orderId, messageId })
    await answerCallbackQuery(callbackQueryId, 'Type the new fee amount')
    await sendTelegramMessage(chatId, `✏️ Enter new delivery fee for <code>${orderId}</code> (EGP):`)
    return
  }

  // addnote:orderId — prompt for admin note
  if (action === 'addnote') {
    pendingState.set(String(chatId), { type: 'awaiting_note', orderId })
    await answerCallbackQuery(callbackQueryId, 'Type the note')
    await sendTelegramMessage(chatId, `📝 Enter admin note for <code>${orderId}</code>:`)
    return
  }

  await answerCallbackQuery(callbackQueryId, '❓ Unknown action')
}

// ── Multi-step conversation handler ──────────────────────────────────────────
async function handlePendingState(chatId: number, text: string, state: ConversationState): Promise<boolean> {
  pendingState.delete(String(chatId))

  if (state.type === 'awaiting_fee') {
    const fee = parseFloat(text.trim())
    if (isNaN(fee) || fee < 0) {
      await sendTelegramMessage(chatId, '❌ Invalid amount. Enter a number like 50 or 75.5')
      return true
    }
    const order = await getOrder(state.orderId)
    if (!order) {
      await sendTelegramMessage(chatId, '❌ Order not found.')
      return true
    }
    await updateOrder(state.orderId, { deliveryCost: fee })
    order.deliveryCost = fee
    await sendTelegramMessage(chatId, `✅ Delivery fee updated to <b>${fee.toLocaleString()} EGP</b> for <code>${state.orderId}</code>`)
    if (state.messageId) {
      await editTelegramMessage(chatId, state.messageId, formatOrderMessage(order), getOrderKeyboard(state.orderId, order.status))
    }
    return true
  }

  if (state.type === 'awaiting_note') {
    const note = text.trim()
    if (!note) {
      await sendTelegramMessage(chatId, '❌ Empty note. Cancelled.')
      return true
    }
    await updateOrder(state.orderId, { adminNote: note })
    await sendTelegramMessage(chatId, `📝 Note saved for <code>${state.orderId}</code>:\n<i>${note}</i>`)
    return true
  }

  if (state.type === 'awaiting_cancel_reason') {
    const reason = text.trim()
    await updateOrder(state.orderId, { status: 'cancelled', cancelReason: reason })
    await sendTelegramMessage(chatId, `❌ Order <code>${state.orderId}</code> cancelled.\n<i>${reason || 'No reason given'}</i>`)
    return true
  }

  if (state.type === 'awaiting_search') {
    await searchOrders(chatId, text)
    return true
  }

  return false
}

// ── Main webhook entry point ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const admin = adminChatId()

    // Handle button presses
    if (body.callback_query) {
      const cq = body.callback_query as {
        id: string
        data?: string
        message?: { chat: { id: number }; message_id: number }
      }
      const chatId = cq.message?.chat.id
      if (!chatId || (admin && chatId !== admin)) return NextResponse.json({ ok: true })
      await handleCallback(chatId, cq.message!.message_id, cq.id, cq.data ?? '')
      return NextResponse.json({ ok: true })
    }

    // Handle text messages
    if (body.message) {
      const msg = body.message as { chat: { id: number }; text?: string }
      const chatId = msg.chat.id
      if (admin && chatId !== admin) return NextResponse.json({ ok: true })

      const text = msg.text?.trim() ?? ''
      if (!text) return NextResponse.json({ ok: true })

      // Check for pending multi-step state first
      const state = pendingState.get(String(chatId))
      if (state) {
        const handled = await handlePendingState(chatId, text, state)
        if (handled) return NextResponse.json({ ok: true })
      }

      await handleCommand(chatId, text)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[telegram-webhook]', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
