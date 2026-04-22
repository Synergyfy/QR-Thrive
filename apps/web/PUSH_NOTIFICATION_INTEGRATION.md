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

### Profile & Push Notification Hook

This hook handles both the Browser Push Subscription and the User Preference toggle.

```typescript
/* src/hooks/usePushNotifications.ts */

import { useState } from 'react';
import axios from 'axios'; // Or your API client
import { urlBase64ToUint8Array } from '../utils/push-utils';

export const usePushNotifications = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Step 1: Subscribe the browser to the Push Service
   */
  const subscribeBrowser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      // Send subscription object to backend
      await axios.post('/notifications/push/subscribe', subscription);
      
      return true;
    } catch (err) {
      console.error('Failed to subscribe browser: ', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Toggle the 'scanNotificationsEnabled' preference in User Profile
   */
  const toggleUserPreference = async (enabled: boolean) => {
    setLoading(true);
    try {
      await axios.patch('/auth/profile', {
        scanNotificationsEnabled: enabled
      });
      return true;
    } catch (err) {
      console.error('Failed to update user preference: ', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribeBrowser, toggleUserPreference, loading };
};
```

## 5. UI Integration Example

You should typically offer a toggle in the **User Settings/Profile** page.

```tsx
/* src/pages/ProfilePage.tsx */

import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const NotificationSettings = ({ user }) => {
  const [enabled, setEnabled] = useState(user.scanNotificationsEnabled);
  const { subscribeBrowser, toggleUserPreference, loading } = usePushNotifications();

  const handleToggle = async () => {
    const nextState = !enabled;
    
    if (nextState) {
      // 1. Ensure browser is subscribed first
      const success = await subscribeBrowser();
      if (!success) return alert("Please allow notification permissions in your browser.");
    }

    // 2. Update backend preference
    const updated = await toggleUserPreference(nextState);
    if (updated) setEnabled(nextState);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div>
        <h3 className="text-lg font-medium">QR Scan Push Notifications</h3>
        <p className="text-gray-500">Receive a real-time alert when your QR codes are scanned.</p>
      </div>
      <button 
        onClick={handleToggle} 
        disabled={loading}
        className={`px-4 py-2 rounded ${enabled ? 'bg-green-500' : 'bg-gray-300'} text-white`}
      >
        {loading ? 'Processing...' : enabled ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
};
```

## 6. API Endpoints Reference

### Subscribe Push (Browser Token)
- **URL**: `POST /notifications/push/subscribe`
- **Payload**: `PushSubscription` object (endpoint, keys, etc.)
- **Auth**: Required

### Update Profile (User Preference)
- **URL**: `PATCH /auth/profile`
- **Payload**: `{ scanNotificationsEnabled: boolean }`
- **Auth**: Required

### Get Current Status
- **URL**: `GET /auth/me`
- **Returns**: User object including `scanNotificationsEnabled`
- **Auth**: Required

## 7. Important Notes

1.  **Scope**: Ensure `sw.js` is served from the root (`/sw.js`) for proper scope coverage.
2.  **HTTPS**: Push notifications only work over HTTPS (and `localhost`).
3.  **Permissions**: Browsers will block push requests if not triggered by a user action (like a button click).
4.  **JWT**: Ensure all requests include the user's Auth token in the `Authorization` header.
5.  **Critical Requirement**: For a notification to be sent, **BOTH** conditions must be met:
    - The user must have a valid `PushSubscription` stored in the database.
    - The `scanNotificationsEnabled` field in the `User` record must be `true`.

---
*Documentation generated for QR-Thrive Push Implementation.*
