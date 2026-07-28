import { createHmac } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

function verifyHmac(params: URLSearchParams): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET
  if (!secret) return false // fail closed — secret must be configured

  // Paymob concatenates specific fields in alphabetical order for HMAC
  const fields = [
    'amount_cents', 'created_at', 'currency', 'error_occured',
    'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
    'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
    'is_voided', 'order', 'owner', 'pending', 'source_data.pan',
    'source_data.sub_type', 'source_data.type', 'success',
  ]
  const message = fields.map((f) => params.get(f) ?? '').join('')
  const computed = createHmac('sha512', secret).update(message).digest('hex')
  return computed === params.get('hmac')
}

async function updateOrder(paymobOrderId: string, success: boolean, transactionId: string | null) {
  const snap = await getAdminDb().collection('orders').where('paymobOrderId', '==', paymobOrderId).limit(1).get()
  if (snap.empty) return
  const docRef = snap.docs[0].ref
  if (success) {
    await docRef.update({ status: 'confirmed', paymobTransactionId: transactionId, updatedAt: new Date().toISOString() })
  } else {
    await docRef.update({ status: 'cancelled', updatedAt: new Date().toISOString() })
  }
}

// Browser redirect after payment
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  if (!verifyHmac(sp)) {
    return NextResponse.redirect(`${base}/checkout/result?success=false`)
  }

  const paymobOrderId = sp.get('order')
  const transactionId = sp.get('id')
  const success = sp.get('success') === 'true'

  if (paymobOrderId) {
    try { await updateOrder(paymobOrderId, success, transactionId) } catch { /* non-fatal */ }
  }

  return NextResponse.redirect(`${base}/checkout/result?success=${success ? 'true' : 'false'}`)
}

// Server-to-server webhook from Paymob
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>
    const hmac = request.nextUrl.searchParams.get('hmac')
    const secret = process.env.PAYMOB_HMAC_SECRET

    if (!secret) {
      return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 })
    }

    if (!hmac) {
      return NextResponse.json({ error: 'missing_hmac' }, { status: 400 })
    }

    {
      const obj = (body.obj ?? {}) as Record<string, unknown>
      const src = (obj.source_data ?? {}) as Record<string, unknown>
      const fields = [
        'amount_cents', 'created_at', 'currency', 'error_occured',
        'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
        'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
        'is_voided', 'order', 'owner', 'pending', 'source_data.pan',
        'source_data.sub_type', 'source_data.type', 'success',
      ]
      const lookup: Record<string, unknown> = {
        ...obj,
        'source_data.pan': src['pan'],
        'source_data.sub_type': src['sub_type'],
        'source_data.type': src['type'],
      }
      const message = fields.map((f) => String(lookup[f] ?? '')).join('')
      const computed = createHmac('sha512', secret).update(message).digest('hex')
      if (computed !== hmac) return NextResponse.json({ error: 'invalid_hmac' }, { status: 400 })
    }

    const obj = (body.obj ?? {}) as Record<string, unknown>
    const paymobOrderId = String((obj.order as Record<string, unknown>)?.id ?? '')
    const transactionId = String(obj.id ?? '')
    const success = obj.success === true || obj.success === 'true'

    if (paymobOrderId) {
      await updateOrder(paymobOrderId, success, transactionId)
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
