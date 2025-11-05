# Architecture Overview

## System Architecture

Flamingo uses a **microservices architecture** with two independent services communicating via HTTP and sharing a PostgreSQL database infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │    Admin     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ├────────────────────┼────────────────────┤
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Optional)                  │
└─────────────────────────────────────────────────────────────┘
           │                                        │
    ┌──────┴──────┐                         ┌──────┴──────┐
    │ HTTP + WS   │                         │    HTTP     │
    ▼             ▼                         ▼             ▼
┌──────────────────────┐              ┌──────────────────────┐
│   GAME SERVICE       │              │  IDENTITY SERVICE    │
│   (Port 3000)        │              │   (Port 3001)        │
│                      │              │                      │
│  ┌────────────────┐  │              │  ┌────────────────┐  │
│  │  Controllers   │  │              │  │  Controllers   │  │
│  └────────────────┘  │              │  └────────────────┘  │
│  ┌────────────────┐  │              │  ┌────────────────┐  │
│  │  Repositories  │  │              │  │  Repositories  │  │
│  └────────────────┘  │              │  └────────────────┘  │
│  ┌────────────────┐  │              │  ┌────────────────┐  │
│  │ Socket Manager │  │              │  │   Validators   │  │
│  └────────────────┘  │              │  └────────────────┘  │
│  ┌────────────────┐  │              └──────────────────────┘
│  │ Escrow Service │  │                         │
│  └────────────────┘  │                         │
└──────────────────────┘                         │
           │                                     │
           │                                     │
    ┌──────┴──────┐                      ┌──────┴──────┐
    ▼             ▼                      ▼             ▼
┌──────────┐  ┌──────────┐         ┌──────────┐  ┌──────────┐
│PostgreSQL│  │Blockchain│         │PostgreSQL│  │ External │
│ Database │  │  (Base)  │         │ Database │  │   APIs   │
└──────────┘  └──────────┘         └──────────┘  └──────────┘
```

## Service Breakdown

### Game Service

**Purpose:** Core gameplay, real-time communication, blockchain integration

**Components:**
- **HTTP API:** RESTful endpoints for game/quiz/player operations
- **WebSocket Server:** Socket.IO for real-time events
- **Repositories:** Data access layer (6 repositories)
- **Socket Manager:** Event-driven game flow orchestration (singleton)
- **Escrow Service:** Blockchain integration via Viem (singleton)
- **Controllers:** Business logic for game, quiz, player, question, answer
- **Routes:** API endpoint definitions

**External Dependencies:**
- PostgreSQL database (TypeORM)
- Base Sepolia blockchain (smart contracts)
- OpenAI API (quiz generation)

**Entry Point:** [game/service/index.ts](../../game/service/index.ts)

### Identity Service

**Purpose:** User management, authentication, profiles

**Components:**
- **HTTP API:** RESTful user endpoints
- **Repository:** User data access
- **Controllers:** User operations
- **Validators:** Input validation
- **Utilities:** Password hashing, JWT generation, HTTP client

**External Dependencies:**
- PostgreSQL database (TypeORM)
- JWT for tokens
- Bcrypt for passwords

**Entry Point:** [identity/service/index.ts](../../identity/service/index.ts)

## Layered Architecture

Both services follow a **layered architecture pattern**:

```
┌─────────────────────────────────────┐
│         PRESENTATION LAYER           │
│  (Routes, HTTP Handlers, WebSockets)│
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        BUSINESS LOGIC LAYER         │
│         (Controllers)               │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│       DATA ACCESS LAYER             │
│        (Repositories)               │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        PERSISTENCE LAYER            │
│    (TypeORM Entities, PostgreSQL)  │
└─────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. Presentation Layer
- **Routes:** Define API endpoints and map to controllers
- **WebSockets:** Handle Socket.IO connections and events
- **Middleware:** CORS, JSON parsing, error handling

**Example:** [game/service/routes/index.games.ts](../../game/service/routes/index.games.ts)

