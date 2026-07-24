import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { getSessionUser } from '@/lib/session'
import { getAdminDb } from '@/lib/firebase-admin'
import { AccountTabs } from '@/components/account/AccountTabs'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?from=/account')

  const docSnap = await getAdminDb().collection('users').doc(user.uid).get()
  const profile = docSnap.exists ? (docSnap.data() as Record<string, string | undefined>) : {}

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl text-brown-900 mb-8">My Account</h1>
        <AccountTabs uid={user.uid} profile={profile} />
      </div>
    </Container>
  )
}
