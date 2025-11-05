# Game Service - Models & Entities

Complete reference for all 6 TypeORM entities in the game service.

**Location:** [game/service/models/](../../../game/service/models/)

## Entity Relationship Diagram

```
┌─────────┐
│  Quiz   │ (1)
└────┬────┘
     │
     ├──────── (Many) ┌───────────┐
     │                │ Question  │ (1)
     │                └─────┬─────┘
     │                      │
     │                      └────── (Many) ┌────────┐
     │                                     │ Answer │
     │                                     └────────┘
     │
     └──────── (Many) ┌───────┐
                      │  Game │ (1)
                      └───┬───┘
                          │
                          ├────── (Many) ┌────────┐
                          │              │ Player │
                          │              └────────┘
                          │
                          └────── (Many) ┌──────────────┐
                                         │PlayerAnswer  │
                                         └──────────────┘
```

---

## 1. Game Entity

**File:** [game/service/models/game.entity.ts](../../../game/service/models/game.entity.ts)

**Purpose:** Represents a live game session

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `gamePin` | string | No | Unique 6-digit join code |
| `quiz` | Quiz | Yes | Related quiz template |
| `status` | GameState | Yes | Current game state |
| `entryFee` | decimal | Yes | Entry fee amount (USDC) |
| `maxPlayers` | number | Yes | Maximum capacity |
| `currentQuestionIndex` | number | Yes | Active question index |
| `questionDuration` | number | Yes | Seconds per question |
| `timeLeft` | number | Yes | Remaining seconds |
| `questionStartedAt` | Date | Yes | Question start timestamp |
| `startedAt` | Date | Yes | Game start timestamp |
| `endedAt` | Date | Yes | Game end timestamp |
| `lockTxHash` | string | Yes | Deposit lock transaction |
| `distributeTxHash` | string | Yes | Prize distribution transaction |
| `isLocked` | boolean | Yes | Deposits locked flag |
| `isPaidOut` | boolean | Yes | Prizes distributed flag |
| `lockedAt` | Date | Yes | Lock timestamp |
| `distributedAt` | Date | Yes | Distribution timestamp |
| `bytes32Hash` | string | Yes | Keccak256(sessionId) for blockchain |
| `deleted` | boolean | No | Soft delete flag (default: false) |
| `players` | Player[] | - | One-to-many relation |
| `playerAnswers` | PlayerAnswer[] | - | One-to-many relation |

### Relationships

```typescript
@ManyToOne(() => Quiz, (quiz) => quiz.games, { cascade: true })
quiz: Quiz;

@OneToMany(() => Player, (player) => player.gameSession, { cascade: true })
players: Player[];

@OneToMany(() => PlayerAnswer, (pa) => pa.gameSession, { cascade: true })
playerAnswers: PlayerAnswer[];
```

### Indexes

```typescript
@Index(['gamePin'], { unique: true })
@Index(['status'])
@Index(['deleted'])
```

### Game States

From [GameState.ts](../../../game/service/enums/GameState.ts):
- `CREATED` - Initial state
- `WAITING` - Awaiting players/start
- `COUNTDOWN` - Pre-question countdown
- `IN_PROGRESS` - Question active
- `TIMEOUT` - Question time expired
- `RESULTS_READY` - Showing results
- `PAYOUT` - Distributing prizes
- `COMPLETED` - Game finished

### Blockchain Fields

| Field | Purpose | Set By |
|-------|---------|--------|
| `lockTxHash` | Transaction hash from deposit lock | `flamingoEscrowService.createGameSession()` |
| `distributeTxHash` | Transaction hash from prize distribution | `flamingoEscrowService.distributePrizes()` |
| `isLocked` | Whether deposits are locked | `GameRepository.markGameLocked()` |
| `isPaidOut` | Whether prizes distributed | `GameRepository.markPrizesDistributed()` |
| `bytes32Hash` | Keccak256 hash of sessionId (UUID) | `flamingoEscrowService.createGameSession()` |
| `lockedAt` | Timestamp of lock | Auto-set on lock |
| `distributedAt` | Timestamp of distribution | Auto-set on distribute |