#### 2. Business Logic Layer
- **Controllers:** Process requests, validate input, coordinate operations
- **Validation:** Ensure data integrity before persistence
- **Response Formatting:** Standardize API responses

**Example:** [game/service/controllers/game.controller.ts](../../game/service/controllers/game.controller.ts)

#### 3. Data Access Layer
- **Repositories:** Abstract database operations
- **Query Building:** Construct TypeORM queries
- **Data Transformation:** Map between entities and DTOs

**Example:** [game/service/repositories/game.repo.ts](../../game/service/repositories/game.repo.ts)

#### 4. Persistence Layer
- **Entities:** TypeORM models defining schema
- **Relationships:** One-to-many, many-to-one mappings
- **Database:** PostgreSQL for storage

**Example:** [game/service/models/game.entity.ts](../../game/service/models/game.entity.ts)

## Design Patterns

### 1. Repository Pattern
**Purpose:** Separate data access logic from business logic

**Implementation:**
- Each entity has a dedicated repository class
- Repositories encapsulate TypeORM operations
- Controllers depend on repositories, not direct database access

**Example:**
```typescript
// game/service/repositories/game.repo.ts
export class GameRepository {
  private repository = AppDataSource.getRepository(Game);

  async getSessionById(id: string): Promise<Game | null> {
    return this.repository.findOne({
      where: { id, deleted: false },
      relations: ['quiz', 'players']
    });
  }
}
```

### 2. Singleton Pattern
**Purpose:** Ensure single instance of critical services

**Implementations:**
- **SocketService:** Single WebSocket server instance
  - File: [game/service/utils/socket/app.socket.manager.ts](../../game/service/utils/socket/app.socket.manager.ts)
  - Manages all game rooms and timers

- **FlamingoEscrowService:** Single blockchain client
  - File: [game/service/utils/contracts/flamingo.escrow.ts](../../game/service/utils/contracts/flamingo.escrow.ts)
  - Maintains blockchain connection and signer

**Example:**
```typescript
export class SocketService {
  private static instance: SocketService;

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }
}
```

### 3. Event-Driven Architecture
**Purpose:** Real-time updates and loose coupling

**Implementation:**
- Socket.IO events trigger game state changes
- Broadcast pattern for multiplayer synchronization
- Event handlers in SocketService orchestrate game flow

**Event Flow Example:**
```
Player submits answer
    ↓
SUBMIT_ANSWER event
    ↓
SocketService.handleSubmitAnswer()
    ↓
Update player stats (repository)
    ↓
Broadcast PLAYER_ANSWERED to room
    ↓
All clients receive update
```

### 4. Soft Delete Pattern
**Purpose:** Data retention and audit trails

**Implementation:**
- Entities have `deleted: boolean` field
- Queries filter `deleted: false`
- Preserves historical data for analytics

### 5. Cascade Operations
**Purpose:** Maintain referential integrity

**Implementation:**
- Quiz deletion cascades to questions, answers, games
- Game deletion cascades to players and player answers
- Configured in TypeORM entity decorators

### 6. Controller as Service
**Purpose:** Stateless request handling

**Implementation:**
- Static methods for all operations
- No instance state
- Standardized response formatting via base Controller class

## Communication Patterns

### HTTP REST API
**Protocol:** HTTP/1.1
**Format:** JSON
**Authentication:** None (planned for future)

**Endpoints:**
- `/games/*` - Game session operations
- `/quizzes/*` - Quiz CRUD
- `/players/*` - Player management
- `/questions/*` - Question operations
- `/answers/*` - Answer options
- `/users/*` - User accounts

### WebSocket (Socket.IO)
**Protocol:** WebSocket (with HTTP long-polling fallback)
**Format:** JSON events
**Namespace:** Default (`/`)

**Event Types:**
- **Client → Server:** `join-game`, `leave-game`, `start-game`, `submit-answer`, `next-question`
- **Server → Client:** `player-joined`, `game-started`, `question-started`, `time-update`, `question-results`, `game-ended`

