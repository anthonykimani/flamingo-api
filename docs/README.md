# Flamingo API Documentation

Welcome to the Flamingo API documentation. This comprehensive guide is designed for coding agents and developers working on the Flamingo real-time multiplayer quiz platform.

## Overview

Flamingo is a blockchain-integrated, real-time multiplayer quiz platform similar to Kahoot, built with Node.js, Express, TypeScript, Socket.IO, and PostgreSQL. The platform features cryptocurrency-based entry fees and prize distributions via smart contracts on Base Sepolia.

## Documentation Structure

### 1. [Overview](./overview/)
- [Project Introduction](./overview/01-introduction.md)
- [Architecture Overview](./overview/02-architecture.md)
- [Tech Stack](./overview/03-tech-stack.md)
- [Getting Started](./overview/04-getting-started.md)

### 2. [Services](./services/)
- [Game Service](./services/game/)
  - [Models & Entities](./services/game/01-models.md)
  - [Repositories](./services/game/02-repositories.md)
  - [Controllers](./services/game/03-controllers.md)
  - [Socket Manager](./services/game/04-socket-manager.md)
  - [Blockchain Escrow](./services/game/05-escrow-service.md)
  - [Enums & Interfaces](./services/game/06-enums-interfaces.md)
- [Identity Service](./services/identity/)
  - [Models & Entities](./services/identity/01-models.md)
  - [Repositories](./services/identity/02-repositories.md)
  - [Controllers](./services/identity/03-controllers.md)
  - [Enums & Interfaces](./services/identity/04-enums-interfaces.md)
  - [Utilities](./services/identity/05-utilities.md)

### 3. [Architecture](./architecture/)
- [System Architecture](./architecture/01-system-architecture.md)
- [Data Flow](./architecture/02-data-flow.md)
- [Design Patterns](./architecture/03-design-patterns.md)
- [Blockchain Integration](./architecture/04-blockchain-integration.md)

### 4. [API Reference](./api/)
- [Game Endpoints](./api/01-game-endpoints.md)
- [Quiz Endpoints](./api/02-quiz-endpoints.md)
- [Player Endpoints](./api/03-player-endpoints.md)
- [User Endpoints](./api/04-user-endpoints.md)
- [WebSocket Events](./api/05-websocket-events.md)

### 5. [Database](./database/)
- [Schema Overview](./database/01-schema-overview.md)
- [Entity Relationships](./database/02-entity-relationships.md)
- [Migrations](./database/03-migrations.md)

### 6. [Deployment](./deployment/)
- [Environment Configuration](./deployment/01-environment-config.md)
- [Database Setup](./deployment/02-database-setup.md)
- [Running Services](./deployment/03-running-services.md)

### 7. [Guides](./guides/)
- [Creating a Game](./guides/01-creating-game.md)
- [Game Lifecycle](./guides/02-game-lifecycle.md)
- [Scoring System](./guides/03-scoring-system.md)
- [Blockchain Workflow](./guides/04-blockchain-workflow.md)

## Quick Reference

### Project Structure
```
flamingo-api/
├── game/                   # Game service (port 3000)
│   └── service/
│       ├── configs/        # Database, CORS, API config
│       ├── controllers/    # Business logic handlers
│       ├── enums/          # Type-safe constants
│       ├── interfaces/     # TypeScript interfaces
│       ├── models/         # TypeORM entities
│       ├── repositories/   # Data access layer
│       ├── routes/         # API route definitions
│       └── utils/          # Utilities, socket, blockchain
├── identity/               # Identity service (port 3001)
│   └── service/
│       ├── configs/        # Configuration files
│       ├── controllers/    # Request handlers
│       ├── enums/          # Enum definitions
│       ├── interfaces/     # Type definitions
│       ├── models/         # User entity
│       ├── repositories/   # User data access
│       ├── routes/         # User routes
│       └── utils/          # Validators, formatters, HTTP
└── docs/                   # This documentation
```

### Key Technologies
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.x
- **Framework:** Express.js 4.x
- **Real-time:** Socket.IO 4.x
- **Database:** PostgreSQL 15+ with TypeORM 0.3.x
- **Blockchain:** Viem 2.x (Base Sepolia)
- **AI:** OpenAI Agents 0.1.x

### Core Features
- Real-time multiplayer quiz gameplay
- WebSocket-based synchronization
- Blockchain-backed entry fees and prizes
- AI-powered quiz generation
- Dynamic scoring with streaks and time bonuses
- Live leaderboards
- Comprehensive analytics

### Service Ports
- Game Service: `3000`
- Identity Service: `3001`

### Database
- PostgreSQL connection on port `5432`
- Two separate databases (configured per service)

## For Coding Agents

This documentation is structured to provide:

1. **Complete Component Reference:** Every file, class, method, and interface is documented with purpose and relationships
2. **Architecture Patterns:** Clear explanation of design patterns, data flows, and system interactions
3. **Business Logic:** Detailed workflows for game lifecycle, scoring, and blockchain integration
4. **API Contracts:** Full endpoint specifications with request/response examples
5. **Database Schema:** Entity relationships, constraints, and cascade behaviors
6. **Configuration:** Environment variables, connection strings, and deployment setup

### Navigation Tips
- Start with [Architecture Overview](./overview/02-architecture.md) for system understanding
- Reference [Game Service](./services/game/) for core gameplay logic
- Check [API Reference](./api/) for endpoint integration
- Review [Guides](./guides/) for workflow implementations

## Contributing

When updating this documentation:
1. Keep file references with line numbers (e.g., `game/service/models/game.entity.ts:42`)
2. Include code examples and type signatures
3. Document relationships between components
4. Update the index when adding new sections
5. Maintain consistent formatting and structure

## Version

Documentation Version: 1.0.0
Last Updated: 2025-11-05
Project: Flamingo API (flamingo-api)
