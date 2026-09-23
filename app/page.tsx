'use client'

import { useState, useEffect, useCallback } from 'react'
import { getToken, onMessage, deleteToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '../lib/firebase-client'
import { saveFcmToken, removeFcmToken, sendFcmNotification } from './actions'

type NotificationPermissionState = NotificationPermission | 'unsupported'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type ForegroundMessage = {
  id: string
  title: string
  body: string
  receivedAt: string
}

function permissionLabel(permission: NotificationPermissionState) {
  switch (permission) {
    case 'granted':
      return 'Open (site allowed)'
    case 'denied':
      return 'Blocked (site denied)'
    case 'default':
      return 'Not decided yet'
    default:
      return 'Unsupported in this browser'
  }
}

/** Browser APIs cannot read macOS System Settings — only site permission + a visible test. */
function NotificationSettingsCheck() {
  const [permission, setPermission] =
    useState<NotificationPermissionState>('unsupported')
  const [hasNotificationApi, setHasNotificationApi] = useState(false)
  const [hasPushManager, setHasPushManager] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const refresh = useCallback(() => {
    const notificationOk = typeof window !== 'undefined' && 'Notification' in window
    const pushOk =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setHasNotificationApi(notificationOk)
    setHasPushManager(pushOk)
    setPermission(notificationOk ? Notification.permission : 'unsupported')
  }, [])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh])

  async function requestSitePermission() {
    if (!('Notification' in window)) return
    const next = await Notification.requestPermission()
    setPermission(next)
    setTestResult(null)
  }

  async function showTestBanner() {
    setTestResult(null)
    if (!('Notification' in window)) {
      setTestResult('Notification API missing.')
      return
    }
    if (Notification.permission !== 'granted') {
      setTestResult('Site permission is not granted yet. Click “Allow for this site” first.')
      return
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('macOS / Firefox check', {
          body: 'If you see this banner, Firefox alerts are reaching the screen.',
          icon: '/icon.png',
        })
      } else {
        new Notification('macOS / Firefox check', {
          body: 'If you see this banner, Firefox alerts are reaching the screen.',
          icon: '/icon.png',
        })
      }
      setTestResult(
        'Test sent. If nothing appeared: System Settings → Notifications → Firefox → turn on Alerts or Banners (not None), then unfocus Firefox.'
      )
    } catch (error) {
      setTestResult(
        `Test failed: ${error instanceof Error ? error.message : String(error)}. Check macOS Notifications for Firefox.`
      )
    }
  }

  return (
    <section style={{ marginBottom: '1.5rem', maxWidth: 560 }}>
      <h3>Notification settings check</h3>
      <p style={{ fontSize: 14, opacity: 0.85 }}>
        This page can only read the <strong>site</strong> permission. It cannot
        read macOS System Settings directly.
      </p>
      <ul style={{ fontSize: 14, lineHeight: 1.6 }}>
        <li>Notification API: {hasNotificationApi ? 'yes' : 'no'}</li>
        <li>PushManager: {hasPushManager ? 'yes' : 'no'}</li>
        <li>
          Site permission:{' '}
          <strong>{permissionLabel(permission)}</strong> ({permission})
        </li>
      </ul>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" onClick={refresh}>
          Refresh status
        </button>
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button type="button" onClick={requestSitePermission}>
            Allow for this site
          </button>
        )}
        <button type="button" onClick={showTestBanner}>
          Show test banner
        </button>
      </div>
      {testResult && (
        <p style={{ marginTop: 12, fontSize: 14 }}>{testResult}</p>
      )}
      <ol style={{ fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>
        <li>
          Site permission must be <code>granted</code>.
        </li>
        <li>
          macOS: <strong>System Settings → Notifications → Firefox</strong> →
          Alerts or Banners (not None).
        </li>
        <li>Unfocus or minimize Firefox — banners often hide while it is focused.</li>
      </ol>
    </section>
  )
}

function FcmPushManager() {
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
      // FCM needs an active worker before getToken (avoids flaky subscribe failures).
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

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as Window & { MSStream?: unknown }).MSStream
    )
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  if (isStandalone) {
    return null
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div>
      <h3>Install App</h3>
      {deferredPrompt ? (
        <button type="button" onClick={handleInstallClick}>
          Install app
        </button>
      ) : isIOS ? (
        <p>
          To install this app on your iOS device, tap the Share button
          <span role="img" aria-label="share icon">
            {' '}
            ⎋{' '}
          </span>
          and then &quot;Add to Home Screen&quot;
          <span role="img" aria-label="plus icon">
            {' '}
            ➕{' '}
          </span>
          .
        </p>
      ) : (
        <p style={{ fontSize: 14, opacity: 0.85, maxWidth: 480 }}>
          This browser does not expose an install prompt; use Chrome/Edge to
          install as an app, or bookmark.
        </p>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Next.js PWA + FCM</h1>
      <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 24, maxWidth: 560 }}>
        Study twin of the VAPID web-push app — this build uses Firebase Cloud
        Messaging.
      </p>
      <NotificationSettingsCheck />
      <FcmPushManager />
      <InstallPrompt />
    </div>
  )
}
