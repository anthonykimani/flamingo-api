# Quiz Game Backend - Real-Time Multiplayer Quiz Platform

A robust Node.js backend service powering a real-time multiplayer quiz game similar to Kahoot. Built with Express.js, Socket.IO, TypeORM, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [WebSocket Events](#websocket-events)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Functionality
- 🎮 **Real-time Multiplayer Gaming** - Synchronized gameplay for unlimited players
- ⏱️ **Server-Controlled Timing** - Authoritative timer ensures fair play
- 🏆 **Dynamic Scoring System** - Points based on correctness, speed, and streaks
- 📊 **Live Leaderboards** - Real-time score updates and rankings
- 🎯 **Quiz Management** - Create, edit, and manage quiz content
- 🤖 **AI Quiz Generation** - OpenAI-powered quiz creation
- 💾 **Persistent Storage** - Full game history and analytics

### Technical Features
- 🔌 **WebSocket Communication** - Socket.IO for real-time events
- 🗄️ **PostgreSQL Database** - Reliable data persistence with TypeORM
- 🔐 **Input Validation** - Comprehensive request validation
- 📝 **Comprehensive Logging** - Detailed application logs
- 🚀 **Scalable Architecture** - Modular design for easy scaling

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4.x | Web framework |
| Socket.IO | 4.x | WebSocket server |
| TypeScript | 5.x | Type safety |
| TypeORM | 0.3.x | ORM for database |
| PostgreSQL | 15+ | Primary database |
| OpenAI API | - | AI quiz generation |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v15 or higher)
- **Git**

Optional but recommended
- **Docker** (for containerized deployment)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd quiz-game-backend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Set Up Database

```bash
# Create database
createdb quizgame

# Run migrations
npm run typeorm migration:run
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
SERVICE_NAME=quiz-game-service

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=quizgame

# ============================================
# FRONTEND CONFIGURATION
# ============================================
FRONTEND_URL=http://localhost:3001

# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# ============================================
# OPENAI CONFIGURATION (for AI quiz generation)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key

# ============================================
# GAME SETTINGS (optional)
# ============================================
DEFAULT_QUESTION_DURATION=10
MAX_PLAYERS_PER_GAME=100
```

### Environment Variable Descriptions

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | `quizgame` |
| `FRONTEND_URL` | Frontend application URL | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | - |

---

## 🗄️ Database Setup

### Using PostgreSQL

#### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

#### 2. Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE quizgame;

# Create user (if needed)
CREATE USER quizuser WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE quizgame TO quizuser;

# Exit
\q
```

#### 3. Run Migrations

```bash
# Generate migration (if schema changed)
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert last migration (if needed)
npm run typeorm migration:revert
```

### Database Schema Overview

```
quizzes
├── id (UUID, PK)
├── title
├── description
└── questions (1:N)
    ├── id (UUID, PK)
    ├── question
    ├── questionNumber
    └── answers (1:N)
        ├── id (UUID, PK)
        ├── answer
        └── correctAnswer

games
├── id (UUID, PK)
├── gamePin (6-digit, unique)
├── quiz_id (FK)
├── status (enum)
├── currentQuestionIndex
└── players (1:N)
    ├── id (UUID, PK)
    ├── playerName
    ├── totalScore
    └── player_answers (1:N)
        ├── id (UUID, PK)
        ├── question_id (FK)
        ├── selected_answer_id (FK)
        ├── isCorrect
        └── pointsEarned
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Run with hot reload
npm run dev

# Run with debug logging
DEBUG=* npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or use PM2
pm2 start dist/server.js --name quiz-api
```

### Using Docker

```bash
# Build image
docker build -t quiz-game-backend .

# Run container
docker run -p 3000:3000 --env-file .env quiz-game-backend

# Or use docker-compose
docker-compose up -d
```

---

## 📁 Project Structure

```
quiz-game-backend/
├── src/
│   ├── config/
│   │   └── database.config.ts       # Database configuration
│   ├── controllers/
│   │   ├── game.controller.ts       # Game endpoints
│   │   ├── quiz.controller.ts       # Quiz endpoints
│   │   └── player.controller.ts     # Player endpoints
│   ├── entities/
│   │   ├── Game.entity.ts           # Game model
│   │   ├── Quiz.entity.ts           # Quiz model
│   │   ├── Question.entity.ts       # Question model
│   │   ├── Answer.entity.ts         # Answer model
│   │   ├── Player.entity.ts         # Player model
│   │   └── PlayerAnswer.entity.ts   # Answer submission model
│   ├── repositories/
│   │   ├── game.repository.ts       # Game data access
│   │   ├── quiz.repository.ts       # Quiz data access
│   │   ├── player.repository.ts     # Player data access
│   │   └── answer.repository.ts     # Answer data access
│   ├── services/
│   │   └── socket.service.ts        # WebSocket service (Singleton)
│   ├── routes/
│   │   ├── game.routes.ts           # Game routes
│   │   ├── quiz.routes.ts           # Quiz routes
│   │   └── player.routes.ts         # Player routes
│   ├── enums/
│   │   ├── game-state.enum.ts       # Game state enum
│   │   └── socket-events.enum.ts    # Socket event names
│   ├── middleware/
│   │   ├── error.middleware.ts      # Error handling
│   │   └── validation.middleware.ts # Request validation
│   ├── utils/
│   │   ├── logger.ts                # Logging utility
│   │   └── response.ts              # Response formatter
│   ├── app.ts                       # Express app setup
│   └── server.ts                    # Server entry point
├── migrations/                       # Database migrations
├── .env                             # Environment variables
├── .env.example                     # Example env file
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
└── README.md                        # This file
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Game Endpoints

