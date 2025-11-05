# Game Service Documentation

## Overview

The Game Service is the core of Flamingo, handling all quiz gameplay functionality, real-time communication, and blockchain integration. It runs on port 3000 and provides both HTTP REST API and WebSocket interfaces.

**Service Name:** `core-service` (package name)
**Port:** 3000
**Entry Point:** [game/service/index.ts](../../../game/service/index.ts)

## Responsibilities

1. **Game Session Management**
   - Create/start/end game sessions
   - Generate unique game PINs
   - Track game state and progress

2. **Real-Time Communication**
   - WebSocket server for live events
   - Player join/leave notifications
   - Question timers and countdowns
   - Answer submissions and results

3. **Quiz Management**
   - CRUD operations for quizzes
   - AI-powered quiz generation
   - Question and answer management

4. **Player Management**
   - Player registration to games
   - Score tracking and leaderboards
   - Answer history and analytics

5. **Blockchain Integration**
   - Entry fee deposits (USDC)
   - Prize distribution to winners
   - Transaction tracking

## Architecture

```
game/service/
├── index.ts                    # Entry point, server initialization
├── configs/
│   ├── ormconfig.ts           # TypeORM database configuration
│   ├── corsconfig.ts          # CORS settings
│   └── apiconfig.ts           # API configuration
├── models/                     # TypeORM entities (6 entities)
│   ├── game.entity.ts         # Game session
│   ├── player.entity.ts       # Player in game
│   ├── quiz.entity.ts         # Quiz template
│   ├── question.entity.ts     # Quiz question
│   ├── answer.entity.ts       # Answer option
│   └── player-answer.entity.ts # Player's answer submission
├── repositories/               # Data access layer (6 repositories)
│   ├── game.repo.ts           # Game operations
│   ├── player.repo.ts         # Player operations
│   ├── quiz.repo.ts           # Quiz operations
│   ├── question.repo.ts       # Question operations
│   ├── answers.repo.ts        # Answer operations
│   └── player-answer.repo.ts  # Answer analytics
├── controllers/                # Business logic (6 controllers)
│   ├── controller.ts          # Base controller with response helpers
│   ├── game.controller.ts     # Game endpoints
│   ├── player.controller.ts   # Player endpoints
│   ├── quiz.controller.ts     # Quiz endpoints (+ AI generation)
│   ├── question.controller.ts # Question endpoints
│   └── answer.controller.ts   # Answer endpoints
├── routes/                     # API route definitions (5 route files)
│   ├── index.games.ts         # /games routes
│   ├── index.players.ts       # /players routes
│   ├── index.quizzes.ts       # /quizzes routes
│   ├── index.questions.ts     # /questions routes
│   └── index.answers.ts       # /answers routes
├── enums/                      # Constants and types
│   ├── GameState.ts           # Game state enum
│   ├── SocketEvents.ts        # Socket event names
│   ├── SocketEmit.ts          # Socket emit events
│   └── Template.ts            # Email template names
├── interfaces/                 # TypeScript interfaces
│   ├── IResponse.ts           # API response format
│   ├── IGame.ts               # Game type definitions
│   ├── IQuiz.ts               # Quiz type definitions
│   └── IEscrow.ts             # Escrow info interface
└── utils/                      # Utilities and helpers
    ├── socket/                 # Socket.IO management
    │   └── app.socket.manager.ts  # Singleton socket service
    ├── contracts/              # Blockchain integration
    │   └── flamingo.escrow.ts  # Escrow service (singleton)
    ├── abi/                    # Smart contract ABIs
    │   └── flamingo-escrow.ts  # FlamingoEscrow ABI
    ├── validators/             # Input validation
    ├── format/                 # Data formatting
    ├── shared/                 # Shared utilities (HTTP)
    ├── exceptions/             # Custom exceptions
    └── templates/              # Email templates
        └── email/
```

## Documentation Sections

### 1. [Models & Entities](./01-models.md)
Complete documentation of all 6 database entities:
- Game entity (game sessions)
- Player entity (participants)
- Quiz entity (quiz templates)
- Question entity (quiz questions)
- Answer entity (answer options)
- PlayerAnswer entity (answer submissions)

Includes:
- Entity structure and fields
- Relationships and cascades
- Blockchain integration fields
- Soft delete patterns

### 2. [Repositories](./02-repositories.md)
Data access layer documentation:
- Repository pattern implementation
- CRUD operations
- Complex queries (leaderboards, analytics)
- Blockchain state management
- Transaction handling

### 3. [Controllers](./03-controllers.md)
Business logic layer documentation:
- Controller architecture
- Endpoint handlers
- Request validation
- Response formatting
- Error handling
- AI quiz generation

### 4. [Socket Manager](./04-socket-manager.md)
Real-time communication documentation:
- SocketService singleton
- Event handlers (20+ events)
- Room management
- Timer management (countdowns, questions)
- Game flow orchestration
- Broadcasting patterns

### 5. [Blockchain Escrow](./05-escrow-service.md)
Blockchain integration documentation:
- FlamingoEscrowService singleton
- Smart contract interaction
- Deposit locking
- Prize distribution
- Transaction tracking
- Error handling

### 6. [Enums & Interfaces](./06-enums-interfaces.md)
Type definitions and constants:
- GameState enum (8 states)
- SocketEvents enum (20+ events)
- Interface definitions
- Type contracts

## Key Features

### Game Flow
1. **Creation:** Quiz → GameRepository.createSession() → Unique PIN
2. **Waiting:** Players join via Socket.IO → Player entities created
3. **Start:** Blockchain locks deposits → Countdown begins
4. **Play:** Questions with timers → Players submit answers → Scores update
5. **End:** Final leaderboard → Prizes distributed → Transaction saved

