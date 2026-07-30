import type { Order } from '@/lib/types'

const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳',
  'pending-payment': '💳',
  'pending-manual-confirmation': '🟡',
  confirmed: '✅',
  shipped: '🚚',
  delivered: '📦',
  cancelled: '❌',
}

type OrderWithFee = Order & { deliveryCost?: number; shippingCost?: number; subtotal?: number; adminNote?: string; discountAmount?: number; couponCode?: string }

export function formatOrderMessage(order: OrderWithFee): string {
  const s = order.shippingDetails
  const items = order.items
    .map((i) => {
      const colorTag = i.color && i.color !== 'default' ? ` <i>(${i.color})</i>` : ''
      const hex = i.colorHex ? ` <code>${i.colorHex}</code>` : ''
      return `  • ${i.name}${colorTag}${hex} × ${i.quantity} = <b>${(i.price * i.quantity).toLocaleString()} EGP</b>`
    })
    .join('\n')

  const emoji = STATUS_EMOJI[order.status] ?? '❓'
  const mapLink = s.coordinates
    ? `\n🗺 <a href="https://maps.google.com/?q=${s.coordinates.lat},${s.coordinates.lng}">View on map</a>`
    : ''
  const deliveryFee = order.deliveryCost ?? order.shippingCost ?? 0
  const phone = s.phone
  const discount = order.discountAmount ?? 0

  const addressParts = [s.address, s.city]
  if (s.postalCode) addressParts.push(s.postalCode)
  if (s.governorate) addressParts.push(s.governorate)
  if (s.country) addressParts.push(s.country)

  return `
🛍 <b>New Order</b> — <code>${order.id}</code>
${emoji} Status: <b>${order.status}</b>${order.adminNote ? `\n📝 Note: ${order.adminNote}` : ''}

👤 <b>Customer</b>
Name: <b>${s.fullName}</b>
📞 Phone: <b>${phone ?? '—'}</b>
📧 Email: ${s.email}${order.paymentPhone ? `\n💳 Orange Cash #: <b>${order.paymentPhone}</b>` : ''}

🛒 <b>Items (${order.items.length})</b>
${items}

💰 <b>Payment</b>
Subtotal: ${(order.subtotal ?? 0).toLocaleString()} EGP
Delivery: ${Number(deliveryFee).toLocaleString()} EGP${discount > 0 ? `\nDiscount${order.couponCode ? ` (${order.couponCode})` : ''}: -${discount.toLocaleString()} EGP` : ''}
Total: <b>${order.total.toLocaleString()} EGP</b>
Method: <b>${order.paymentMethod ?? 'N/A'}</b>

📍 <b>Delivery Address</b>
${addressParts.join(', ')}${mapLink}

🕐 ${new Date(order.createdAt).toLocaleString('en-EG', { timeZone: 'Africa/Cairo' })}
`.trim()
}

type InlineKeyboardMarkup = {
  inline_keyboard: { text: string; callback_data: string }[][]
}

export function getOrderKeyboard(orderId: string, currentStatus: string): InlineKeyboardMarkup {
  const btn = (text: string, data: string) => ({ text, callback_data: data })
  const statusBtn = (text: string, newStatus: string) => btn(text, `status:${orderId}:${newStatus}`)

  const rows: { text: string; callback_data: string }[][] = []

  // Status transition buttons
  if (currentStatus === 'pending' || currentStatus === 'pending-manual-confirmation') {
    rows.push([statusBtn('Confirm ✅', 'confirmed'), statusBtn('Cancel ❌', 'cancelled')])
  } else if (currentStatus === 'confirmed') {
    rows.push([statusBtn('Mark Shipped 🚚', 'shipped'), statusBtn('Cancel ❌', 'cancelled')])
  } else if (currentStatus === 'shipped') {
    rows.push([statusBtn('Mark Delivered 📦', 'delivered')])
  }

  // Management buttons always shown
  rows.push([
    btn('✏️ Edit Delivery Fee', `editfee:${orderId}`),
    btn('📝 Add Note', `addnote:${orderId}`),
  ])
  rows.push([
    btn('🔄 Change Status', `changestatus:${orderId}`),
    btn('👁 View Full Order', `vieworder:${orderId}`),
  ])

  return { inline_keyboard: rows }
}

export function getStatusKeyboard(orderId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '⏳ Pending', callback_data: `status:${orderId}:pending` },
        { text: '✅ Confirmed', callback_data: `status:${orderId}:confirmed` },
      ],
      [
        { text: '🚚 Shipped', callback_data: `status:${orderId}:shipped` },
        { text: '📦 Delivered', callback_data: `status:${orderId}:delivered` },
      ],
      [
        { text: '❌ Cancelled', callback_data: `status:${orderId}:cancelled` },
        { text: '🔙 Back', callback_data: `vieworder:${orderId}` },
      ],
    ],
  }
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set')
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  })
}

export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  })
}

export async function sendTelegramPhoto(
  chatId: string | number,
  photoUrl: string,
  caption?: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' }),
  })
}