**Room Structure:**
- Room ID = `gameSessionId` (UUID)
- All players in same game join same room
- Broadcasts target specific rooms

### Database Access
**ORM:** TypeORM
**Pattern:** Active Record + Repository
**Connection:** PostgreSQL connection pool

**Configuration:**
- Game Service: [game/service/configs/ormconfig.ts](../../game/service/configs/ormconfig.ts)
- Identity Service: [identity/service/configs/ormconfig.ts](../../identity/service/configs/ormconfig.ts)

### Blockchain Interaction
**Library:** Viem 2.x
**Network:** Base Sepolia (testnet)
**Pattern:** Contract interaction via ABI

**Smart Contracts:**
- **FlamingoEscrow:** Game deposit and prize distribution
- **USDC:** ERC20 token for payments

**Operations:**
- Read: Query game state, player deposits
- Write: Lock deposits, distribute prizes, cancel games

## Data Flow Diagrams

### Game Creation Flow
```
Client Request
    ↓
POST /games/create-session { quizId }
    ↓
GameController.createSession()
    ↓
GameRepository.createSession()
    ├─ Generate unique 6-digit PIN
    ├─ Create Game entity
    └─ Link to Quiz
    ↓
Save to PostgreSQL
    ↓
Return { gamePin, id, status }
```

### Player Join Flow
```
Client Connection
    ↓
Socket.IO 'join-game' event
    ↓
SocketService.handleJoinGame()
    ├─ Validate game exists
    ├─ Check wallet address provided
    ├─ Create/update Player entity
    └─ Join Socket.IO room
    ↓
Broadcast 'player-joined' to room
    ↓
All clients update player list
```

### Game Start Flow
```
Host triggers start
    ↓
Socket.IO 'start-game' event
    ↓
SocketService.handleStartGame()
    ├─ Validate 3+ players with wallets
    ├─ Call FlamingoEscrowService.createGameSession()
    │   ├─ Hash UUID to bytes32
    │   ├─ Call smart contract
    │   └─ Return transaction hash
    ├─ Save lockTxHash to Game
    └─ Set status = WAITING
    ↓
Broadcast 'game-started' to room
    ↓
Start 3-second countdown
    ↓
Broadcast 'countdown-tick' (3, 2, 1)
    ↓
Start first question
```

### Answer Submission Flow
```
Player submits answer
    ↓
Socket.IO 'submit-answer' event
    ↓
SocketService.handleSubmitAnswer()
    ├─ Validate not already answered
    ├─ Check if answer is correct
    ├─ Calculate points (base + streak + time)
    ├─ Update player stats (atomic)
    ├─ Save PlayerAnswer record
    └─ Mark hasAnsweredCurrent = true
    ↓
Emit 'answer-submitted' to player
    ↓
Broadcast 'player-answered' to room
```

### Game End Flow
```
Last question times out
    ↓
SocketService.endGame()
    ├─ Set status = COMPLETED
    ├─ Get final leaderboard (top 3)
    ├─ Call FlamingoEscrowService.distributePrizes()
    │   ├─ Sign distribution message
    │   ├─ Call smart contract
    │   └─ Return transaction hash
    ├─ Save distributeTxHash to Game
    └─ Mark isPaidOut = true
    ↓
Broadcast 'game-ended' with leaderboard
    ↓
Broadcast 'prizes-distributed' (if blockchain succeeds)
```

## Scalability Considerations

### Current Architecture
- **Single-server deployment** (both services on same machine)
- **Shared PostgreSQL** instance
- **In-memory timers** (not distributed)
- **Socket.IO rooms** (single process)

### Scaling Strategies

#### Horizontal Scaling
**Challenges:**
- Socket.IO rooms don't sync across processes
- Timers stored in-memory (per process)
- No session affinity

**Solutions:**
- Redis adapter for Socket.IO (cross-process rooms)
- Redis for distributed timer storage
- Load balancer with sticky sessions

