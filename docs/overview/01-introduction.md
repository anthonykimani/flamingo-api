# Project Introduction

## What is Flamingo?

Flamingo is a real-time multiplayer quiz platform that combines the engaging gameplay of Kahoot with blockchain-based entry fees and prize distributions. Players compete in live quiz sessions, with cryptocurrency deposits locked in smart contracts and prizes automatically distributed to top performers.

## Project Name & Purpose

**Name:** Flamingo API (flamingo-api)

**Purpose:** Backend services powering a decentralized quiz gaming platform with:
- Real-time multiplayer gameplay
- Blockchain-secured deposits and payouts
- AI-powered quiz generation
- User identity management
- Comprehensive analytics

## Repository Information

- **Location:** `/home/priest/flamingo/flamingo-api`
- **Git Branch:** `ft-escrow-contract`
- **Main Branch:** `main`
- **Repository Status:** Clean (no uncommitted changes)

### Recent Commits
1. `df592ac` - fix: replaces websockets with http
2. `aeed14e` - feat: remodels game, player entities + escrow service
3. `5af7119` - feat: adds escrow abi, creates flamingo escrow service
4. `0f20fad` - refactor: removes hardhat setup

## Architecture Overview

Flamingo is built as a **microservices architecture** with two independent services:

### 1. Game Service (Port 3000)
Handles all quiz gameplay functionality:
- Game session management
- Real-time WebSocket communication
- Quiz and question CRUD operations
- Player management and scoring
- Blockchain escrow integration
- Live leaderboards and analytics

**Key Technologies:**
- Express.js for HTTP API
- Socket.IO for real-time events
- TypeORM for database access
- Viem for blockchain interaction
- OpenAI Agents for AI quiz generation

### 2. Identity Service (Port 3001)
Manages user accounts and authentication:
- User registration and profiles
- Payment method configuration
- Notification preferences
- Cryptographic key storage
- Account security (lockout, 2FA)

**Key Technologies:**
- Express.js for HTTP API
- TypeORM for database access
- Bcrypt for password hashing
- JWT for token generation

## Core Capabilities

### Real-Time Gameplay
- Synchronized question timers across all players
- Live answer submissions with instant feedback
- Real-time leaderboard updates
- WebSocket-based event broadcasting

### Blockchain Integration
- Smart contract escrow on Base Sepolia testnet
- USDC-based entry fees
- Automated prize distribution to top 3 players
- Transaction tracking and verification

### Scoring System
- Base points: 100 per correct answer
- Streak bonus: current streak × 50
- Speed bonus: up to 50 points based on answer time
- Streak resets on incorrect answers

### Quiz Management
- Manual quiz creation with questions and answers
- AI-powered quiz generation via OpenAI
- Published/unpublished quiz states
- Question ordering and numbering

### Analytics
- Player performance statistics
- Answer distribution analysis
- Question difficulty metrics
- Fastest answer tracking
- Session summaries

## Target Use Cases

1. **Educational Platforms:** Interactive learning with gamification
2. **Corporate Training:** Team-based knowledge assessment
3. **Entertainment:** Trivia competitions with prizes
4. **Tournaments:** Competitive quiz events with rankings
5. **Web3 Gaming:** Blockchain-backed skill-based gaming

## Development Status

### Implemented Features
- ✅ Complete game session lifecycle
- ✅ Real-time WebSocket communication
- ✅ Blockchain escrow integration
- ✅ Scoring with streaks and time bonuses
- ✅ AI quiz generation
- ✅ User account management
- ✅ Payment method configuration
- ✅ Comprehensive analytics

### Architecture Patterns
- ✅ Repository pattern for data access
- ✅ Singleton pattern for services
- ✅ Event-driven real-time updates
- ✅ Soft delete for data retention
- ✅ Cascade relationships
- ✅ Atomic transaction updates

### Recent Changes
The project recently transitioned from WebSocket-only communication to HTTP endpoints for most operations, with WebSockets reserved for real-time game events. The escrow service was integrated to handle blockchain deposits and prize distributions.

## File Organization

```
flamingo-api/
├── game/
│   ├── package.json              # Dependencies: socket.io, viem, openai
│   └── service/
│       ├── index.ts              # Entry point, server initialization
│       ├── configs/              # Database, CORS, API configuration
│       ├── controllers/          # Business logic (game, quiz, player)
│       ├── models/               # TypeORM entities (6 entities)
│       ├── repositories/         # Data access layer (6 repositories)
│       ├── routes/               # API endpoints (5 route files)
│       ├── enums/                # Constants (GameState, SocketEvents)
│       ├── interfaces/           # TypeScript types (IGame, IQuiz, etc.)
│       └── utils/
│           ├── socket/           # Socket.IO manager (singleton)
│           ├── contracts/        # Blockchain escrow service
│           ├── abi/              # Smart contract ABIs
│           ├── validators/       # Input validation
│           ├── format/           # Data formatting
│           ├── shared/           # HTTP utilities
│           └── templates/        # Email templates
├── identity/
│   ├── package.json              # Dependencies: bcrypt, jsonwebtoken
│   └── service/
│       ├── index.ts              # Entry point
│       ├── configs/              # Configuration files
│       ├── controllers/          # User controller
│       ├── models/               # User entity
│       ├── repositories/         # User repository
│       ├── routes/               # User routes
│       ├── enums/                # User roles, payment enums
│       ├── interfaces/           # IProfile, IPaymentMethod, etc.
│       └── utils/
│           ├── validators/       # User validation
│           ├── format/           # Date/time formatting
│           └── shared/           # HTTP client
├── readme.md                     # Main project README
└── docs/                         # This documentation
```

## Key Concepts

### Game Pin
A 6-digit unique number generated for each game session, used by players to join games.

### Game States
Games progress through states: `CREATED` → `WAITING` → `COUNTDOWN` → `IN_PROGRESS` → `RESULTS_READY` → `PAYOUT` → `COMPLETED`

### Escrow Flow
1. Players deposit entry fees to smart contract
2. Game starts, deposits are locked
3. Game completes, backend signs distribution message
4. Smart contract distributes prizes to top 3 players

### Player Streaks
Consecutive correct answers build a streak multiplier, increasing points earned. Incorrect answers reset the streak to zero.

### Socket Rooms
Each game session creates a Socket.IO room identified by `gameSessionId`, allowing efficient broadcasting to all participants.

## Environment

- **Platform:** Linux (WSL2)
- **Node.js:** 18+
- **Database:** PostgreSQL 15+
- **Blockchain:** Base Sepolia Testnet
- **Development Mode:** Uses nodemon with ts-node for hot reload

## Next Steps

To understand the system:
1. Review [Architecture Overview](./02-architecture.md) for system design
2. Explore [Tech Stack](./03-tech-stack.md) for technology details
3. Follow [Getting Started](./04-getting-started.md) for setup instructions
4. Study [Game Service](../services/game/) for core gameplay logic
5. Reference [API Documentation](../api/) for endpoint integration
