# QR Thrive: Tiered Pricing & Plan System

This document provides a technical overview of the dynamic pricing and plan management system implemented in the QR Thrive backend.

## 1. System Architecture

The pricing system is designed to be globally scalable, using an IP-based localization strategy to assign users to economic tiers.

### 1.1 IP-Based Localization
1. **Detection**: Every request to the pricing API uses the requester's IP address (via `geoip-lite`) to determine their ISO country code.
2. **Tier Mapping**: The country code is checked against the `Country` database table to find its assigned `Tier`.
3. **Currency**: The system retrieves the localized `currencyCode` and `currencySymbol` for the country.

### 1.2 The 3-Tier Model
Countries are grouped into three tiers based on economic status:
- **Tier 1**: High income (e.g., USA, UK, Canada).
- **Tier 2**: Middle income (e.g., Brazil, Turkey, Nigeria).
- **Tier 3**: Low income.

### 1.3 Adaptive Discounts
Baseline prices are set by administrators in **USD** per Tier. The system then automatically calculates interval prices based on global percentage discounts:
- **Monthly**: Baseline price (100%).
- **Quarterly**: (Monthly * 3) - `quarterlyDiscount` (default 10%).
- **Yearly**: (Monthly * 12) - `yearlyDiscount` (default 20%).

---

## 2. Core API Reference

### 2.1 Public Pricing Endpoints

#### `GET /api/v1/plans`
Retrieves all active plans with localized pricing based on the user's IP.

**Response:**
```typescript
interface PlanResponse {
  id: string;
  name: string;
  description: string | null;
  qrCodeLimit: number;
  qrCodeTypes: QRType[];
  isPopular: boolean;
  isDefault: boolean;
  currency: string;      // e.g. "USD"
  currencySymbol: string; // e.g. "$"
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}
```

---

### 2.2 Payment & Subscription

#### `POST /api/v1/payments/initialize`
Starts a purchase flow for a specific plan and interval.

**Request Body:**
```typescript
interface InitializePaymentDto {
  planId: string;
  interval: 'monthly' | 'quarterly' | 'yearly';
}
```

**Selection Logic:**
- The server recalculates the amount based on the user's IP to prevent client-side price tampering.
- The plan must be `isActive: true`.
- Metadata (userId, planId, interval) is passed to Paystack.

---

### 2.3 Admin Management Endpoints

#### Plans Management (`/api/v1/plans/...`)
| Method | Path | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/all` | Returns all plans (including inactive ones) | ADMIN |
| `POST` | `/` | Create a new plan | ADMIN |
| `PATCH` | `/:id` | Update plan details or deactivate (`isActive`) | ADMIN |
| `POST` | `/:id/price` | Set tier-specific pricing | ADMIN |

**Create/Update Plan Payload:**
```typescript
interface CreatePlanDto {
  name: string;
  description?: string;
  qrCodeLimit: number;
  qrCodeTypes: QRType[]; // Array of allowed types
  isPopular?: boolean;
  isDefault?: boolean;
}
```

#### Geography & Tiers (`/api/v1/pricing/...`)
| Method | Path | Description | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/tiers` | List all economic tiers | ADMIN |
| `POST` | `/tiers` | Create a new tier | ADMIN |
| `GET` | `/countries` | List all countries and their tier assignments | ADMIN |
| `POST` | `/countries` | Upsert a country (Update tier or currency) | ADMIN |
| `PATCH` | `/config` | Update global discounts (quarterly, yearly) | ADMIN |

---

## 3. Data Models (Prisma)

### Plan
The central entity defining what a user can do.
```typescript
enum QRType {
  url, text, vcard, wifi, email, sms, whatsapp, phone, 
  instagram, facebook, linkedin, twitter, youtube, tiktok,
  crypto, socials, links, image, event, pdf, video, mp3,
  app, business, menu, coupon, form
}

model Plan {
  id            String      // cuid()
  name          String      @unique
  description   String?
  qrCodeLimit   Int         @default(10)
  qrCodeTypes   QRType[]
  isPopular     Boolean     @default(false)
  isDefault     Boolean     @default(false)
  isActive      Boolean     @default(true)
}
```

### PlanPrice
Maps a plan to a specific economic tier with a baseline USD price.
```typescript
model PlanPrice {
  planId          String
  tierId          String
  monthlyPriceUSD Float
}
```

---

## 4. Usage Enforcement

The system uses a `UsageGuard` to protect QR code creation and duplication endpoints.

1. **Plan Detection**: Fetches the user's active plan via the `planId` relation.
2. **Type Validation**: Checks if the requested `QRType` is present in the `plan.qrCodeTypes` array.
3. **Limit Validation**: Counts total non-deleted QR codes owned by the user and compares them against `plan.qrCodeLimit`.

> [!NOTE]
> Admin users are automatically exempted from `UsageGuard` restrictions.

## 5. Webhook Integration

When a `charge.success` event is received from Paystack:
1. **Metadata Check**: Extracts `planId` and `interval` from the transaction metadata.
2. **User Update**: 
    - Updates `user.planId`.
    - Updates `user.billingCycle` (monthly, quarterly, or yearly).
    - Sets `user.subscriptionStatus` to `'active'`.
