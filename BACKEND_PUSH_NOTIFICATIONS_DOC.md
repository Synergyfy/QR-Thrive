# Push Notification Backend Implementation Guide

This document provides a comprehensive overview of how push notifications are handled in the QR-Thrive backend. Use this guide to replicate the implementation on other platforms.

## 1. Core Technologies
- **NestJS**: Backend framework.
- **Prisma**: ORM for PostgreSQL database.
- **web-push**: Node.js library for sending Web Push notifications.
- **VAPID (Voluntary Application Server Identification)**: Security protocol for Web Push.

## 2. Data Model (Prisma)
The system stores user subscriptions in the `PushSubscription` table. Each user can have multiple subscriptions (e.g., from different browsers/devices).

```prisma
model PushSubscription {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model User {
  // ... other fields
  pushSubscriptions        PushSubscription[]
  scanNotificationsEnabled Boolean @default(false)
}
```

## 3. Configuration (VAPID)
Push notifications require VAPID keys. These are configured in the `PushService` during module initialization.

**Required Environment Variables:**
- `VAPID_PUBLIC_KEY`: The public key shared with the frontend.
- `VAPID_PRIVATE_KEY`: The secret private key for signing notifications.
- `VAPID_SUBJECT`: A "mailto:" URI or a URL (e.g., `mailto:admin@qrthrive.com`).

```typescript
// push.service.ts initialization
onModuleInit() {
  const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
  const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
  const subject = this.config.get<string>('VAPID_SUBJECT');

  if (publicKey && privateKey && subject) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
}
```

## 4. Subscription Management
Users manage their subscriptions through the `NotificationsController`.

### API Endpoints
- **POST `/notifications/push/subscribe`**: Saves or updates a subscription for the authenticated user.
- **DELETE `/notifications/push/unsubscribe`**: Removes a subscription by its unique endpoint.

### DTO Structure
The subscription payload follows the standard Web Push API structure:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BASE64_ENCODED_STRING",
    "auth": "BASE64_ENCODED_STRING"
  }
}
```

## 5. Sending Notifications
The `PushService` handles retrieving all active subscriptions for a user and sending the notification payload.

### Implementation Details:
1.  **Retrieve Subscriptions**: Find all entries in `PushSubscription` for the given `userId`.
2.  **Construct Payload**: Stringify the notification object (e.g., `{ title, body, url }`).
3.  **Handle Delivery**: Iterate through subscriptions and call `webpush.sendNotification()`.
4.  **Error Handling**: If a subscription is no longer valid (Status 410 or 404), it is automatically removed from the database to prevent future failed attempts.

```typescript
async sendPushNotification(userId: string, payload: any) {
  const subscriptions = await this.prisma.pushSubscription.findMany({
    where: { userId },
  });

  const pushPromises = subscriptions.map((sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
      .catch(async (error) => {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.removeSubscription(sub.endpoint);
        }
      });
  });

  await Promise.all(pushPromises);
}
```

## 6. Trigger Example (QR Code Scans)
In the QR-Thrive system, notifications are triggered when a QR code is scanned, provided the owner has opted in via the `scanNotificationsEnabled` flag.

```typescript
// qr-codes.service.ts
if (qrCode.user.scanNotificationsEnabled) {
  this.pushService.sendPushNotification(qrCode.userId, {
    title: 'QR Code Scanned',
    body: `Your QR code "${qrCode.name}" was just scanned.`,
    url: `/dashboard/stats?id=${qrCode.id}`,
  }).catch(err => console.error('Push failed:', err));
}
```

## 7. Implementation Checklist for New Platform
1. [ ] **Database Setup**: Create a table to store subscriptions (endpoint, p256dh, auth) linked to users.
2. [ ] **VAPID Keys**: Generate and store public/private VAPID keys.
3. [ ] **Library**: Install a Web Push library (e.g., `web-push` for Node, `pywebpush` for Python).
4. [ ] **Endpoints**: Implement `subscribe` and `unsubscribe` API routes.
5. [ ] **Service Logic**: Create a function that fetches user subscriptions and sends the payload with proper error handling for expired endpoints.
6. [ ] **Opt-in Logic**: Ensure users have a way to toggle notifications on/off in their settings.
