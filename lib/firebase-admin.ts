import {
  type App,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'

const PLACEHOLDER = 'place_your_value'

function readAdminCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim()

  if (
    !projectId ||
    !clientEmail ||
    !privateKeyRaw ||
    projectId === PLACEHOLDER ||
    clientEmail === PLACEHOLDER ||
    privateKeyRaw === PLACEHOLDER
  ) {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  }
}

function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const creds = readAdminCredentials()
  if (!creds) {
    throw new Error(
      'Set Admin credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env (from Firebase Console → Project settings → Service accounts).'
    )
  }

  return initializeApp({
    credential: cert({
      projectId: creds.projectId,
      clientEmail: creds.clientEmail,
      privateKey: creds.privateKey,
    }),
    projectId: creds.projectId,
  })
}

/** Lazy Admin Messaging — only initializes when first called (build-safe). */
export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp())
}