### Scoring Algorithm
```typescript
// Base points for correct answer
const basePoints = 100;

// Streak bonus (resets on wrong answer)
const streakBonus = currentStreak * 50;

// Time bonus (faster = more points, max 50)
const timeBonus = ((questionDuration - timeToAnswer) / questionDuration) * 50;

// Total (wrong answers get 0)
const totalPoints = isCorrect ? basePoints + streakBonus + timeBonus : 0;
```

### Blockchain Integration Points
1. **Game Start:** `flamingoEscrowService.createGameSession()`
   - Locks player deposits
   - Returns transaction hash
   - Saves to Game.lockTxHash

2. **Game End:** `flamingoEscrowService.distributePrizes()`
   - Signs distribution message
   - Distributes to top 3 players
   - Returns transaction hash
   - Saves to Game.distributeTxHash

### Real-Time Events
```typescript
// Client → Server
'join-game'     // Player joins
'start-game'    // Host starts
'submit-answer' // Player answers
'next-question' // Move to next

// Server → Client
'player-joined'     // Broadcast new player
'game-started'      // Game beginning
'countdown-tick'    // 3, 2, 1
'question-started'  // New question with timer
'time-update'       // Every second
'player-answered'   // Someone answered
'question-results'  // Question ended, show scores
'game-ended'        // Game complete
```

## Technical Patterns

### Singleton Services
- **SocketService:** Single WebSocket server instance
- **FlamingoEscrowService:** Single blockchain client

### Repository Pattern
- Abstract database operations
- Encapsulate TypeORM queries
- Separate data access from business logic

### Event-Driven Architecture
- Socket.IO for real-time updates
- Event handlers orchestrate game flow
- Room-based broadcasting for multiplayer

### Soft Deletes
- Entities have `deleted: boolean` flag
- Queries filter `deleted: false`
- Preserves data for analytics

### Cascade Operations
- Quiz deletion cascades to questions, answers, games
- Game deletion cascades to players, player answers
- Maintains referential integrity

## Dependencies

```json
{
  "@openai/agents": "^0.1.10",   // AI quiz generation
  "axios": "^1.11.0",            // HTTP client
  "bcrypt": "^5.1.1",            // Password hashing
  "cors": "^2.8.5",              // CORS middleware
  "dotenv": "^16.4.7",           // Environment variables
  "express": "^4.21.2",          // Web framework
  "jsonwebtoken": "^9.0.2",      // JWT tokens
  "luxon": "^3.6.0",             // Date/time
  "mustache": "^4.2.0",          // Templates
  "pg": "^8.14.1",               // PostgreSQL driver
  "reflect-metadata": "^0.2.2",  // Decorators
  "socket.io": "^4.8.1",         // WebSocket server
  "typeorm": "^0.3.21",          // ORM
  "viem": "^2.38.5",             // Blockchain client
  "zod": "^3.25.76"              // Schema validation
}
```

## Environment Configuration

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

## API Endpoints

### Game Routes (`/games`)
- `POST /games/create-session` - Create game from quiz
- `GET /games/session/:sessionId` - Get game details
- `GET /games/gamepin/:gamePin` - Get game by PIN
- `POST /games/start/:sessionId` - Start game
- `PUT /games/update/:sessionId` - Update game state
- `POST /games/submit-answer` - Submit player answer
- `GET /games/leaderboard/:sessionId` - Get leaderboard
- `GET /games/player-stats/:sessionId/:playerName` - Player stats
- `POST /games/end/:sessionId` - End game
- `DELETE /games/session/:sessionId` - Delete game

### Quiz Routes (`/quizzes`)
- `GET /quizzes` - List all quizzes
- `GET /quizzes/quiz/:id` - Get quiz by ID
- `POST /quizzes/createQuiz` - Create quiz
- `POST /quizzes/createAgentQuiz` - AI-generate quiz

### Player Routes (`/players`)
- `POST /players/createPlayer` - Register player to game
- `GET /players` - List all players
- `GET /players/:id` - Get player by ID
- `PUT /players/update-stats` - Update player stats
- `GET /players/leaderboard/:sessionId` - Session leaderboard
- `DELETE /players/remove/:sessionId/:playerName` - Remove player

### Question Routes (`/questions`)
- `GET /questions` - List questions
- `GET /questions/:id` - Get question by ID
- `POST /questions/add` - Add question

### Answer Routes (`/answers`)
- `GET /answers` - List answers
- `GET /answers/:id` - Get answer by ID
- `POST /answers/add` - Add answer option

## WebSocket Events

See [Socket Manager documentation](./04-socket-manager.md) for complete event reference.

## Database Schema

Game service manages 6 entities:
- **Quiz** (1) → (Many) **Question**
- **Question** (1) → (Many) **Answer**
- **Quiz** (1) → (Many) **Game**
- **Game** (1) → (Many) **Player**
- **Game** (1) → (Many) **PlayerAnswer**
- **Question** (1) → (Many) **PlayerAnswer**
- **Answer** (1) → (Many) **PlayerAnswer**

See [Database documentation](../../database/01-schema-overview.md) for complete schema.

## Next Steps

- [Models & Entities](./01-models.md) - Database entities
- [Repositories](./02-repositories.md) - Data access layer
- [Controllers](./03-controllers.md) - Business logic
- [Socket Manager](./04-socket-manager.md) - Real-time communication
- [Blockchain Escrow](./05-escrow-service.md) - Smart contract integration