---

## 2. Player Entity

**File:** [game/service/models/player.entity.ts](../../../game/service/models/player.entity.ts)

**Purpose:** Represents a participant in a game session

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `playerName` | string | No | Display name |
| `walletAddress` | string | Yes | Blockchain wallet |
| `gameSession` | Game | No | Parent game |
| `totalScore` | number | Yes | Cumulative points (default: 0) |
| `correctAnswers` | number | Yes | Correct count (default: 0) |
| `wrongAnswers` | number | Yes | Wrong count (default: 0) |
| `currentStreak` | number | Yes | Current streak (default: 0) |
| `bestStreak` | number | Yes | Highest streak (default: 0) |
| `hasAnsweredCurrent` | boolean | Yes | Answered current question (default: false) |
| `hasDeposited` | boolean | Yes | Deposited entry fee (default: false) |
| `depositAmount` | decimal | Yes | Deposit amount |
| `depositedAt` | Date | Yes | Deposit timestamp |
| `deleted` | boolean | No | Soft delete (default: false) |

### Relationships

```typescript
@ManyToOne(() => Game, (game) => game.players, { onDelete: 'CASCADE' })
gameSession: Game;
```

### Scoring Fields

- `totalScore`: Sum of all points earned
- `correctAnswers`: Count of correct submissions
- `wrongAnswers`: Count of incorrect submissions
- `currentStreak`: Consecutive correct answers
- `bestStreak`: Max streak achieved in game
- `hasAnsweredCurrent`: Prevents duplicate answers

### Deposit Tracking

- `hasDeposited`: Whether player deposited entry fee
- `depositAmount`: Amount deposited (matches Game.entryFee)
- `depositedAt`: Timestamp of deposit
- `walletAddress`: Required for blockchain interaction

---

## 3. Quiz Entity

**File:** [game/service/models/quiz.entity.ts](../../../game/service/models/quiz.entity.ts)

**Purpose:** Reusable quiz template

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `title` | string(100) | No | Quiz title |
| `isPublished` | boolean | Yes | Published flag (default: true) |
| `createdAt` | Date | No | Creation timestamp |
| `updatedAt` | Date | No | Last update timestamp |
| `deleted` | boolean | No | Soft delete (default: false) |
| `questions` | Question[] | - | One-to-many relation |
| `games` | Game[] | - | One-to-many relation |

### Relationships

```typescript
@OneToMany(() => Question, (q) => q.quiz, {
  cascade: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})
questions: Question[];

@OneToMany(() => Game, (game) => game.quiz, {
  cascade: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})
games: Game[];
```

### Cascade Behavior

Deleting a quiz will:
1. Delete all related questions
2. Delete all answers for those questions
3. Delete all games using this quiz
4. Delete all players in those games
5. Delete all player answers

---

## 4. Question Entity

**File:** [game/service/models/question.entity.ts](../../../game/service/models/question.entity.ts)

**Purpose:** Individual question in a quiz

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `quiz` | Quiz | No | Parent quiz |
| `question` | text | Yes | Question text |
| `questionNumber` | number | Yes | Ordering/index |
| `createdAt` | Date | No | Creation timestamp |
| `deleted` | boolean | No | Soft delete (default: false) |
| `answers` | Answer[] | - | One-to-many relation |

### Relationships

```typescript
@ManyToOne(() => Quiz, (quiz) => quiz.questions, {
  cascade: true,
  onDelete: 'CASCADE'
})
quiz: Quiz;

@OneToMany(() => Answer, (answer) => answer.question, {
  cascade: true,
  onDelete: 'CASCADE'
})
answers: Answer[];
```

### Question Ordering

- `questionNumber` determines display order
- Typically starts at 1
- Used by Socket Manager to track current question

---

## 5. Answer Entity

