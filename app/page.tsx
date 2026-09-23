'use client'

import { useState, useEffect, useCallback } from 'react'
import { FcmPushManager } from '@/app/push-panel'

type NotificationPermissionState = NotificationPermission | 'unsupported'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
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
