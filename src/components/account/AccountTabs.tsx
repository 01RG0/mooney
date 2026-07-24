'use client'
import { useState, useEffect } from 'react'
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

export function AccountTabs() {
  const [tab, setTab] = useState<Tab>('profile')
  const { user, sessionReady } = useAuth()
  const [profile, setProfile] = useState<Record<string, string | undefined>>({})
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    // Wait for the __session cookie to be written before hitting API routes
    if (!user || !sessionReady) return
    fetch('/api/account/profile')
      .then((r) => r.ok ? r.json() : {})
      .then((data) => setProfile(data as Record<string, string | undefined>))
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [user, sessionReady])

  if (profileLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/30" />
        ))}
      </div>
    )
  }

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

      {tab === 'profile' && <ProfileEditor uid={user!.uid} profile={profile} firebaseUser={user} />}
      {tab === 'orders' && <OrdersHistory />}
      {tab === 'addresses' && <AddressManager />}
    </div>
  )
}
