# Flamingo API - Quick Reference

**For Coding Agents:** Fast lookup guide for common tasks and locations.

## Project Structure

```
flamingo-api/
├── game/                         # Game Service (Port 3000)
│   └── service/
│       ├── index.ts              # Entry: HTTP + Socket.IO server
│       ├── configs/              # DB, CORS, API config
│       ├── models/               # 6 entities (Game, Player, Quiz, etc.)
│       ├── repositories/         # Data access (6 repos)
│       ├── controllers/          # Business logic (6 controllers)
│       ├── routes/               # API routes (5 files)
│       ├── enums/                # GameState, SocketEvents
│       ├── interfaces/           # IGame, IQuiz, IResponse
│       └── utils/
│           ├── socket/           # SocketService (singleton)
│           ├── contracts/        # FlamingoEscrowService (singleton)
│           └── abi/              # Smart contract ABIs
├── identity/                     # Identity Service (Port 3001)
│   └── service/
│       ├── index.ts              # Entry: HTTP server
│       ├── configs/              # DB, CORS, API config
│       ├── models/               # User entity
│       ├── repositories/         # UserRepository
│       ├── controllers/          # UserController
│       ├── routes/               # User routes
│       ├── enums/                # UserRole, PaymentMethod, etc.
│       ├── interfaces/           # IProfile, IPaymentMethod
│       └── utils/                # Validators, formatters, HTTP
└── docs/                         # This documentation
```

---

## Common File Locations

### Configuration Files

| Purpose | Game Service | Identity Service |
|---------|-------------|------------------|
| Database | `game/service/configs/ormconfig.ts` | `identity/service/configs/ormconfig.ts` |
| CORS | `game/service/configs/corsconfig.ts` | `identity/service/configs/corsconfig.ts` |
| API Config | `game/service/configs/apiconfig.ts` | `identity/service/configs/apiconfig.ts` |
| Environment | `.env.development` / `.env.production` | `.env.development` / `.env.production` |
| TypeScript | `game/tsconfig.json` | `identity/tsconfig.json` |
| Dependencies | `game/package.json` | `identity/package.json` |

### Core Services

| Service | File | Pattern |
|---------|------|---------|
| Socket.IO Manager | `game/service/utils/socket/app.socket.manager.ts` | Singleton |
| Blockchain Escrow | `game/service/utils/contracts/flamingo.escrow.ts` | Singleton |
| HTTP Client | `identity/service/utils/shared/Http.ts` | Static utility |

### Entity Files

| Entity | Location |
|--------|----------|
| Game | `game/service/models/game.entity.ts` |
| Player | `game/service/models/player.entity.ts` |
| Quiz | `game/service/models/quiz.entity.ts` |
| Question | `game/service/models/question.entity.ts` |
| Answer | `game/service/models/answer.entity.ts` |
| PlayerAnswer | `game/service/models/player-answer.entity.ts` |
| User | `identity/service/models/user.entity.ts` |

---

## API Endpoints Quick Reference

### Game Service (Port 3000)

#### Games (`/games`)
```
POST   /games/create-session              # Create game from quiz
GET    /games/session/:sessionId          # Get game details
GET    /games/gamepin/:gamePin            # Find game by PIN
POST   /games/start/:sessionId            # Start game (locks deposits)
PUT    /games/update/:sessionId           # Update game state
POST   /games/submit-answer               # Submit player answer
GET    /games/leaderboard/:sessionId      # Get leaderboard
GET    /games/player-stats/:sessionId/:playerName  # Player stats
POST   /games/end/:sessionId              # End game (distribute prizes)
DELETE /games/session/:sessionId          # Delete game
```

#### Quizzes (`/quizzes`)
```
GET    /quizzes                           # List all quizzes
GET    /quizzes/quiz/:id                  # Get quiz by ID
POST   /quizzes/createQuiz                # Create quiz manually
POST   /quizzes/createAgentQuiz           # AI-generate quiz
```

#### Players (`/players`)
```
POST   /players/createPlayer              # Register player to game
GET    /players                           # List all players
GET    /players/:id                       # Get player by ID
PUT    /players/update-stats              # Update player stats
GET    /players/leaderboard/:sessionId    # Session leaderboard
DELETE /players/remove/:sessionId/:playerName  # Remove player
```

#### Questions (`/questions`)
```
GET    /questions                         # List questions
GET    /questions/:id                     # Get question by ID
POST   /questions/add                     # Add question to quiz
```

#### Answers (`/answers`)
```
GET    /answers                           # List answers
GET    /answers/:id                       # Get answer by ID
POST   /answers/add                       # Add answer option
```

### Identity Service (Port 3001)

#### Users (`/users`)
```
POST   /users                             # Get user list (with filter)
POST   /users/user                        # Get user by ID
POST   /users/add                         # Create new user
```

---

