# QR-Thrive Backend-to-Backend Integration Guide

This guide provides everything needed to integrate your system with the QR-Thrive API. It includes endpoint documentation, TypeScript interfaces, enums, and payload examples.

---

## 1. Authentication

All requests to the QR-Thrive Integration API must include a secure API Key.

**Header Name:** `X-API-KEY`  
**Value:** `your_secure_api_key_here`

---

## 2. Shared Types & Enums

### Enums

```typescript
enum QRType {
  url = "url",
  text = "text",
  vcard = "vcard",
  wifi = "wifi",
  email = "email",
  sms = "sms",
  whatsapp = "whatsapp",
  phone = "phone",
  instagram = "instagram",
  facebook = "facebook",
  linkedin = "linkedin",
  twitter = "twitter",
  youtube = "youtube",
  tiktok = "tiktok",
  crypto = "crypto",
  socials = "socials",
  links = "links",
  image = "image",
  event = "event",
  pdf = "pdf",
  video = "video",
  mp3 = "mp3",
  app = "app",
  business = "business",
  menu = "menu",
  coupon = "coupon",
  form = "form"
}

enum QRStatus {
  active = "active",
  archived = "archived"
}

enum FormFieldType {
  text = "text",
  number = "number",
  range = "range",
  checkbox = "checkbox",
  select = "select",
  radio = "radio",
  email = "email",
  phone = "phone"
}
```

### Response Interfaces

```typescript
interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN";
  subscriptionStatus: string;
}

interface QRCodeResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: QRStatus;
  shortId: string;
  type: QRType;
  isDynamic: boolean;
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width: number;
  height: number;
  margin: number;
  clicks: number;
  createdAt: string;
}

interface ScanResponse {
  id: string;
  qrCodeId: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  city?: string;
  country?: string;
  region?: string;
  createdAt: string;
}

interface FormSubmissionResponse {
  id: string;
  formId: string;
  answers: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}
```

---

## 3. Integration Endpoints

### Step 1: Ensure User Exists
Checks if a user with the given email exists. If not, creates one.

**Endpoint:** `POST /integration/users`  
**Payload:**
```typescript
interface IntegrationUserDto {
  email: string;
  firstName: string;
  lastName: string;
}
```

---

### Step 2: Create a QR Code
Creates and customizes a QR code for a specific user.

**Endpoint:** `POST /integration/users/{userId}/qr-codes`  
**Payload:**
```typescript
interface CreateQRCodeDto {
  name: string;
  description?: string;
  folderId?: string;
  type: QRType;
  isDynamic?: boolean;
  data: any; // See payload examples below
  design: any; // Visual settings
  frame: any;  // Frame settings
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}
```

#### Payload Examples (`data` field):
- **URL:** `{ "url": "https://google.com" }`
- **WhatsApp:** `{ "phone": "+1234567890", "message": "Hello!" }`
- **WiFi:** `{ "ssid": "Home-WiFi", "password": "pass", "encryption": "WPA" }`
- **Form:** 
```json
{
  "form": {
    "title": "Customer Feedback",
    "description": "Tell us what you think",
    "fields": [
      { "type": "text", "label": "Full Name", "required": true },
      { "type": "email", "label": "Email Address" },
      { "type": "select", "label": "Rating", "options": [
        { "label": "Good", "value": "5" },
        { "label": "Bad", "value": "1" }
      ]}
    ]
  }
}
```

---

### Step 3: Analytics & Activities

#### Get QR Details
**Endpoint:** `GET /integration/users/{userId}/qr-codes/{qrCodeId}`  
**Note:** `{qrCodeId}` can be the UUID or the `shortId`.

#### Get Scan History
**Endpoint:** `GET /integration/users/{userId}/qr-codes/{qrCodeId}/scans`  
**Response:** `ScanResponse[]`

#### Get Form Responses
**Endpoint:** `GET /integration/users/{userId}/qr-codes/{qrCodeId}/responses`  
**Response:** `FormSubmissionResponse[]`

---

### Step 4: Seamless Single Sign-On (SSO)
Generate a magic link to let your user access the QR-Thrive dashboard directly.

**Endpoint:** `POST /integration/users/{userId}/magic-link`  
**Response:**
```typescript
{
  "url": "https://api.qrthrive.com/v1/auth/magic-login?token=abc..."
}
```
**Action:** Redirect your user to this URL.

---

## 4. Error Handling

- `401 Unauthorized`: API Key is missing or invalid.
- `403 Forbidden`: Resource ownership mismatch (Resource does not belong to the provided `userId`).
- `404 Not Found`: User, QR code, or Form not found.
- `400 Bad Request`: Payload validation failure (via `class-validator`).
