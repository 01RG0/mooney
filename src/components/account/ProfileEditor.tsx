'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { auth } from '@/lib/firebase'
import {
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  type User,
} from 'firebase/auth'

const inputCls =
  'w-full rounded-2xl border border-brown-900/15 bg-white/40 px-4 py-3 text-sm text-brown-900 placeholder:text-brown-700/50 focus:border-rose-400/60 focus:outline-none'
const labelCls = 'mb-1.5 block text-sm font-medium text-brown-900'
const cardCls = 'rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 p-6 mb-4'

export function ProfileEditor({
  uid,
  profile,
  firebaseUser,
}: {
  uid: string
  profile: { name?: string; username?: string; email?: string; avatarUrl?: string }
  firebaseUser: User | null
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [name, setName] = useState(profile.name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const initials = (profile.name ?? firebaseUser?.email ?? '?')[0].toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/account/avatar', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      setAvatarUrl(data.url)
      if (firebaseUser) await updateProfile(firebaseUser, { photoURL: data.url })
    }
    e.target.value = ''
  }

  async function handleProfileSave() {
    await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username }),
    })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (!firebaseUser?.email) { setPwError('No email on account.'); return }
    try {
      const cred = EmailAuthProvider.credential(firebaseUser.email, currentPw)
      await reauthenticateWithCredential(firebaseUser, cred)
      await updatePassword(firebaseUser, newPw)
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSuccess(false), 2000)
    } catch (err: unknown) {
      setPwError((err as { message?: string }).message ?? 'Failed')
    }
  }

  return (
    <div>
      {/* Avatar */}
      <div className={cardCls}>
        <h3 className="font-display text-lg text-brown-900 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-rose-400/30">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-300 to-brown-700 text-xl font-semibold text-white">
                {initials}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="text-sm text-rose-400 hover:underline"
          >
            Change photo
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Name & Username */}
      <div className={cardCls}>
        <h3 className="font-display text-lg text-brown-900 mb-4">Name & Username</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
          </div>
          <button
            type="button"
            onClick={handleProfileSave}
            className="rounded-full bg-rose-400 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            {profileSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className={cardCls}>
        <h3 className="font-display text-lg text-brown-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputCls} autoComplete="current-password" />
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          {pwError && <p className="text-sm text-rose-500">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600">Password updated!</p>}
          <button type="submit" className="rounded-full bg-rose-400 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