## WebSocket Events (Socket.IO)

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-game` | `{ gameSessionId, playerName, walletAddress }` | Player joins game |
| `leave-game` | `{ gameSessionId, playerName }` | Player leaves |
| `start-game` | `{ gameSessionId }` | Host starts game |
| `next-question` | `{ gameSessionId, questionIndex }` | Move to next question |
| `submit-answer` | `{ gameSessionId, playerName, questionId, answerId, timeToAnswer }` | Submit answer |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player-joined` | `{ playerName, players, totalPlayers }` | New player joined |
| `player-left` | `{ playerName, players }` | Player left |
| `game-started` | `{ gameSessionId, message }` | Game starting |
| `countdown-tick` | `{ count, gameSessionId }` | Countdown (3, 2, 1) |
| `question-started` | `{ question, questionIndex, duration, startTime }` | New question |
| `time-update` | `{ timeLeft, gameSessionId }` | Timer tick (every 1s) |
| `player-answered` | `{ playerName, answeredCount, totalPlayers }` | Someone answered |
| `answer-submitted` | `{ success, isCorrect, pointsEarned, totalScore }` | Answer result |
| `question-results` | `{ leaderboard, gameSessionId }` | Question ended |
| `game-ended` | `{ leaderboard, message }` | Game complete |
| `prizes-distributed` | `{ message, txHash }` | Prizes sent |
| `error` | `{ message }` | Error occurred |

**Implementation:** [game/service/utils/socket/app.socket.manager.ts](../game/service/utils/socket/app.socket.manager.ts)

---

## Database Schema Quick Reference

### Entity Relationships

```
Quiz (1) ─┬──→ (Many) Question (1) ───→ (Many) Answer
          │
          └──→ (Many) Game (1) ─┬───→ (Many) Player
                                 │
                                 └───→ (Many) PlayerAnswer
```

### Key Tables

| Table | Primary Key | Unique Constraints | Soft Delete |
|-------|-------------|-------------------|-------------|
| `quiz` | `id` (UUID) | - | Yes (`deleted`) |
| `question` | `id` (UUID) | - | Yes |
| `answer` | `id` (UUID) | - | Yes |
| `game` | `id` (UUID) | `gamePin` | Yes |
| `player` | `id` (UUID) | - | Yes |
| `player_answer` | `id` (UUID) | - | Yes |
| `user` | `id` (UUID) | `address`, `email`, `username` | Yes |

---

## Common Code Patterns

### Creating a Game Session

```typescript
// 1. Controller receives request
POST /games/create-session { quizId: "uuid" }

// 2. GameController.createSession()
const repo = new GameRepository();
const game = await repo.createSession(quizId);

// 3. GameRepository.createSession()
- Generate unique 6-digit PIN
- Create Game entity with quiz reference
- Save to database
- Return game object
```

**Files:**
- Controller: [game/service/controllers/game.controller.ts](../game/service/controllers/game.controller.ts)
- Repository: [game/service/repositories/game.repo.ts](../game/service/repositories/game.repo.ts)

### Handling Player Join

```typescript
// 1. Client emits Socket.IO event
socket.emit('join-game', { gameSessionId, playerName, walletAddress })

// 2. SocketService.handleJoinGame()
- Validate game exists and is active
- Check wallet address provided
- Create/update Player entity
- Join Socket.IO room (gameSessionId)
- Broadcast 'player-joined' to room

// 3. All clients receive update
socket.on('player-joined', ({ playerName, totalPlayers }) => {
  // Update UI
})
```

**File:** [game/service/utils/socket/app.socket.manager.ts](../game/service/utils/socket/app.socket.manager.ts:handleJoinGame)

### Scoring Calculation

```typescript
// Location: SocketService.handleSubmitAnswer()

const basePoints = 100;
const streakBonus = currentStreak * 50;
const timeBonusRatio = (questionDuration - timeToAnswer) / questionDuration;
const timeBonus = Math.max(0, Math.min(50, timeBonusRatio * 50));

const totalPoints = isCorrect ? basePoints + streakBonus + timeBonus : 0;

// Update player stats atomically
await playerRepo.updatePlayerStats(playerId, {
  totalScore: totalScore + totalPoints,
  correctAnswers: correctAnswers + (isCorrect ? 1 : 0),
  wrongAnswers: wrongAnswers + (isCorrect ? 0 : 1),
  currentStreak: isCorrect ? currentStreak + 1 : 0,
  bestStreak: Math.max(bestStreak, newStreak)
});
```

**File:** [game/service/utils/socket/app.socket.manager.ts](../game/service/utils/socket/app.socket.manager.ts:handleSubmitAnswer)

### Blockchain Integration

