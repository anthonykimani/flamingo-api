# Getting Started

Quick setup guide for developers and coding agents.

## Prerequisites

Ensure you have installed:

- **Node.js:** 18+ ([nodejs.org](https://nodejs.org))
- **PostgreSQL:** 15+ ([postgresql.org](https://www.postgresql.org))
- **npm:** Comes with Node.js
- **Git:** For version control

## Installation

### 1. Clone Repository

```bash
# Already cloned at:
cd /home/priest/flamingo/flamingo-api
```

### 2. Install Dependencies

```bash
# Game Service
cd game
npm install

# Identity Service
cd ../identity
npm install
```

### 3. Database Setup

#### Create Databases

```bash
# Access PostgreSQL
psql postgres

# Create databases
CREATE DATABASE flamingo_game;
CREATE DATABASE flamingo_identity;

# Create user (if needed)
CREATE USER flamingo WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE flamingo_game TO flamingo;
GRANT ALL PRIVILEGES ON DATABASE flamingo_identity TO flamingo;

# Exit
\q
```

#### Run Migrations

```bash
# Note: Migrations not yet implemented
# TypeORM will auto-sync schema in development mode
```

### 4. Environment Configuration

#### Game Service `.env.development`

Create `game/.env.development`:

```bash
# Server
PORT=3000
SERVICE_NAME=game-service
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=flamingo
DB_PASSWORD=your_password
DB_NAME=flamingo_game

# CORS
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# AI (Optional - for quiz generation)
OPENAI_API_KEY=sk-proj-...

# Blockchain (Required for game start/end)
VIEM_PRIVATE_KEY=0x...                          # Your private key
ESCROW_CONTRACT_ADDRESS=0x...                   # FlamingoEscrow address
USDC_CONTRACT_ADDRESS=0x...                     # USDC token address
BASE_SEPOLIA_RPC=https://sepolia.base.org      # RPC endpoint
```

#### Identity Service `.env.development`

Create `identity/.env.development`:

```bash
# Server
PORT=3001
SERVICE_NAME=identity-service
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=flamingo
DB_PASSWORD=your_password
DB_NAME=flamingo_identity

# Authentication
TOKEN_SECRET=your-secret-key-here
TOKEN_ISSUER=flamingo
TOKEN_EXPIRY=24h
SALT_ROUNDS=10

# Locale
DEFAULT_COUNTRY_CODE=+254
```

### 5. Start Services

```bash
# Terminal 1: Game Service
cd game
npm run dev
# Server starts on http://localhost:3000

# Terminal 2: Identity Service
cd identity
npm run dev
# Server starts on http://localhost:3001
```

## Verify Installation

### Check Game Service

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "service": "game-service",
  "timestamp": "2025-11-05T..."
}
```

### Check Identity Service

```bash
# Get service info
curl http://localhost:3001/

# Expected response:
{
  "service": "identity-service"
}
```

### Check Database Connection

Look for log output:
```
Database initialized successfully
```

### Check Socket.IO

Visit http://localhost:3000 in browser. If Express is running, Socket.IO is available.

## Test the System

### 1. Create a Quiz

```bash
curl -X POST http://localhost:3000/quizzes/createQuiz \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "questions": [
      {
        "questionNumber": 1,
        "question": "What is 2+2?",
        "answers": [
          {"answer": "3", "correctAnswer": false},
          {"answer": "4", "correctAnswer": true},
          {"answer": "5", "correctAnswer": false},
          {"answer": "6", "correctAnswer": false}
        ]
      }
    ]
  }'
```

Save the quiz ID from the response.

### 2. Create a Game Session

```bash
curl -X POST http://localhost:3000/games/create-session \
  -H "Content-Type: application/json" \
  -d '{"quizId": "YOUR_QUIZ_ID"}'
```

Save the `gamePin` from the response.

### 3. Test WebSocket Connection

Create `test-socket.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.IO Test</title>
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.IO Test</h1>
  <button onclick="joinGame()">Join Game</button>
  <div id="output"></div>

  <script>
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Connected:', socket.id);
      document.getElementById('output').innerHTML += 'Connected<br>';
    });

    socket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      document.getElementById('output').innerHTML +=
        `Player ${data.playerName} joined<br>`;
    });

    function joinGame() {
      socket.emit('join-game', {
        gameSessionId: 'YOUR_SESSION_ID',
        playerName: 'TestPlayer',
        walletAddress: '0x...'  // Use a valid address
      });
    }
  </script>