#### Database Scaling
- Read replicas for analytics queries
- Connection pooling (already configured)
- Query optimization with indexes

#### Blockchain Scaling
- Queue system for transaction submissions
- Retry logic for failed transactions
- Gas price optimization

## Security Architecture

### Authentication
**Current:** None implemented
**Planned:** JWT-based authentication with Identity Service

### Authorization
**Current:** None implemented
**Planned:** Role-based access control (PLAYER, HOST, ADMIN)

### Data Protection
- Passwords hashed with bcrypt (Identity Service)
- Private keys stored in database (encrypted recommended)
- CORS configuration restricts origins

### Blockchain Security
- Backend signs distribution messages (prevents unauthorized payouts)
- Smart contract validates signatures
- Transaction hash validation (regex pattern)

### Input Validation
- Type validation via TypeScript
- Controller-level validation
- Validator utilities (limited implementation)

## Configuration Management

### Environment Variables
Each service loads `.env.${NODE_ENV}` file

**Game Service Variables:**
- `PORT`, `SERVICE_NAME`, `NODE_ENV`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `FRONTEND_URL`, `ALLOWED_ORIGINS`
- `OPENAI_API_KEY`
- Blockchain: `VIEM_PRIVATE_KEY`, `ESCROW_CONTRACT_ADDRESS`, `USDC_CONTRACT_ADDRESS`

**Identity Service Variables:**
- `PORT`, `SERVICE_NAME`, `NODE_ENV`
- Database credentials
- `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_EXPIRY`
- `SALT_ROUNDS`, `DEFAULT_COUNTRY_CODE`

### CORS Configuration
- Configured in `configs/corsconfig.ts`
- Allows specific origins from env vars
- Credentials support enabled

## Deployment Architecture

### Development
```
├─ Game Service (nodemon + ts-node)
│  └─ Port 3000
├─ Identity Service (nodemon + ts-node)
│  └─ Port 3001
└─ PostgreSQL (local)
   └─ Port 5432
```

### Production (Recommended)
```
┌─────────────────────────────────────┐
│         Load Balancer               │
└─────────────────────────────────────┘
           │            │
    ┌──────┴──────┐    └──────────────┐
    │             │                   │
┌───────┐    ┌───────┐          ┌───────┐
│ Game  │    │ Game  │          │ Ident │
│ Svc 1 │    │ Svc 2 │          │ Svc   │
└───────┘    └───────┘          └───────┘
     │            │                  │
     └────────────┼──────────────────┘
                  │
          ┌───────┴────────┐
          │   PostgreSQL   │
          │   (Primary)    │
          └────────────────┘
                  │
          ┌───────┴────────┐
          │   PostgreSQL   │
          │  (Read Replica)│
          └────────────────┘
```

## Technology Integration Points

### OpenAI Integration
- File: [game/service/controllers/quiz.controller.ts](../../game/service/controllers/quiz.controller.ts:addAgentQuiz)
- Uses OpenAI Agents SDK
- Zod schema validation
- Generates 4-option multiple choice quizzes

### Blockchain Integration
- File: [game/service/utils/contracts/flamingo.escrow.ts](../../game/service/utils/contracts/flamingo.escrow.ts)
- Viem client for Base Sepolia
- Smart contract ABI: [game/service/utils/abi/flamingo-escrow.ts](../../game/service/utils/abi/flamingo-escrow.ts)
- Backend signer account required

### Socket.IO Integration
- File: [game/service/utils/socket/app.socket.manager.ts](../../game/service/utils/socket/app.socket.manager.ts)
- CORS configured via `allowedOrigins`
- Connection/disconnection handlers
- Room-based broadcasting

## Next Steps

For deeper understanding:
- [Data Flow](./02-data-flow.md) - Detailed flow diagrams
- [Design Patterns](../architecture/03-design-patterns.md) - Pattern implementations
- [Game Service](../services/game/) - Core gameplay architecture
- [Database Schema](../database/01-schema-overview.md) - Entity relationships
