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
const inputReadonlyCls =
  'w-full rounded-2xl border border-brown-900/10 bg-white/20 px-4 py-3 text-sm text-brown-700 cursor-not-allowed'
const labelCls = 'mb-1.5 block text-sm font-medium text-brown-900'
const cardCls = 'rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 p-6 mb-4'

function isPasswordProvider(user: User | null) {
  return user?.providerData.some((p) => p.providerId === 'password') ?? false
}

export function ProfileEditor({
  uid,
  profile,
  firebaseUser,
}: {
  uid: string
  profile: { name?: string; username?: string; email?: string; avatarUrl?: string }
  firebaseUser: User | null
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? firebaseUser?.photoURL ?? '')
  const [name, setName] = useState(profile.name ?? firebaseUser?.displayName ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const email = firebaseUser?.email ?? profile.email ?? ''
  const initials = (name || email || '?')[0].toUpperCase()
  const hasPassword = isPasswordProvider(firebaseUser)

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
    setProfileError('')
    setProfileSaving(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username }),
      })
      if (!res.ok) throw new Error()
      if (firebaseUser && name) await updateProfile(firebaseUser, { displayName: name })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch {
      setProfileError('Failed to save. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (!firebaseUser?.email) { setPwError('No email on account.'); return }
    setPwSaving(true)
    try {
      const cred = EmailAuthProvider.credential(firebaseUser.email, currentPw)
      await reauthenticateWithCredential(firebaseUser, cred)
      await updatePassword(firebaseUser, newPw)
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSuccess(false), 2500)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.')
      } else {
        setPwError('Failed to update password. Please try again.')
      }
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div>
      {/* Avatar */}
      <div className={cardCls}>
        <h3 className="font-display text-lg text-brown-900 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-rose-400/30">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-300 to-brown-700 text-xl font-semibold text-white">
                {initials}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="text-sm text-rose-400 hover:underline"
            >
              Change photo
            </button>
            <p className="mt-0.5 text-xs text-brown-700">JPG, PNG or WebP · max 2 MB</p>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Name, Username & Email */}
      <div className={cardCls}>
        <h3 className="font-display text-lg text-brown-900 mb-4">Profile Details</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} placeholder="e.g. basket_lover" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={email} readOnly className={inputReadonlyCls} />
            <p className="mt-1 text-xs text-brown-700">Email cannot be changed here.</p>
          </div>
          {profileError && <p className="text-sm text-rose-500">{profileError}</p>}
          <button
            type="button"
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="rounded-full bg-rose-400 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {profileSaved ? '✓ Saved!' : profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password — only for email/password accounts */}
      {hasPassword && (
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
            {pwSuccess && <p className="text-sm text-green-600">Password updated successfully!</p>}
            <button
              type="submit"
              disabled={pwSaving}
              className="rounded-full bg-rose-400 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {!hasPassword && firebaseUser && (
        <div className={cardCls}>
          <h3 className="font-display text-lg text-brown-900 mb-1">Password</h3>
          <p className="text-sm text-brown-700">
            You signed in with Google. Password management is handled by your Google account.
          </p>
        </div>
      )}
    </div>
  )
}