#### Create Game Session
```http
POST /games/create-session
Content-Type: application/json

{
    "quizId": "uuid"
}

Response: 200 OK
{
    "status": 200,
    "data": {
        "id": "uuid",
        "gamePin": "123456",
        "status": "created",
        "isActive": true
    }
}
```

#### Get Game by PIN
```http
GET /games/gamepin/:gamePin

Response: 200 OK
{
    "status": 200,
    "data": {
        "id": "uuid",
        "gamePin": "123456",
        "quiz": {...},
        "players": [...]
    }
}
```

#### Get Game Session
```http
GET /games/session/:sessionId

Response: 200 OK
{
    "status": 200,
    "data": {
        "id": "uuid",
        "currentQuestionIndex": 0,
        "status": "waiting",
        "timeLeft": 10
    }
}
```

#### Start Game
```http
POST /games/start/:sessionId
Content-Type: application/json

{
    "gameState": "in_progress"
}

Response: 200 OK
```

#### Get Leaderboard
```http
GET /games/leaderboard/:sessionId

Response: 200 OK
{
    "status": 200,
    "data": [
        {
            "playerName": "Alice",
            "totalScore": 850,
            "correctAnswers": 7
        }
    ]
}
```

#### End Game
```http
POST /games/end/:sessionId

Response: 200 OK
```

### Quiz Endpoints

#### Create Quiz
```http
POST /quizzes/createQuiz
Content-Type: application/json

{
    "title": "JavaScript Basics",
    "questions": [
        {
            "questionNumber": 1,
            "question": "What is a closure?",
            "answers": [
                {"answer": "...", "correctAnswer": true},
                {"answer": "...", "correctAnswer": false},
                {"answer": "...", "correctAnswer": false},
                {"answer": "...", "correctAnswer": false}
            ]
        }
    ]
}

Response: 200 OK
```

#### Get All Quizzes
```http
GET /quizzes

Response: 200 OK
{
    "status": 200,
    "data": [...]
}
```

#### Get Quiz by ID
```http
GET /quizzes/quiz/:id

Response: 200 OK
{
    "status": 200,
    "data": {
        "id": "uuid",
        "title": "...",
        "questions": [...]
    }
}
```

#### Create AI Quiz
```http
POST /quizzes/createAgentQuiz
Content-Type: application/json

{
    "prompt": "Create a 5-question quiz about TypeScript"
}

Response: 200 OK
```

### Player Endpoints

#### Create Player
```http
POST /players/createPlayer
Content-Type: application/json

{
    "playerName": "Alice",
    "gameSessionId": "uuid"
}

Response: 200 OK
```

#### Get Player Stats
```http
GET /games/player-stats/:sessionId/:playerName

Response: 200 OK
{
    "status": 200,
    "data": {
        "playerName": "Alice",
        "totalScore": 850,
        "correctAnswers": 7,
        "currentStreak": 2
    }
}
```

---

## 🔌 WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-game` | `{ gameSessionId, playerName }` | Player joins game |
| `leave-game` | `{ gameSessionId, playerName }` | Player leaves game |
| `start-game` | `{ gameSessionId }` | Host starts game |
| `next-question` | `{ gameSessionId, questionIndex }` | Move to next question |
| `submit-answer` | `{ gameSessionId, playerName, questionId, answerId, timeToAnswer }` | Submit answer |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joined-game` | `{ success, player, gameState }` | Confirm player joined |
| `player-joined` | `{ playerName, players, totalPlayers }` | Notify all: player joined |
| `player-left` | `{ playerName, players }` | Notify all: player left |
| `game-started` | `{ gameSessionId, message }` | Game has started |
| `countdown-tick` | `{ count, gameSessionId }` | Countdown timer (3,2,1) |
| `question-started` | `{ question, questionIndex, duration, startTime }` | New question begins |
| `time-update` | `{ timeLeft, gameSessionId }` | Timer tick (every second) |
| `player-answered` | `{ playerName, answeredCount, totalPlayers }` | Player submitted answer |
| `answer-submitted` | `{ success, isCorrect, pointsEarned, currentStreak, totalScore }` | Answer result |
| `question-results` | `{ leaderboard, gameSessionId }` | Question ended, show scores |
| `game-state-changed` | `{ state, gameSessionId }` | Game state changed |
| `game-ended` | `{ leaderboard, message }` | Game finished |
| `error` | `{ message }` | Error occurred |

### Example: Game Flow Events

```javascript
// 1. Player joins
client.emit('join-game', { gameSessionId: 'uuid', playerName: 'Alice' })
→ server.emit('player-joined', { playerName: 'Alice', totalPlayers: 5 })

