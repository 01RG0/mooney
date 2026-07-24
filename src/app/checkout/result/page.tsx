import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const isSuccess = success === 'true'

  return (
    <Container className="py-20">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? 'bg-rose-400 text-white' : 'bg-brown-900/10 text-brown-900'
          }`}
        >
          {isSuccess ? (
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
        </span>
        <h1 className="font-display text-3xl font-semibold text-brown-900">
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h1>
        <p className="text-brown-700">
          {isSuccess
            ? 'Your order has been confirmed. Thank you for shopping with Meromade.'
            : 'Something went wrong with your payment. Please try again.'}
        </p>
        <Link
          href={isSuccess ? '/shop' : '/checkout'}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-rose-400 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-rose-500"
        >
          {isSuccess ? 'Continue Shopping' : 'Try Again'}
        </Link>
      </div>
    </Container>
  )
}
