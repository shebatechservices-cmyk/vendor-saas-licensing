# Vendor SaaS Licensing & Client Management System

A production-ready, centralized Vendor Licensing & SaaS Control Server designed to control, license, monitor, and bill client applications (e.g. **Sheba ERP**, Madrasa/School Management App, ERPs, Multi-tenant SaaS).

---

## 🏛️ System Architecture

The codebase is organized following standard modular enterprise architecture:

```
/home/sheba/Vendor/
├── src/
│   ├── controllers/              # Business logic controllers
│   │   ├── license.controller.ts # /api/license/verify, generate, redeem
│   │   ├── client.controller.ts  # Client management & master killswitch
│   │   ├── code.controller.ts    # Code pre-generation vault
│   │   ├── ledger.controller.ts  # Double-entry client ledger & accounting
│   │   └── stats.controller.ts   # Real-time aggregated KPIs & telemetry
│   ├── routes/ / app/api/        # Next.js API route handlers
│   │   ├── license/
│   │   │   ├── verify/route.ts   # Core client verification & telemetry endpoint
│   │   │   └── generate/route.ts # Pre-generation batch endpoint
│   │   ├── vendor/
│   │   │   ├── heartbeat/route.ts # Client heartbeat sync
│   │   │   └── redeem/route.ts   # Strict remote code redemption
│   │   ├── clients/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── toggle-status/route.ts # Instant killswitch toggle
│   │   ├── codes/route.ts
│   │   ├── ledger/route.ts
│   │   └── stats/route.ts
│   ├── models/                   # Database models & Prisma interfaces
│   │   └── index.ts
│   ├── middlewares/              # Request authentication & validation
│   │   ├── auth.middleware.ts    # Client App & Vendor Admin auth
│   │   ├── error.middleware.ts   # Standardized JSON error response handler
│   │   └── validation.middleware.ts # Payload validation helpers
│   ├── hooks/                    # Reusable React UI hooks
│   │   ├── useDashboardStats.ts  # Real-time telemetry polling
│   │   ├── useClients.ts         # Client search, filtering, and block actions
│   │   ├── useCodes.ts           # Code vault & batch generation
│   │   └── useLedger.ts          # Accounting statements & dues tracking
│   ├── components/               # Modular UI components
│   │   ├── Navbar.tsx            # Header with live status beacon
│   │   ├── StatCard.tsx          # KPI metric cards
│   │   ├── ClientStatusBadge.tsx # Status badges (Active, Blocked, Expired)
│   │   ├── ClientDetailsModal.tsx # Credentials inspection & expiry timelines
│   │   └── ApiIntegrationGuide.tsx # Interactive client integration snippets
│   └── lib/
│       ├── jwt.ts                # Cryptographic JWT License Token signer & verifier
│       ├── prisma.ts             # Prisma DB connection singleton
│       ├── code-generator.ts     # Cryptographic alphanumeric code generator
│       └── quota-calc.ts         # Madrasa/School quota & financial math
├── prisma/
│   └── schema.prisma             # SQLite / PostgreSQL schema
└── .env                          # Strictly managed environment variables
```

---

## ⚙️ Environment Configuration

Ensure `.env` contains:

```ini
# Database Connection URI
DATABASE_URL="file:./dev.db"

# Server Port & Environment
PORT=3001
NODE_ENV=production

# Cryptographic Secret for License Token (JWT) Generation
JWT_SECRET="vendor_saas_jwt_secret_key_prod_2026_x89a@!#"

# Master Admin API Key
ADMIN_API_KEY="vendor_admin_key_super_secure_2026"
```

---

## 📡 Core Licensing API Reference

### 1. Verify License & Live Telemetry
- **Endpoint**: `POST /api/license/verify`
- **Purpose**: Called by client apps (like **Sheba ERP**) upon boot and periodically every 2–5 minutes. Returns license validity, active/blocked state, killswitch directives, and a cryptographically signed JWT License Token.

#### Request Body
```json
{
  "clientId": "CLI-APP-001",
  "secretKey": "sec_98a72b102847cde8",
  "appVersion": "v3.2.0",
  "domain": "erp.sheba.com.bd",
  "statusReported": "OPERATIONAL",
  "activeStudentsCount": 450,
  "databaseSizeMb": 142.5
}
```

#### Success Response (`HTTP 200`)
```json
{
  "success": true,
  "is_valid": true,
  "status": "ACTIVE",
  "killswitch": false,
  "message": "License is active and valid.",
  "license_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "client": {
    "id": "cmu55zdxg0000lrp2bcm241wp",
    "client_code": "CLI-APP-001",
    "name": "Darul Uloom International Madrasa & Academy",
    "domain": "erp.sheba.com.bd",
    "app_type": "Madrasa/School Management App",
    "status": "ACTIVE",
    "is_lifetime": false,
    "license_expires_at": "2028-09-17T00:00:00.000Z",
    "hosting_expires_at": "2027-09-17T00:00:00.000Z",
    "domain_expires_at": "2027-09-17T00:00:00.000Z",
    "student_quota": 500,
    "storage_quota_gb": 10.0
  },
  "directives": {
    "status": "ACTIVE",
    "killswitch": false,
    "is_blocked": false,
    "is_expired": false,
    "student_quota": 500,
    "storage_quota_gb": 10.0,
    "reason": "License is active and valid."
  },
  "server_time": "2026-09-24T14:45:00.000Z"
}
```

