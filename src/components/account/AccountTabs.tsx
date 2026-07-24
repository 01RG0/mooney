'use client'
import { useState } from 'react'
import { ProfileEditor } from './ProfileEditor'
import { AddressManager } from './AddressManager'
import { useAuth } from '@/context/AuthContext'

export function AccountTabs({
  uid,
  profile,
}: {
  uid: string
  profile: Record<string, string | undefined>
}) {
  const [tab, setTab] = useState<'profile' | 'addresses'>('profile')
  const { user } = useAuth()

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(['profile', 'addresses'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-rose-400 text-white' : 'text-brown-700 hover:text-brown-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'profile' && <ProfileEditor uid={uid} profile={profile} firebaseUser={user} />}
      {tab === 'addresses' && <AddressManager />}
    </div>
  )
}