// 2. Host starts
client.emit('start-game', { gameSessionId: 'uuid' })
→ server.emit('game-started', {...})
→ server.emit('countdown-tick', { count: 3 })
→ server.emit('countdown-tick', { count: 2 })
→ server.emit('countdown-tick', { count: 1 })

// 3. Question begins
→ server.emit('question-started', { question: {...}, duration: 10 })
→ server.emit('time-update', { timeLeft: 10 })
→ server.emit('time-update', { timeLeft: 9 })

// 4. Player answers
client.emit('submit-answer', { gameSessionId, playerName, questionId, answerId })
→ server.emit('answer-submitted', { isCorrect: true, pointsEarned: 150 })

// 5. Timer expires
→ server.emit('question-results', { leaderboard: [...] })

// 6. Next question or end
client.emit('next-question', { gameSessionId, questionIndex: 1 })
// ... or ...
→ server.emit('game-ended', { leaderboard: [...] })
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Manual Testing

#### Test WebSocket Connection

```javascript
// In browser console
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected!');
});

socket.emit('join-game', {
    gameSessionId: 'your-session-id',
    playerName: 'TestPlayer'
});
```

#### Test API Endpoints

```bash
# Create a quiz
curl -X POST http://localhost:3000/api/quizzes/createQuiz \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "questions": [...]
  }'

# Create game session
curl -X POST http://localhost:3000/api/games/create-session \
  -H "Content-Type: application/json" \
  -d '{"quizId": "quiz-uuid"}'

# Get game by PIN
curl http://localhost:3000/api/games/gamepin/123456
```

---

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build application
npm run build

```

### Using Docker

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: quizgame
      POSTGRES_USER: quizuser
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: quizuser
      DB_PASSWORD: password
      DB_NAME: quizgame
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

#### 3. Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Environment-Specific Configs

#### Production (.env.production)

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_SSL=true
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
```

#### Staging (.env.staging)

```bash
NODE_ENV=staging
PORT=3000
DB_HOST=your-staging-db-host
FRONTEND_URL=https://staging.yourdomain.com
```

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or change port in .env
PORT=3001
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check connection details
psql -h localhost -U quizuser -d quizgame

# Reset database
npm run typeorm schema:drop
npm run typeorm migration:run
```

#### WebSocket Connection Issues

```javascript
// Enable debug logs
DEBUG=socket.io* npm run dev

// Check CORS settings in .env
ALLOWED_ORIGINS=http://localhost:3001

// Verify frontend is connecting to correct URL
// Frontend: NEXT_PUBLIC_GAMESERVICE_BASE_URL=http://localhost:3000
```

#### TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist
npm run build

# Check tsconfig.json
# Ensure "strict": false for gradual migration
```

### Debug Mode

```bash
# Enable all debug logs
DEBUG=* npm run dev

# Socket.IO only
DEBUG=socket.io* npm run dev

# Custom namespace
DEBUG=quiz:* npm run dev
```

### Logging

```typescript
// Add logging in your code
import logger from '@/utils/logger';

logger.info('Game started', { gameId, players: count });
logger.error('Failed to create game', { error });
logger.debug('Processing answer', { playerName, answerId });
```

---

## 📊 Performance Optimization

### Database

```typescript
// Use indexes
@Index(['gamePin'])
@Index(['status', 'isActive'])

// Use query optimization
.select(['player.id', 'player.playerName', 'player.totalScore'])
.orderBy('player.totalScore', 'DESC')
.take(10)

// Connection pooling (in database.config.ts)
extra: {
    max: 20,
    idleTimeoutMillis: 30000
}
```

### WebSocket

```typescript
// Use rooms for efficient broadcasting
io.to(gameSessionId).emit('event', data);

// Compress messages
io.set('transports', ['websocket', 'polling']);
io.set('perMessageDeflate', true);
```

---

## 🔒 Security Best Practices

### Input Validation

```typescript
// Validate all inputs
import { z } from 'zod';

const createGameSchema = z.object({
    quizId: z.string().uuid()
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
}));
```

---

## 📝 Scripts

```json
{
  "dev": "nodemon src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "typeorm": "typeorm-ts-node-commonjs",
  "migration:generate": "npm run typeorm migration:generate",
  "migration:run": "npm run typeorm migration:run",
  "migration:revert": "npm run typeorm migration:revert",
  "lint": "eslint . --ext .ts",
  "format": "prettier --write \"src/**/*.ts\""
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@quizgame.com
- Documentation: https://docs.quizgame.com

---

## 🎯 Roadmap
`
- [ ] Add authentication and user accounts
- [ ] Implement team-based gameplay
- [ ] Add custom themes
- [ ] Create analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Tournament mode
- [ ] Monetization features

---

**Built with ❤️ by the Flamingo Team**