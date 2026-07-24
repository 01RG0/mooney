import { cert, getApps, getApp, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'

function getAdminApp() {
  if (getApps().length) return getApp()
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is not set')
  return initializeApp({ credential: cert(JSON.parse(key)) })
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
