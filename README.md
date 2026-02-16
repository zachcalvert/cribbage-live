# Cribbage Live

Real-time multiplayer cribbage application supporting 2 or 4 players with WebSocket communication, Redis game state storage, and Docker deployment.

## Features

- **Real-time multiplayer**: Play with friends via WebSocket connections
- **2 or 4 player modes**: Standard 2-player rules or 4-player team play
- **Bot opponents**: Play solo against AI with configurable difficulty
- **Persistent games**: Redis-backed game state with 2-hour TTL
- **In-game chat**: Communicate with other players
- **Mobile-friendly**: Responsive design works on all devices

## Tech Stack

- **Frontend**: TypeScript, React, Vite, Tailwind CSS
- **Backend**: TypeScript, Node.js, Express, Socket.io
- **Storage**: Redis
- **Containerization**: Docker + Docker Compose

## Quick Start

### Using Docker (Recommended)

```bash
docker-compose up
```

Then open http://localhost:5173 in your browser.

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Redis** (required for game state):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser.

## Project Structure

```
cribbage-live/
├── docker-compose.yml
├── packages/
│   ├── shared/          # Shared types & game logic
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── deck.ts
│   │   │   ├── scoring.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── socket/handlers.ts
│   │   │   ├── game/GameManager.ts
│   │   │   ├── game/Bot.ts
│   │   │   └── redis/client.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── client/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── hooks/
│       │   └── context/
│       ├── Dockerfile
│       └── package.json
├── package.json         # Workspace root
└── tsconfig.base.json
```

## Game Rules

### Dealing
- **2 players**: 6 cards each, discard 2 to crib
- **4 players**: 5 cards each, discard 1 to crib (partners sit across)

### Scoring

**Hand Scoring:**
- **Fifteens**: 2 points for each combination totaling 15
- **Pairs**: 2 points per pair (6 for three-of-a-kind, 12 for four-of-a-kind)
- **Runs**: 1 point per card in a sequence of 3+
- **Flush**: 4 points for 4-card flush in hand, 5 if starter matches
- **Nobs**: 1 point for Jack matching starter suit

**Pegging:**
- 2 points for hitting 15 or 31
- 2 points for pairs (6 for triple, 12 for quadruple)
- 1 point per card in runs
- 1 point for "Go" (opponent can't play)

### Winning
First to 121 points (or 61 for short game) wins.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## API Endpoints

### REST
- `GET /health` - Server health check

### Socket.io Events

**Client → Server:**
- `create_game` - Create a new game
- `join_game` - Join an existing game
- `start_game` - Start the game
- `discard_to_crib` - Discard cards to crib
- `play_card` - Play a card during pegging
- `pass` - Pass during pegging (Go)
- `continue_counting` - Continue to next scoring phase
- `send_chat` - Send a chat message

**Server → Client:**
- `game_created` - Game was created
- `player_joined` - A player joined
- `game_started` - Game has started
- `game_updated` - Game state updated
- `chat_message` - New chat message
- `error` - Error occurred
- `player_disconnected` - A player disconnected

## Environment Variables

### Server
- `PORT` - Server port (default: 3001)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `CLIENT_URL` - Allowed CORS origin (default: http://localhost:5173)

### Client
- `VITE_SOCKET_URL` - Socket.io server URL (default: http://localhost:3001)

## License

MIT
