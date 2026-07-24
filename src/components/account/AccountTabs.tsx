'use client'
import { useState } from 'react'
import { ProfileEditor } from './ProfileEditor'
import { AddressManager } from './AddressManager'
import { OrdersHistory } from './OrdersHistory'
import { useAuth } from '@/context/AuthContext'

type Tab = 'profile' | 'orders' | 'addresses'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'My Orders' },
  { id: 'addresses', label: 'Addresses' },
]

export function AccountTabs({
  uid,
  profile,
}: {
  uid: string
  profile: Record<string, string | undefined>
}) {
  const [tab, setTab] = useState<Tab>('profile')
  const { user } = useAuth()

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-2xl bg-white/30 p-1 border border-white/40 backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-rose-400 text-white shadow-sm'
                : 'text-brown-700 hover:text-brown-900 hover:bg-white/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileEditor uid={uid} profile={profile} firebaseUser={user} />}
      {tab === 'orders' && <OrdersHistory />}
      {tab === 'addresses' && <AddressManager />}
    </div>
  )
}
