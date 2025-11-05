# Tech Stack

## Overview

Flamingo is built with modern TypeScript/Node.js technologies, emphasizing real-time communication, blockchain integration, and type safety.

## Core Technologies

### Runtime & Language

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Node.js** | 18+ | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **TypeScript** | 5.8.2 | Type-safe JavaScript | [typescriptlang.org](https://www.typescriptlang.org) |
| **ts-node** | 10.9.2 | TypeScript execution | [npmjs.com/package/ts-node](https://www.npmjs.com/package/ts-node) |

**Configuration Files:**
- [game/tsconfig.json](../../game/tsconfig.json)
- [identity/tsconfig.json](../../identity/tsconfig.json)

---

### Web Framework

| Technology | Version | Purpose | Usage |
|------------|---------|---------|-------|
| **Express.js** | 4.21.2 | HTTP server framework | Both services |
| **CORS** | 2.8.5 | Cross-origin resource sharing | Both services |

**Key Features:**
- RESTful API routing
- Middleware pipeline
- JSON body parsing
- Static file serving (optional)

**Entry Points:**
- Game: [game/service/index.ts](../../game/service/index.ts:18)
- Identity: [identity/service/index.ts](../../identity/service/index.ts:10)

---

### Real-Time Communication

| Technology | Version | Purpose | Service |
|------------|---------|---------|---------|
| **Socket.IO** | 4.8.1 | WebSocket server | Game Service |

**Capabilities:**
- Bi-directional event-based communication
- Room-based broadcasting
- Automatic reconnection
- HTTP long-polling fallback

**Implementation:**
- [game/service/utils/socket/app.socket.manager.ts](../../game/service/utils/socket/app.socket.manager.ts)
- Singleton pattern
- Game session rooms (one room per game)
- Timer management for countdowns and questions

**Events:**
- Defined in [game/service/enums/SocketEvents.ts](../../game/service/enums/SocketEvents.ts)
- 20+ event types
- Type-safe event handling

---

### Database & ORM

| Technology | Version | Purpose | Services |
|------------|---------|---------|----------|
| **PostgreSQL** | 15+ | Relational database | Both |
| **TypeORM** | 0.3.21 | Object-Relational Mapping | Both |
| **pg** | 8.14.1 | PostgreSQL driver | Both |
| **reflect-metadata** | 0.2.2 | Decorator support | Both |

**Features Used:**
- Entity decorators (`@Entity`, `@Column`, `@ManyToOne`, etc.)
- Repository pattern
- Query builder
- Migrations (planned)
- Relations (one-to-many, many-to-one)
- Cascade operations
- Soft deletes

**Configuration:**
- Game: [game/service/configs/ormconfig.ts](../../game/service/configs/ormconfig.ts)
- Identity: [identity/service/configs/ormconfig.ts](../../identity/service/configs/ormconfig.ts)

**Entities:**
- Game Service: 6 entities (Game, Player, Quiz, Question, Answer, PlayerAnswer)
- Identity Service: 1 entity (User)

---

### Blockchain Integration

| Technology | Version | Purpose | Service |
|------------|---------|---------|---------|
| **Viem** | 2.38.5 | Ethereum client library | Game Service |

**Why Viem?**
- Modern alternative to ethers.js/web3.js
- TypeScript-first design
- Tree-shakeable (smaller bundle size)
- Better type inference
- Modular architecture

**Features Used:**
- Contract interaction (read/write)
- Transaction signing
- ABI encoding/decoding
- Address validation
- Message hashing (keccak256)
- Custom transport configuration

**Network:**
- Base Sepolia (testnet)
- Chain ID: 84532
- RPC: Base Sepolia public RPC

**Contracts:**
- **FlamingoEscrow:** Game escrow logic
- **USDC:** ERC20 token for payments

**Implementation:**
- [game/service/utils/contracts/flamingo.escrow.ts](../../game/service/utils/contracts/flamingo.escrow.ts)
- ABI: [game/service/utils/abi/flamingo-escrow.ts](../../game/service/utils/abi/flamingo-escrow.ts)

---

### AI & Machine Learning

| Technology | Version | Purpose | Service |
|------------|---------|---------|---------|
| **OpenAI Agents** | 0.1.10 | AI quiz generation | Game Service |
| **Zod** | 3.25.76 | Schema validation | Game Service |

**OpenAI Agents Features:**
- Structured output generation
- Schema-based validation
- Retry logic
- Token usage tracking

**Use Case:**
Quiz generation with constraints:
- 4-option multiple choice
- Exactly one correct answer
- Customizable number of questions
- Topic-based generation

**Implementation:**
- [game/service/controllers/quiz.controller.ts](../../game/service/controllers/quiz.controller.ts:addAgentQuiz)
- Zod schema defines quiz structure
- Validates AI output before saving

**Example Zod Schema:**
```typescript
const quizSchema = z.object({
  title: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    answers: z.array(z.object({
      answer: z.string(),
      correctAnswer: z.boolean()
    }))
  }))
});
```

---

### Security & Authentication

| Technology | Version | Purpose | Service |
|------------|---------|---------|---------|
| **bcrypt** | 5.1.1 | Password hashing | Identity Service |
| **jsonwebtoken** | 9.0.2 | JWT token generation | Identity Service |

**bcrypt Usage:**
- Password hashing before storage
- Configurable salt rounds (from env)
- Async hashing for performance

**JWT Usage:**
- Registration key generation
- Token-based authentication (planned)
- Configurable expiry

**Configuration:**
- `SALT_ROUNDS` environment variable
- `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_EXPIRY`

**Files:**
- [identity/service/repositories/user.repo.ts](../../identity/service/repositories/user.repo.ts:hashPassword)

---

### Utilities

| Technology | Version | Purpose | Services |
|------------|---------|---------|----------|
| **Luxon** | 3.6.0 | Date/time manipulation | Both |
| **Axios** | 1.11.0 | HTTP client | Game Service |
| **Mustache** | 4.2.0 | Template engine | Game Service |
| **dotenv** | 16.4.7 | Environment variables | Both |

**Luxon:**
- Modern alternative to Moment.js
- Timezone-aware operations
- Immutable date objects
- Used for timestamp generation

**Axios:**
- HTTP client for external APIs
- Wrapped in [identity/service/utils/shared/Http.ts](../../identity/service/utils/shared/Http.ts)

**Mustache:**
- Email template rendering
- Templates: [game/service/utils/templates/email/](../../game/service/utils/templates/email/)

**dotenv:**
- Loads `.env.${NODE_ENV}` files
- Environment-specific configuration

---

## Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **nodemon** | - | Auto-restart on file changes |
| **Mocha** | 11.1.0 | Testing framework |

**npm Scripts:**
```json
{
  "dev": "NODE_ENV=development nodemon -w './**/*.ts' --exec 'ts-node' service/index.ts",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

**Development Workflow:**
1. Edit TypeScript files
2. nodemon detects changes
3. ts-node compiles and executes
4. Server restarts automatically

---

## Type Definitions

All packages include TypeScript type definitions:

```json
"devDependencies": {
  "@types/bcrypt": "^5.0.2",
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "@types/jsonwebtoken": "^9.0.9",
  "@types/luxon": "^3.4.2",
  "@types/mocha": "^10.0.10",
  "@types/node": "^22.13.13"
}
```

**Benefits:**
- IDE autocomplete
- Compile-time error detection
- Better code documentation
- Refactoring safety

---

## Package Management

**Package Manager:** npm

**Lock File:** package-lock.json (not committed to this repo)

**Installation:**
```bash
# Game service
cd game && npm install

# Identity service
cd identity && npm install
```

---

## Architecture Alignment

### Game Service Dependencies

**Real-Time Gaming:**
- Socket.IO for live multiplayer
- TypeORM for persistent state
- Viem for blockchain prizes

**AI Content:**
- OpenAI Agents for quiz generation
- Zod for output validation

**Utility:**
- Express for HTTP API
- Luxon for timestamps
- Axios for external calls

### Identity Service Dependencies

**User Management:**
- TypeORM for user storage
- bcrypt for password security
- JWT for tokens

**Utility:**
- Express for HTTP API
- Luxon for timestamps

---

## Version Compatibility

### Node.js
- **Required:** 18+
- **Reason:** ES modules, native fetch, crypto

### PostgreSQL
- **Required:** 15+
- **Reason:** JSONB performance, advanced indexing

### TypeScript
- **Version:** 5.8.2
- **Features Used:** Decorators, strict mode, ES2022

---

## Missing Technologies

**Not Currently Used:**
- Redis (for distributed caching)
- Message queue (RabbitMQ, Kafka)
- API Gateway
- Service mesh
- Monitoring (Prometheus, Grafana)
- Logging service (Winston, Morgan)
- Testing (Jest, Supertest)

**Recommendations:**
- Add Redis for Socket.IO adapter (horizontal scaling)
- Implement Winston for structured logging
- Add Jest for unit/integration tests
- Consider API Gateway for routing

---

## Technology Decisions

### Why TypeScript?
- Type safety reduces runtime errors
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why Socket.IO over Native WebSockets?
- Automatic reconnection
- Room support
- Fallback to HTTP long-polling
- Better browser compatibility

### Why Viem over ethers.js?
- Modern TypeScript-first design
- Better tree-shaking
- Improved type inference
- Active development

### Why TypeORM?
- Decorator-based entities
- TypeScript support
- Active Record + Repository patterns
- Migration support

### Why OpenAI Agents over Direct API?
- Structured output
- Built-in validation
- Retry logic
- Better error handling

---

## Environment Variables Summary

### Game Service
```bash
# Server
PORT=3000
SERVICE_NAME=game-service
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=flamingo_game

# CORS
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# AI
OPENAI_API_KEY=sk-...

# Blockchain
VIEM_PRIVATE_KEY=0x...
ESCROW_CONTRACT_ADDRESS=0x...
USDC_CONTRACT_ADDRESS=0x...
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### Identity Service
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

# Auth
TOKEN_SECRET=your-secret-key
TOKEN_ISSUER=flamingo
TOKEN_EXPIRY=24h
SALT_ROUNDS=10

# Locale
DEFAULT_COUNTRY_CODE=+254
```

---

## Dependency Graph

```
Game Service
├─ express (web framework)
├─ socket.io (real-time)
├─ typeorm (database ORM)
│  ├─ pg (PostgreSQL driver)
│  └─ reflect-metadata (decorators)
├─ viem (blockchain)
├─ @openai/agents (AI)
│  └─ zod (validation)
├─ luxon (date/time)
├─ axios (HTTP client)
└─ dotenv (env vars)

Identity Service
├─ express (web framework)
├─ typeorm (database ORM)
│  ├─ pg (PostgreSQL driver)
│  └─ reflect-metadata (decorators)
├─ bcrypt (password hashing)
├─ jsonwebtoken (JWT)
├─ luxon (date/time)
└─ dotenv (env vars)
```

---

## Next Steps

- [Getting Started](./04-getting-started.md) - Setup instructions
- [Game Service](../services/game/) - Implementation details
- [Deployment](../deployment/) - Production setup