</body>
</html>
```

Open in browser and click "Join Game".

### 4. Create a User (Identity Service)

```bash
curl -X POST http://localhost:3001/users/add \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phoneNumber": "+254712345678"
  }'
```

## Development Workflow

### File Watching

Both services use `nodemon` for auto-restart:

```bash
# Edit any .ts file
# nodemon detects change → ts-node recompiles → server restarts
```

### Code Changes

1. Edit TypeScript files
2. Save
3. Watch console for compilation errors
4. Test endpoint/socket event
5. Check logs for errors

### Database Changes

**Option 1: Auto-Sync (Development)**

Set in `ormconfig.ts`:
```typescript
synchronize: true  // Auto-sync schema
```

**Option 2: Migrations (Production)**

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migration
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### Debugging

**Enable TypeScript Source Maps:**

Already configured in `tsconfig.json`:
```json
{
  "sourceMap": true
}
```

**Enable Debug Logging:**

```bash
# Socket.IO debug
DEBUG=socket.io* npm run dev

# All debug
DEBUG=* npm run dev
```

**Database Query Logging:**

In `ormconfig.ts`:
```typescript
logging: true
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or change port in .env
PORT=3002
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -h localhost -U flamingo -d flamingo_game

# Check credentials in .env
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check TypeScript version
npx tsc --version

# Compile manually
npx tsc --noEmit
```

### Socket.IO Not Connecting

1. Check CORS configuration in `game/service/configs/corsconfig.ts`
2. Verify `ALLOWED_ORIGINS` in `.env`
3. Check browser console for CORS errors
4. Enable Socket.IO debug logs

### Blockchain Transaction Fails

1. Check wallet has Base Sepolia ETH for gas
2. Verify contract addresses in `.env`
3. Check RPC endpoint is accessible
4. Test with `flamingoEscrowService.getContractAddresses()`

## Project Structure Reference

```
flamingo-api/
├── game/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.development        # Create this
│   └── service/
│       ├── index.ts            # Entry point
│       ├── configs/            # Configuration
│       ├── models/             # Entities
│       ├── repositories/       # Data access
│       ├── controllers/        # Business logic
│       ├── routes/             # API routes
│       └── utils/              # Utilities
├── identity/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.development        # Create this
│   └── service/
│       ├── index.ts            # Entry point
│       ├── configs/
│       ├── models/
│       ├── repositories/
│       ├── controllers/
│       ├── routes/
│       └── utils/
├── docs/                       # Documentation
└── readme.md                   # Project README
```

## Next Steps

### For Development

1. Read [Architecture Overview](./02-architecture.md)
2. Study [Game Service](../services/game/README.md)
3. Review [API Documentation](../api/)
4. Check [Database Schema](../database/)

### For Testing

1. Create test quizzes
2. Test game flow end-to-end
3. Verify blockchain integration
4. Test Socket.IO events
5. Check leaderboard calculations

### For Deployment

1. Set up production database
2. Configure environment variables
3. Build TypeScript: `npm run build`
4. Use PM2 for process management
5. Set up reverse proxy (nginx)
6. Configure SSL/TLS
7. Set up monitoring

See [Deployment Guide](../deployment/) for details.

## Helpful Commands

```bash
# Check logs
tail -f logs/app.log  # If logging to file

# Database
psql flamingo_game    # Access game database
psql flamingo_identity # Access identity database

# Node.js
node --version        # Check Node version
npm list              # List installed packages

# TypeScript
npx tsc --noEmit     # Check for errors without compiling

# Git
git status            # Check current state
git log --oneline -5  # Recent commits
git branch            # Current branch
```

## Resources

- [Node.js Docs](https://nodejs.org/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.IO Docs](https://socket.io/docs/)
- [TypeORM Docs](https://typeorm.io/)
- [Viem Docs](https://viem.sh/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)

## Support

For issues:
1. Check logs for error messages
2. Review [Troubleshooting](../../readme.md#troubleshooting) section
3. Search [Quick Reference](../QUICK_REFERENCE.md)
4. Check entity definitions in [Models](../services/game/01-models.md)

## Ready to Code!

You should now have:
- ✅ Both services running
- ✅ Databases configured
- ✅ Environment variables set
- ✅ Test quiz created
- ✅ Socket.IO working

Start building!
