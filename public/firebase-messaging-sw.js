/* FCM background service worker — keep config in sync with NEXT_PUBLIC_FIREBASE_* */
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js')
importScripts(
  'https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js'
)

firebase.initializeApp({
  apiKey: 'AIzaSyA2E3IMYbV0NoReM1ZHk-NDVoN9c69gG6s',
  authDomain: 'pwa-pushnotification-a5e7e.firebaseapp.com',
  projectId: 'pwa-pushnotification-a5e7e',
  storageBucket: 'pwa-pushnotification-a5e7e.appspot.com',
  messagingSenderId: '707007721245',
  appId: '1:707007721245:web:e308c5c1187be46848bbf4',
  measurementId: 'G-ZCLQ324LMF',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || 'FCM', {
    body: payload.notification?.body,
    icon: '/icon.png',
    data: payload.data,
  })
})
