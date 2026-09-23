'use server'

import { getAdminMessaging } from '../lib/firebase-admin'
import { getAllTokens, removeToken, saveToken } from '../lib/fcm-tokens'

export async function saveFcmToken(token: string) {
  await saveToken(token)
  return { success: true }
}

export async function removeFcmToken(token: string) {
  await removeToken(token)
  return { success: true }
}

export async function sendFcmNotification(title: string, body: string) {
  const stored = await getAllTokens()
  if (stored.length === 0) {
    throw new Error('No FCM tokens saved. Subscribe from the app first.')
  }

  const messaging = getAdminMessaging()
  const tokens = stored.map((t) => t.token)

  // Prefer multicast when available; fall back is not needed for Admin SDK.
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: title || 'FCM',
      body: body || '',
    },
  })

  // Drop tokens that are no longer valid
  const invalidIndexes: number[] = []
  response.responses.forEach((res, i) => {
    if (
      res.error &&
      (res.error.code === 'messaging/registration-token-not-registered' ||
        res.error.code === 'messaging/invalid-registration-token')
    ) {
      invalidIndexes.push(i)
    }
  })
  await Promise.all(
    invalidIndexes.map((i) => removeToken(tokens[i]!))
  )

  if (response.failureCount === response.successCount && response.successCount === 0) {
    return { success: false, error: 'Failed to send to all tokens' }
  }

  if (response.failureCount > 0) {
    const failures = response.responses
      .map((r, i) =>
        r.error
          ? {
              tokenSuffix: tokens[i]!.slice(-12),
              code: r.error.code,
              message: r.error.message,
            }
          : null
      )
      .filter(Boolean)

    console.error('Some FCM sends failed:', failures)

    const thirdParty = failures.find(
      (f) => f && f.code === 'messaging/third-party-auth-error'
    )
    if (thirdParty && response.successCount === 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: response.failureCount,
        error:
          'messaging/third-party-auth-error: Firebase could not authenticate with the browser push service (Mozilla/Google). Fix: (1) Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair (or ensure Key pair matches NEXT_PUBLIC_FIREBASE_VAPID_KEY), (2) Unsubscribe + Subscribe again, (3) Try Chrome — Firefox web tokens often hit this error even when Subscribe works.',
      }
    }
  }

  return {
    success: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
  }
}
