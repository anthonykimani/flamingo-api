# Identity Service Documentation

## Overview

The Identity Service manages user accounts, authentication, profiles, and payment methods. It runs on port 3001 and provides HTTP REST API endpoints.

**Service Name:** `identity-service`
**Port:** 3001
**Entry Point:** [identity/service/index.ts](../../../identity/service/index.ts)

## Responsibilities

1. **User Management**
   - User registration and account creation
   - Profile management
   - Account status tracking (enabled/disabled/deleted)

2. **Authentication**
   - Password hashing with bcrypt
   - JWT token generation
   - Account lockout mechanism
   - Two-factor authentication support

3. **Payment Methods**
   - Payment method configuration
   - Support for M-Pesa and bank accounts
   - Multiple payment methods per user

4. **Notification Preferences**
   - User notification settings
   - Online/offline status tracking

5. **Cryptographic Keys**
   - Private/public key storage
   - RSA keypair management
   - Mnemonic phrase storage
   - Blockchain address storage

## Architecture

```
identity/service/
├── index.ts                    # Entry point, server initialization
├── configs/
│   ├── ormconfig.ts           # TypeORM database configuration
│   ├── corsconfig.ts          # CORS settings
│   └── apiconfig.ts           # API configuration
├── models/
│   └── user.entity.ts         # User entity (comprehensive)
├── repositories/
│   └── user.repo.ts           # User data access
├── controllers/
│   ├── controller.ts          # Base controller
│   └── user.controller.ts     # User endpoints
├── routes/
│   └── index.users.ts         # User routes
├── enums/
│   ├── UserRole.ts            # PLAYER, HOST, ADMIN
│   ├── OnboardType.ts         # NEW, RESTORE
│   ├── RegistrationStatus.ts # Phone/email confirmation status
│   ├── PaymentMethod.ts       # M-Pesa
│   ├── PaymentProvider.ts    # Safaricom, banks
│   ├── PaymentProviderType.ts # Mobile, Bank, Paybill
│   └── NotificationSetting.ts # Status notifications
├── interfaces/
│   ├── IResponse.ts           # API response format
│   ├── IProfile.ts            # User profile & address
│   ├── IPaymentMethod.ts      # Payment method structure
│   └── INotificationSetting.ts # Notification preferences
└── utils/
    ├── validators/
    │   └── validator.ts       # Input validation
    ├── format/
    │   └── format.ts          # Date/time formatting
    └── shared/
        └── Http.ts            # HTTP client for external APIs
```

## User Entity

**File:** [identity/service/models/user.entity.ts](../../../identity/service/models/user.entity.ts)

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `address` | string | Blockchain/unique address (unique) |
| `email` | string | Email address (unique, lowercase) |
| `username` | string | Username (unique) |
| `password` | text | Bcrypt hashed password |
| `firstname` | string | First name |
| `middlename` | string | Middle name |
| `lastname` | string | Last name |
| `fullname` | string | Full display name |
| `phoneNumber` | string | Phone number |
| `role` | UserRole | PLAYER/HOST/ADMIN |

### Account Security

| Field | Type | Description |
|-------|------|-------------|
| `twoFactorEnabled` | boolean | 2FA enabled |
| `lockoutEnabled` | boolean | Account lockout enabled |
| `lockoutEndDateUtc` | Date | Lockout expiration |
| `accessFailedCount` | number | Failed login attempts |
| `regKey` | text | JWT registration key |
| `disabled` | boolean | Account disabled |
| `deleted` | boolean | Soft delete flag |

### Profile & Account

| Field | Type | Description |
|-------|------|-------------|
| `profile` | IProfile | User preferences (JSON) |
| `account` | IAddress | Cryptographic keys (JSON) |
| `onboardType` | OnboardType | NEW or RESTORE |

### Status Tracking

| Field | Type | Description |
|-------|------|-------------|
| `registered` | boolean | Registration complete |
| `phoneNumberConfirmed` | boolean | Phone verified |
| `emailConfirmed` | boolean | Email verified |
| `phoneNumberConfirmStatus` | RegistrationStatus | Phone confirmation state |
| `emailConfirmStatus` | RegistrationStatus | Email confirmation state |

