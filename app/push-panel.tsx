'use client'

import { useEffect, useState } from 'react'
import { deleteToken, getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '../lib/firebase-client'
import { removeFcmToken, saveFcmToken, sendFcmNotification } from './actions'

type ForegroundMessage = {
  id: string
  title: string
  body: string
  receivedAt: string
}

export function FcmPushManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [messages, setMessages] = useState<ForegroundMessage[]>([])
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }
    setIsSupported(true)

    let unsubscribeOnMessage: (() => void) | undefined

    async function setup() {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/', updateViaCache: 'none' }
      )
      setSwRegistration(registration)

      const messaging = getFirebaseMessaging()
      if (!messaging) return

      unsubscribeOnMessage = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'FCM'
        const body = payload.notification?.body || ''
        setMessages((prev) => [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title,
            body,
            receivedAt: new Date().toISOString(),
          },
          ...prev,
        ])
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icon.png' })
        }
      })
    }

    setup().catch((err) => {
      setStatus(
        `SW register failed: ${err instanceof Error ? err.message : String(err)}`
      )
    })

    return () => {
      unsubscribeOnMessage?.()
    }
  }, [])

  async function subscribeToFcm() {
    setStatus(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('Notification permission not granted.')
        return
      }

      const messaging = getFirebaseMessaging()
      if (!messaging) {
        setStatus('Firebase Messaging is not available in this environment.')
        return
      }

      const registration =
        swRegistration ??
        (await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none',
        }))
      await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
      if (!vapidKey) {
        setStatus(
          'Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY. Use Firebase Console → Project settings → Cloud Messaging → Web Push certificates (Key pair), not a self-generated web-push key.'
        )
        return
      }

      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      })
      if (!fcmToken) {
        setStatus('getToken returned empty. Check Firebase web config + VAPID key.')
        return
      }

      await saveFcmToken(fcmToken)
      setToken(fcmToken)
      setStatus('Subscribed and token saved.')
    } catch (err) {
      setStatus(
        `Subscribe failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  async function unsubscribeFromFcm() {
    setStatus(null)
    try {
      const messaging = getFirebaseMessaging()
      if (messaging) {
        try {
          await deleteToken(messaging)
        } catch {
          // Token may already be gone; still remove from server store
        }
      }
      if (token) {
        await removeFcmToken(token)
      }
      setToken(null)
      setStatus('Unsubscribed.')
    } catch (err) {
      setStatus(
        `Unsubscribe failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  async function sendTestNotification() {
    setStatus(null)
    try {
      const result = await sendFcmNotification(
        'FCM Test',
        message || 'Hello from FCM study app'
      )
      if (result.success) {
        setStatus(
          `Sent (success=${result.successCount ?? '?'}, fail=${result.failureCount ?? '?'})`
        )
        setMessage('')
      } else {
        setStatus(result.error || 'Send failed')
      }
    } catch (err) {
      setStatus(
        `Send failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>
  }

  return (
    <div style={{ marginBottom: '1.5rem', maxWidth: 640 }}>
      <h3>FCM Push Notifications</h3>
      {token ? (
        <>
          <p>You are subscribed via FCM.</p>
          <p style={{ fontSize: 12, wordBreak: 'break-all', opacity: 0.85 }}>
            Token: <code>{token}</code>
          </p>
          <button type="button" onClick={unsubscribeFromFcm}>
            Unsubscribe
          </button>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <input
              type="text"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="button" onClick={sendTestNotification}>
              Send Test
            </button>
          </div>
        </>
      ) : (
        <>
          <p>You are not subscribed to FCM push.</p>
          <button type="button" onClick={subscribeToFcm}>
            Subscribe
          </button>
        </>
      )}
      {status && (
        <p style={{ marginTop: 12, fontSize: 14 }}>{status}</p>
      )}
      {messages.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h4>Foreground messages</h4>
          <ul style={{ fontSize: 13, lineHeight: 1.5 }}>
            {messages.map((m) => (
              <li key={m.id}>
                <strong>{m.title}</strong>: {m.body}{' '}
                <span style={{ opacity: 0.6 }}>({m.receivedAt})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