```typescript
// Lock deposits on game start
const { txHash, blockNumber } = await flamingoEscrowService.createGameSession(
  gameSessionId,
  playerWallets  // Array of player addresses
);

await gameRepo.updateBlockchainInfo(gameSessionId, {
  lockTxHash: txHash,
  isLocked: true,
  lockedAt: new Date()
});

// Distribute prizes on game end
const winners = leaderboard.slice(0, 3).map(p => p.walletAddress);
const { txHash } = await flamingoEscrowService.distributePrizes(
  gameSessionId,
  winners
);

await gameRepo.updateBlockchainInfo(gameSessionId, {
  distributeTxHash: txHash,
  isPaidOut: true,
  distributedAt: new Date()
});
```

**Files:**
- Service: [game/service/utils/contracts/flamingo.escrow.ts](../game/service/utils/contracts/flamingo.escrow.ts)
- Socket Handler: [game/service/utils/socket/app.socket.manager.ts](../game/service/utils/socket/app.socket.manager.ts)
- Repository: [game/service/repositories/game.repo.ts](../game/service/repositories/game.repo.ts)

---

## Environment Variables

### Game Service

```bash
# Required
PORT=3000
SERVICE_NAME=game-service
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=flamingo_game
VIEM_PRIVATE_KEY=0x...              # Backend signer
ESCROW_CONTRACT_ADDRESS=0x...       # FlamingoEscrow
USDC_CONTRACT_ADDRESS=0x...         # USDC token

# Optional
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
OPENAI_API_KEY=sk-...               # For AI quiz generation
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### Identity Service

```bash
# Required
PORT=3001
SERVICE_NAME=identity-service
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=flamingo_identity
TOKEN_SECRET=your-secret-key
SALT_ROUNDS=10

# Optional
NODE_ENV=development
TOKEN_ISSUER=flamingo
TOKEN_EXPIRY=24h
DEFAULT_COUNTRY_CODE=+254
```

---

## Running the Services

### Development Mode

```bash
# Terminal 1: Game Service
cd game
npm install
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Identity Service
cd identity
npm install
npm run dev
# Runs on http://localhost:3001
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start with PM2 (recommended)
pm2 start dist/index.js --name game-service
pm2 start dist/index.js --name identity-service
```

---

## Common Tasks

### Add a New Game Endpoint

1. **Define route:** `game/service/routes/index.games.ts`
   ```typescript
   router.post('/my-endpoint', GameController.myMethod);
   ```

2. **Add controller method:** `game/service/controllers/game.controller.ts`
   ```typescript
   static async myMethod(req: Request, res: Response) {
     const repo = new GameRepository();
     const result = await repo.myRepoMethod();
     return res.json(Controller.response(Controller._200, result));
   }
   ```

3. **Add repository method:** `game/service/repositories/game.repo.ts`
   ```typescript
   async myRepoMethod() {
     return this.repository.find({ where: { ... } });
   }
   ```

### Add a Socket Event

1. **Define event:** `game/service/enums/SocketEvents.ts`
   ```typescript
   MY_EVENT = 'my-event'
   ```

2. **Add handler:** `game/service/utils/socket/app.socket.manager.ts`
   ```typescript
   socket.on(SocketEvents.MY_EVENT, async (data) => {
     // Handle event
     io.to(gameSessionId).emit(SocketEvents.MY_EVENT_RESPONSE, result);
   });
   ```

### Create AI Quiz

```bash
curl -X POST http://localhost:3000/quizzes/createAgentQuiz \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a 5-question quiz about TypeScript"}'
```

**Implementation:** [game/service/controllers/quiz.controller.ts](../game/service/controllers/quiz.controller.ts:addAgentQuiz)

---

## Debugging Tips

### Enable Socket.IO Debug Logs

```bash
DEBUG=socket.io* npm run dev
```

### Check Database Connection

```typescript
// In ormconfig.ts
logging: true,  // Enable SQL query logging
```

### Test Blockchain Connection

```typescript
const info = await flamingoEscrowService.getContractAddresses();
console.log(info);
// { escrow: '0x...', usdc: '0x...', chain: 'baseSepolia', ... }
```

### View Game State

```bash
curl http://localhost:3000/games/session/{sessionId}
```

---

## Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| Game PIN Length | 6 digits | GameRepository |
| Max PIN Retries | 10 | GameRepository |
| Base Points | 100 | SocketService |
| Streak Multiplier | 50 | SocketService |
| Max Time Bonus | 50 | SocketService |
| Countdown Duration | 3 seconds | SocketService |
| Default Question Duration | 10 seconds | Configurable |
| Min Players for Start | 3 | SocketService |
| Top Winners (prizes) | 3 | SocketService, EscrowService |

---

## Next Steps

- [Full Documentation](./README.md) - Complete documentation index
- [Architecture](./overview/02-architecture.md) - System design
- [Game Service](./services/game/) - Core gameplay
- [API Reference](./api/) - Complete endpoint docs
- [Database Schema](./database/) - Entity relationships