### Complex Objects (JSON Columns)

#### IProfile
```typescript
{
  username: string;
  languageCode: string;
  currencyCode: string;
  shareAnalytics: boolean;
  viewAddressInfo: boolean;
  imgPath?: string;
  paymentMethod: IPaymentMethod[];
  notifications: INotificationSetting[];
}
```

#### IAddress (account field)
```typescript
{
  privateKey: string;
  publicKey: string;
  address: string;
  mnemonic: string;
  rsaPrivate: string;
  rsaPublic: string;
}
```

## User Repository

**File:** [identity/service/repositories/user.repo.ts](../../../identity/service/repositories/user.repo.ts)

### Methods

#### `saveUser(user: User): Promise<User | undefined>`
Creates new user or updates existing.

**New User Initialization:**
- Generates UUID
- Hashes password with bcrypt
- Creates JWT regKey
- Sets default profile (shareAnalytics: true, viewAddressInfo: false)
- Initializes empty payment methods and notifications
- Normalizes email to lowercase

**Configuration:**
- Salt rounds from env: `SALT_ROUNDS`
- JWT secret: `TOKEN_SECRET`
- JWT issuer: `TOKEN_ISSUER`
- JWT expiry: `TOKEN_EXPIRY`

#### `getAll(user?: User, skip?: number, take?: number): Promise<User[]>`
Returns all users or filtered by criteria.

**Filter Fields:**
- `id`, `email`, `firstname`, `lastname`, `address`

**Ordering:** `created DESC`

**Pagination:** Optional `skip`/`take`

#### `getUserById(id: string): Promise<User | null>`
Retrieves single user by UUID.

#### `hashPassword(password: string, saltRounds?: number): Promise<string>`
Bcrypt password hashing utility.

## User Controller

**File:** [identity/service/controllers/user.controller.ts](../../../identity/service/controllers/user.controller.ts)

### Endpoints

#### `POST /users` - List Users
Get users with optional filtering.

**Request Body:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "address": "0x..."
}
```

**Response:**
```json
{
  "status": 200,
  "message": "OK",
  "data": [{ user objects }]
}
```

#### `POST /users/user` - Get User by ID
Retrieve single user.

**Request Body:**
```json
{
  "id": "uuid"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "OK",
  "data": { user object }
}
```

#### `POST /users/add` - Create User
Register new user account.

**Request Body:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+254712345678",
  "address": "0x...",
  "profile": { ... },
  "account": { privateKey, publicKey, ... },
  "onboardType": "NEW",
  "countryCode": "+254"
}
```

**Validation:**
- `firstname` required
- `lastname` required

**Response:**
```json
{
  "status": 200,
  "message": "OK",
  "data": { created user }
}
```

## Enums

### UserRole
```typescript
PLAYER = 'player'   // Default role
HOST = 'host'
ADMIN = 'admin'
```

### OnboardType
```typescript
NEW = 'NEW'         // New account
RESTORE = 'RESTORE' // Restore existing
```

### RegistrationStatus
```typescript
INITIATED = "initiated"
PENDING = "pending"
COMPLETED = "completed"
EXPIRED = "expired"
```

### PaymentMethod
```typescript
MPESA = "M-Pesa"
```

### PaymentProvider (Kenya-Focused)
```typescript
SAFARICOM = "Safaricom Kenya"
AIRTEL_KENYA = "Airtel Kenya"
TELKOM_KENYA = "Telkom Kenya"
EQUITY_BANK = "Equity"
IM_BANK = "I&M Bank"
KCB_BANK = "KCB Bank"
```

### PaymentProviderType
```typescript
MOBILE = "Mobile"
BANK = "Bank"
PAYBILL = "Paybill"
```

### NotificationSetting
```typescript
OFFLINE = "Player currently offline"
ONLINE = "Player currently online"
IN_LOBBY = "Player in a waiting room"
IN_GAME = "Player is in a Game"
IDLE = "Player is idle"
```

## Utilities

### Validator

**File:** [identity/service/utils/validators/validator.ts](../../../identity/service/utils/validators/validator.ts)