**File:** [game/service/models/answer.entity.ts](../../../game/service/models/answer.entity.ts)

**Purpose:** Multiple-choice answer option

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `answer` | text | Yes | Answer text |
| `correctAnswer` | boolean | Yes | Is correct flag (default: false) |
| `question` | Question | No | Parent question |
| `deleted` | boolean | No | Soft delete (default: false) |

### Relationships

```typescript
@ManyToOne(() => Question, (question) => question.answers, {
  onDelete: 'CASCADE'
})
question: Question;
```

### Validation Rules

- Each question should have exactly 4 answers (enforced in AI generation)
- Exactly 1 answer should have `correctAnswer: true`
- Validated in QuizController when using AI generation

---

## 6. PlayerAnswer Entity

**File:** [game/service/models/player-answer.entity.ts](../../../game/service/models/player-answer.entity.ts)

**Purpose:** Records player's answer submission

### Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `gameSession` | Game | No | Related game |
| `playerName` | string | Yes | Player identifier |
| `playerId` | UUID | Yes | Player UUID (optional) |
| `question` | Question | No | Question answered |
| `selectedAnswer` | Answer | No | Chosen answer |
| `isCorrect` | boolean | Yes | Correct flag |
| `pointsEarned` | number | Yes | Points awarded |
| `answerStreak` | number | Yes | Streak at time of answer |
| `timeToAnswer` | number | Yes | Milliseconds to answer |
| `answeredAt` | Date | No | Submission timestamp |
| `deleted` | boolean | No | Soft delete (default: false) |

### Relationships

```typescript
@ManyToOne(() => Game, (game) => game.playerAnswers, {
  cascade: true,
  onDelete: 'CASCADE'
})
gameSession: Game;

@ManyToOne(() => Question, {
  cascade: true,
  onDelete: 'CASCADE'
})
question: Question;

@ManyToOne(() => Answer, {
  cascade: true,
  onDelete: 'CASCADE'
})
selectedAnswer: Answer;
```

### Analytics Fields

- `pointsEarned`: Calculated score (base + streak + time bonuses)
- `answerStreak`: Streak value at submission time
- `timeToAnswer`: Milliseconds from question start
- `answeredAt`: Timestamp for chronological ordering

### Use Cases

1. **Audit Trail:** Complete history of all answers
2. **Analytics:** Answer distribution, fastest times, accuracy rates
3. **Leaderboards:** Aggregate by player for rankings
4. **Question Stats:** Which answers were chosen, success rates

---

## Common Patterns

### Soft Delete

All entities use soft delete pattern:

```typescript
@Column({ type: 'boolean', default: false })
deleted: boolean;

// Queries filter deleted records
.where({ deleted: false })
```

Benefits:
- Data preservation for analytics
- Audit trail
- Recovery possible
- Historical reporting

### Timestamps

Entities track creation and modification:

```typescript
@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
```

### UUID Primary Keys

All entities use UUID v4:

```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```

Benefits:
- Globally unique
- Non-sequential (security)
- Distributed-friendly

### Cascade Operations

DELETE operations cascade:
- Quiz → Questions → Answers
- Quiz → Games → Players → PlayerAnswers
- Game → Players
- Game → PlayerAnswers

Prevents orphaned records.

---

## Data Integrity

### Constraints

1. **Unique Game PIN:** `@Index(['gamePin'], { unique: true })`
2. **Required Relationships:** Most foreign keys are NOT NULL
3. **Default Values:** Booleans default to false, numbers to 0
4. **Soft Deletes:** Never hard delete, set `deleted: true`

### Validation

Validation occurs in:
1. **TypeORM:** Column constraints, data types
2. **Controllers:** Business logic validation
3. **Validators:** Input sanitization (limited implementation)

---

## Next Steps

- [Repositories](./02-repositories.md) - Data access operations
- [Controllers](./03-controllers.md) - Business logic using these entities
- [Database Schema](../../database/01-schema-overview.md) - Complete schema reference
