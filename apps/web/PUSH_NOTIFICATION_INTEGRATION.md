# Frontend Push Notification Integration Guide

This guide explains how to integrate Web Push notifications in the QR-Thrive frontend using the recently implemented backend infrastructure.

## 1. Prerequisites

- **VAPID Public Key**: You need the public key generated in the `.env` of the API.
  - `VAPID_PUBLIC_KEY`: `BFQcwFuII5LqmPl3eJSEnZIKLPglOWTDA53VA9YqLHSlq6vT5ukA3ziQ-RPdcwQaWtlZ_2Kll5XvyUGDv045B_s`

## 2. Configuration (`.env`)

Add the VAPID Public Key to your frontend environment variables:

```bash
VITE_VAPID_PUBLIC_KEY=BFQcwFuII5LqmPl3eJSEnZIKLPglOWTDA53VA9YqLHSlq6vT5ukA3ziQ-RPdcwQaWtlZ_2Kll5XvyUGDv045B_s
```

## 3. Create the Service Worker (`public/sw.js`)

Create a file named `sw.js` in the `public` directory. This is essential for receiving background notifications.

```javascript
/* public/sw.js */

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: data.url || '/dashboard'
      },
      actions: [
        { action: 'open', title: 'Open Dashboard' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

## 4. Implementation Logic

### Helper: URL Safe Base64 to Uint8Array
The browser's `subscribe` method requires the VAPID key as a `Uint8Array`.

```typescript
/* src/utils/push-utils.ts */

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### Push Notification Hook / Service

```typescript
/* src/hooks/usePushNotifications.ts */

import { useState } from 'react';
import axios from 'axios'; // Or your API client
import { urlBase64ToUint8Array } from '../utils/push-utils';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      // Send to backend
      await axios.post('/notifications/push/subscribe', subscription);
      
      setIsSubscribed(true);
      console.log('User is subscribed.');
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
    } finally {
      setLoading(false);
    }
  };

  return { subscribeUser, isSubscribed, loading };
};
```

## 5. UI Integration

Register the feature in your Dashboard or Profile page.

```tsx
/* src/pages/DashboardPage.tsx */

import { usePushNotifications } from '../hooks/usePushNotifications';

const DashboardPage = () => {
  const { subscribeUser, isSubscribed, loading } = usePushNotifications();

  return (
    <div>
      <button 
        onClick={subscribeUser} 
        disabled={loading || isSubscribed}
        className="btn btn-primary"
      >
        {isSubscribed ? 'Notifications Enabled' : 'Enable Scan Notifications'}
      </button>
    </div>
  );
};
```

## 6. Important Notes

1.  **Scope**: Ensure `sw.js` is served from the root (`/sw.js`) for proper scope coverage.
2.  **HTTPS**: Push notifications only work over HTTPS (and `localhost`).
3.  **Permissions**: Browsers will block push requests if not triggered by a user action (like a button click).
4.  **JWT**: Ensure the `POST` request to `/notifications/push/subscribe` includes the user's Auth token in the `Authorization` header.
5.  **Database Migration**: verify `scanNotificationsEnabled` is set to `true` in the user's profile settings to actually trigger the notifications from the backend.

---
*Documentation generated for QR-Thrive Push Implementation.*