```typescript
Validator.isValidUser(user: User): string[]
```

**Current Validations:**
- `firstname` required
- `lastname` required

**Returns:** Array of error messages (empty if valid)

### Format

**File:** [identity/service/utils/format/format.ts](../../../identity/service/utils/format/format.ts)

```typescript
Format.getCurrentTimestamp(): number
```

Returns Unix timestamp in milliseconds using Luxon.

### HTTP Client

**File:** [identity/service/utils/shared/Http.ts](../../../identity/service/utils/shared/Http.ts)

```typescript
Http.post(url: string, data: any): Promise<IResponse>
Http.get(url: string): Promise<IResponse>
Http.delete(url: string, data: any): Promise<IResponse>
```

Axios-based HTTP client for external APIs.

## Payment Methods

### IPaymentMethod Interface

```typescript
{
  id: string;
  method: PaymentMethod | string;
  description: string;
  provider: PaymentProvider | string;
  providerType: PaymentProviderType;
  businessNumber: string;
  accountNumber: string;
  accountName: string;
  created: Date;
  code?: string;
}
```

### Supported Providers

**Mobile Money:**
- Safaricom M-Pesa
- Airtel Kenya
- Telkom Kenya

**Banks:**
- Equity Bank
- I&M Bank
- KCB Bank

## Security Features

### Password Security
- Bcrypt hashing with configurable salt rounds
- Async hashing for performance
- Default: 10 salt rounds

### Account Lockout
- Configurable via `lockoutEnabled`
- Track failed attempts: `accessFailedCount`
- Lockout expiration: `lockoutEndDateUtc`

### Email Normalization
```typescript
email: email.toLowerCase()
```

Prevents duplicate accounts with different casing.

### Soft Delete
```typescript
deleted: boolean  // Default: false
```

Preserves data for analytics and audit trails.

## Configuration

### Environment Variables

```bash
# Server
PORT=3001
SERVICE_NAME=identity-service
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=flamingo_identity

# Authentication
TOKEN_SECRET=your-secret-key
TOKEN_ISSUER=flamingo
TOKEN_EXPIRY=24h
SALT_ROUNDS=10

# Locale
DEFAULT_COUNTRY_CODE=+254
```

### Database Configuration

**File:** [identity/service/configs/ormconfig.ts](../../../identity/service/configs/ormconfig.ts)

```typescript
{
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  synchronize: true,  // Development only
  logging: false
}
```

## Dependencies

```json
{
  "bcrypt": "^5.1.1",            // Password hashing
  "cors": "^2.8.5",              // CORS
  "dotenv": "^16.4.7",           // Environment vars
  "express": "^4.21.2",          // Web framework
  "jsonwebtoken": "^9.0.2",      // JWT tokens
  "luxon": "^3.6.0",             // Date/time
  "pg": "^8.14.1",               // PostgreSQL
  "reflect-metadata": "^0.2.2",  // Decorators
  "typeorm": "^0.3.21"           // ORM
}
```

## API Response Format

All endpoints return:

```typescript
{
  status: number,    // HTTP status code
  message: string,   // Status message
  data: any,         // Response payload
  errors?: string[]  // Optional error array
}
```

**Base Controller:** [identity/service/controllers/controller.ts](../../../identity/service/controllers/controller.ts)

## Regional Focus

### Kenya-Centric Features
- M-Pesa integration
- Kenyan mobile networks (Safaricom, Airtel, Telkom)
- Kenyan banks (Equity, I&M, KCB)
- Phone number format: `+254...`

## Future Enhancements

### Not Yet Implemented
- [ ] JWT authentication middleware
- [ ] Password reset flow
- [ ] Email verification
- [ ] Phone number verification
- [ ] OAuth providers
- [ ] Rate limiting
- [ ] Input validation expansion
- [ ] Password strength requirements
- [ ] Session management
- [ ] User roles authorization

## Next Steps

- Review [User Entity](./01-models.md) for complete field reference
- Study [User Repository](./02-repositories.md) for data access patterns
- Check [API Endpoints](../../api/04-user-endpoints.md) for integration
- See [Getting Started](../../overview/04-getting-started.md) for setup
