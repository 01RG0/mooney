export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ number: process.env.ORANGE_CASH_NUMBER ?? '' })
}