#### Blocked / Suspended Response (`HTTP 200` with `killswitch: true`)
```json
{
  "success": true,
  "is_valid": false,
  "status": "BLOCKED",
  "killswitch": true,
  "message": "Client application has been blocked by Vendor administration.",
  "directives": {
    "status": "BLOCKED",
    "killswitch": true,
    "is_blocked": true,
    "is_expired": false,
    "reason": "Client application has been blocked by Vendor administration."
  }
}
```

---

### 2. Strict Remote Code Redemption
- **Endpoint**: `POST /api/vendor/redeem`
- **Purpose**: Users input a renewal or quota key in their client software. The client software forwards it to this endpoint.

#### Request Body
```json
{
  "clientId": "CLI-APP-001",
  "secretKey": "sec_98a72b102847cde8",
  "code": "LIC-Z4ZA-2A5E-A479"
}
```

#### Success Response (`HTTP 200`)
```json
{
  "success": true,
  "message": "Code LIC-Z4ZA-2A5E-A479 successfully verified and redeemed.",
  "code": "LIC-Z4ZA-2A5E-A479",
  "code_type": "License",
  "category": "APP_LICENSE",
  "duration": "1 Year",
  "duration_years": 1,
  "is_lifetime": false,
  "student_quota_added": null,
  "client_app_id": "CLI-APP-001",
  "status": "active",
  "license_expiry": "2028-09-17T00:00:00.000Z",
  "price_bdt": 10000,
  "verified_at": "2026-09-24T14:45:00.000Z"
}
```

#### Error Response Examples
- Invalid / Non-existent code: `HTTP 400` `{"success": false, "error": "Invalid Code"}`
- Already used code: `HTTP 400` `{"success": false, "error": "Code already used"}`

---

### 3. Master Killswitch / Instant Block Action
- **Endpoint**: `POST /api/clients/:id/toggle-status`
- **Request Body**:
```json
{
  "status": "BLOCKED" // or "ACTIVE" | "SUSPENDED"
}
```

---

## 💻 Sheba ERP Integration Snippet

```typescript
import axios from 'axios';

const VENDOR_API_URL = process.env.VENDOR_API_URL || 'http://localhost:3001';
const CLIENT_APP_ID  = process.env.CLIENT_APP_ID  || 'CLI-APP-001';
const CLIENT_SECRET  = process.env.CLIENT_SECRET  || 'sec_your_secret_key';

// Periodic License Health Check
export async function verifyShebaLicense() {
  try {
    const res = await axios.post(`${VENDOR_API_URL}/api/license/verify`, {
      clientId: CLIENT_APP_ID,
      secretKey: CLIENT_SECRET,
      appVersion: 'v3.2.0',
      activeStudentsCount: 350
    });

    if (res.data.killswitch || res.data.status === 'BLOCKED') {
      // Lock ERP or show suspension modal
      return { active: false, message: res.data.message };
    }

    return { active: true, client: res.data.client };
  } catch (error: any) {
    return { active: false, error: error.message };
  }
}
```

---

## 🛡️ Multi-Factor Authentication & Zero-Trust Defense (2FA / 3FA)

The Vendor License Controller enforces a 3-layer Zero-Trust authentication architecture to protect against unauthorized master admin access:

1. **Layer 1: Master Credentials & Strong Hashing**
   - Email & Master Password verified using `bcryptjs` (salt rounds: 10).
   - Issues short-lived pre-auth JWT tokens.

2. **Layer 2: Dual Two-Factor Authentication (TOTP Authenticator App & SMS OTP Gateway)**
   - **Google Authenticator (TOTP)**: Time-based One-Time Passwords compatible with Google Authenticator, Microsoft Authenticator, and Authy (`otplib` + `qrcode`).
   - **SMS OTP Gateway**: 6-digit numeric OTPs dispatched via standard HTTP API SMS gateway with cooldown timer and phone masking (`utils/smsService.js`).
   - **Emergency Backup Codes**: 8 pre-generated alphanumeric emergency recovery codes (`XXXX-XXXX`) for account recovery.

3. **Layer 3: Network Layer IP & Device Whitelisting (3FA)**
   - Extracts client IPs across proxy headers (`X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`, socket).
   - Verifies against an array of authorized IP addresses and subnets (`allowed_ips`).
   - Automatically drops and blocks unauthorized networks with `403 Forbidden` before login processing.

### Auth API Endpoints
- `POST /api/auth/login`: Step 1 login (checks credentials and IP rules, returns `two_factor_required` + `temp_token` + `phone_masked`).
- `POST /api/auth/send-sms-otp`: Dispatches a 6-digit verification code via the SMS gateway.
- `POST /api/auth/verify-2fa`: Step 2 validation (verifies Authenticator TOTP token, SMS OTP code, or emergency backup recovery code).
- `POST /api/auth/phone`: Updates admin security phone number and preferred default 2FA method (`totp` vs `sms`).
- `POST /api/auth/setup-2fa`: Generates new TOTP secret, QR code data URL, and 8 emergency backup codes.
- `POST /api/auth/confirm-2fa`: Validates initial 6-digit OTP to officially activate 2FA on the admin account.
- `POST /api/auth/disable-2fa`: Disables 2FA with password confirmation.
- `GET / POST /api/auth/ip-whitelist`: Inspects and updates 3FA allowed IP addresses and toggle status.
- `GET /api/auth/me`: Retrieves current session profile, IP address, and security configuration.

---

## 🚀 Running the Vendor Server

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma Schema
npm run prisma:push

# 3. Build & Run
npm run build
npm run start # Runs on http://localhost:3001
```

