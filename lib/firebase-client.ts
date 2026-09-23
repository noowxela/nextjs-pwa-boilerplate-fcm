import { type FirebaseApp, type FirebaseOptions, getApps, initializeApp } from 'firebase/app'
import { type Messaging, getMessaging } from 'firebase/messaging'

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function getFirebaseApp(): FirebaseApp {
  const existing = getApps()[0]
  if (existing) return existing
  return initializeApp(firebaseConfig)
}

/** Returns Firebase Messaging only in the browser (SSR-safe). */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  return getMessaging(getFirebaseApp())
}
