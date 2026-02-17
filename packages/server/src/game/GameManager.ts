import type { Server, Socket } from 'socket.io';
import type Redis from 'ioredis';
import type {
  GameState,
  ClientGameState,
  CreateGamePayload,
  JoinGamePayload,
  DiscardToCribPayload,
  PlayCardPayload,
  Player,
  Card,
} from '@cribbage/shared';
import {
  GAME_TTL_SECONDS,
  CARDS_PER_PLAYER,
  DISCARDS_PER_PLAYER,
  ADJECTIVES,
  NOUNS,
  MATERIALS,
} from '@cribbage/shared';
import { createDeck, shuffleDeck, dealCards, cardToString } from '@cribbage/shared';
import { scoreHand, scoreCrib, scorePegging } from '@cribbage/shared';
import {
  canPlayCard,
  getCardValue,
  isValidPeggingPlay,
  checkForGo,
} from '@cribbage/shared';
import type { ScoreBreakdown } from '@cribbage/shared';
import { BotPlayer } from './Bot.js';

const METRICS_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export interface GameMetrics {
  last24Hours: {
    gamesStarted: number;
    uniqueHumanPlayers: number;
  };
  recentGames: {
    name: string;
    players: string[];
    startTime: string;
    endTime: string | null;
    winner: string | null;
  }[];
}

export class GameManager {
  private redis: Redis;
  private io: Server;
  private socketToPlayer: Map<string, { gameId: string; playerId: string }> = new Map();
  private bots: Map<string, BotPlayer> = new Map();

  constructor(redis: Redis, io: Server) {
    this.redis = redis;
    this.io = io;
  }

  // ============ Metrics Methods ============

  private async trackHumanPlayer(playerName: string): Promise<void> {
    const now = Date.now();
    await this.redis.zadd('metrics:human_players', now, playerName);
    // Clean up old entries (older than 24 hours)
    const cutoff = now - (24 * 60 * 60 * 1000);
    await this.redis.zremrangebyscore('metrics:human_players', '-inf', cutoff);
  }

  private async trackGameStarted(gameId: string, gameName: string, players: { name: string; isBot: boolean }[]): Promise<void> {
    const now = Date.now();

    // Add to sorted set for counting
    await this.redis.zadd('metrics:games_started', now, gameId);

    // Clean up old entries
    const cutoff = now - (24 * 60 * 60 * 1000);
    await this.redis.zremrangebyscore('metrics:games_started', '-inf', cutoff);

    // Store per-game details
    const gameMetric = {
      name: gameName,
      players: players.map(p => p.name),
      startTime: new Date(now).toISOString(),
      endTime: null,
      winner: null,
    };
    await this.redis.setex(`metrics:game:${gameId}`, METRICS_TTL_SECONDS, JSON.stringify(gameMetric));
  }

  private async trackGameEnded(gameId: string, winnerName: string): Promise<void> {
    const key = `metrics:game:${gameId}`;
    const data = await this.redis.get(key);
    if (data) {
      const gameMetric = JSON.parse(data);
      gameMetric.endTime = new Date().toISOString();
      gameMetric.winner = winnerName;
      // Reset TTL when updating
      await this.redis.setex(key, METRICS_TTL_SECONDS, JSON.stringify(gameMetric));
    }
  }

  async getMetrics(): Promise<GameMetrics> {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000);

    // Count games started in last 24 hours
    const gamesStarted = await this.redis.zcount('metrics:games_started', cutoff, '+inf');

    // Count unique human players in last 24 hours
    const uniqueHumanPlayers = await this.redis.zcount('metrics:human_players', cutoff, '+inf');

    // Get recent game IDs (last 20)
    const recentGameIds = await this.redis.zrevrange('metrics:games_started', 0, 19);

    // Fetch details for each recent game
    const recentGames: GameMetrics['recentGames'] = [];
    for (const gameId of recentGameIds) {
      const data = await this.redis.get(`metrics:game:${gameId}`);
      if (data) {
        recentGames.push(JSON.parse(data));
      }
    }

    return {
      last24Hours: {
        gamesStarted,
        uniqueHumanPlayers,
      },
      recentGames,
    };
  }

  // Broadcast a game announcement to all players in a game
  private announce(gameId: string, message: string): void {
    this.io.to(gameId).emit('chat_message', {
      id: `announce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      playerId: 'announcer',
      playerName: 'Game',
      message,
      timestamp: Date.now(),
    });
  }

  // Format pegging score announcement
  private formatPeggingScore(points: number, count: number, pile: Card[]): string {
    if (points === 0) return '';

    const parts: string[] = [];

    // Check what caused the points
    if (count === 15) parts.push('fifteen for 2');
    if (count === 31) parts.push('thirty-one for 2');

    // Check for pairs (look at the end of the pile)
    if (pile.length >= 2) {
      const lastCard = pile[pile.length - 1];
      let pairCount = 1;
      for (let i = pile.length - 2; i >= 0; i--) {
        if (pile[i].rank === lastCard.rank) pairCount++;
        else break;
      }
      if (pairCount === 2) parts.push('pair for 2');
      else if (pairCount === 3) parts.push('three of a kind for 6');
      else if (pairCount === 4) parts.push('four of a kind for 12');
    }

    // Check for runs (simplified - just report if points came from a run)
    const pairPoints = [0, 0, 2, 6, 12][Math.min(4, this.countPairs(pile))];
    const fifteenPoints = count === 15 ? 2 : 0;
    const thirtyOnePoints = count === 31 ? 2 : 0;
    const runPoints = points - pairPoints - fifteenPoints - thirtyOnePoints;
    if (runPoints >= 3) parts.push(`run of ${runPoints} for ${runPoints}`);

    return parts.join(', ');
  }

  private countPairs(pile: Card[]): number {
    if (pile.length < 2) return 0;
    const lastCard = pile[pile.length - 1];
    let count = 1;
    for (let i = pile.length - 2; i >= 0; i--) {
      if (pile[i].rank === lastCard.rank) count++;
      else break;
    }
    return count;
  }

  private generateGameName(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
    return `${adj}-${noun}-${mat}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async createGame(socket: Socket, payload: CreateGamePayload): Promise<{ gameId: string; gameState: ClientGameState }> {
    const gameId = this.generateGameName();
    const playerId = this.generateId();

    const player: Player = {
      id: playerId,
      name: payload.playerName,
      isBot: false,
      isConnected: true,
      hand: [],
      countingHand: [],
    };

    const gameState: GameState = {
      id: gameId,
      name: gameId,
      players: [player],
      deck: [],
      crib: [],
      starter: null,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      phase: 'WAITING_FOR_PLAYERS',
      peggingState: {
        pile: [],
        currentCount: 0,
        playedCardIds: new Set(),
        consecutivePasses: 0,
        lastPlayerId: null,
      },
      scores: { [playerId]: 0 },
      winningScore: payload.winningScore,
      playerCount: payload.playerCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveGame(gameState);

    this.socketToPlayer.set(socket.id, { gameId, playerId });
    socket.join(gameId);

    // Track human player for metrics
    await this.trackHumanPlayer(payload.playerName);

    // Add bot if requested
    if (payload.addBot && gameState.players.length < payload.playerCount) {
      await this.addBot(gameId);
    }

    return { gameId, gameState: this.toClientState(gameState, playerId) };
  }

  async joinGame(socket: Socket, payload: JoinGamePayload): Promise<{ player: Player; gameState: ClientGameState }> {
    const gameState = await this.getGame(payload.gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.players.length >= gameState.playerCount) {
      throw new Error('Game is full');
    }

    if (gameState.phase !== 'WAITING_FOR_PLAYERS') {
      throw new Error('Game has already started');
    }

    const playerId = this.generateId();
    const player: Player = {
      id: playerId,
      name: payload.playerName,
      isBot: false,
      isConnected: true,
      hand: [],
      countingHand: [],
    };

    gameState.players.push(player);
    gameState.scores[playerId] = 0;
    gameState.updatedAt = Date.now();

    await this.saveGame(gameState);

    this.socketToPlayer.set(socket.id, { gameId: payload.gameId, playerId });

    // Track human player for metrics
    await this.trackHumanPlayer(payload.playerName);

    // Announce the new player
    this.announce(payload.gameId, `${player.name} joined the game :blob-wave:`);

    return { player, gameState: this.toClientState(gameState, playerId) };
  }

  async rejoinGame(socket: Socket, gameId: string, playerId: string): Promise<{ gameState: ClientGameState }> {
    const gameState = await this.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found in game');
    }

    // Re-establish the socket to player mapping
    this.socketToPlayer.set(socket.id, { gameId, playerId });

    // Mark player as connected
    player.isConnected = true;
    gameState.updatedAt = Date.now();

    await this.saveGame(gameState);

    // Announce the rejoin
    this.announce(gameId, `${player.name} reconnected :blob-wave:`);

    // Notify other players
    this.io.to(gameId).emit('player_reconnected', {
      playerId,
      playerName: player.name,
    });

    return { gameState: this.toClientState(gameState, playerId) };
  }

  async addBot(gameId: string): Promise<void> {
    const gameState = await this.getGame(gameId);
    if (!gameState) return;

    const botId = this.generateId();
    const botNames = ['Bot Alice', 'Bot Bob', 'Bot Charlie', 'Bot Diana'];
    const botName = botNames[gameState.players.length] || `Bot ${gameState.players.length + 1}`;

    const bot: Player = {
      id: botId,
      name: botName,
      isBot: true,
      isConnected: true,
      hand: [],
      countingHand: [],
    };

    gameState.players.push(bot);
    gameState.scores[botId] = 0;
    gameState.updatedAt = Date.now();

    await this.saveGame(gameState);

    const botPlayer = new BotPlayer(botId, botName, this, gameId);
    this.bots.set(botId, botPlayer);

    this.io.to(gameId).emit('player_joined', {
      player: bot,
      gameState: this.toClientState(gameState, gameState.players[0].id),
    });

    // Announce the bot
    this.announce(gameId, `${botName} joined the game :meow-wave:`);

    // Auto-start if game is full
    if (gameState.players.length === gameState.playerCount) {
      await this.startGame(gameId);
    }
  }

  async startGame(gameId: string): Promise<ClientGameState> {
    const gameState = await this.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.players.length < gameState.playerCount) {
      throw new Error('Not enough players');
    }

    // Create and shuffle deck
    gameState.deck = shuffleDeck(createDeck());

    // Deal cards
    const cardsPerPlayer = CARDS_PER_PLAYER[gameState.playerCount];
    for (const player of gameState.players) {
      const { dealt, remaining } = dealCards(gameState.deck, cardsPerPlayer);
      player.hand = dealt;
      gameState.deck = remaining;
    }

    gameState.phase = 'DISCARDING_TO_CRIB';
    gameState.updatedAt = Date.now();

    // Track game started for metrics
    await this.trackGameStarted(gameId, gameState.name, gameState.players);

    await this.saveGame(gameState);

    // Emit individual states to each player
    for (const player of gameState.players) {
      if (!player.isBot) {
        const socket = this.getSocketByPlayerId(player.id);
        if (socket) {
          socket.emit('game_started', this.toClientState(gameState, player.id));
        }
      }
    }

    // Trigger bot actions
    this.triggerBotActions(gameId);

    return this.toClientState(gameState, gameState.players[0].id);
  }

  async discardToCrib(socket: Socket, payload: DiscardToCribPayload): Promise<ClientGameState | null> {
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (!playerInfo) {
      throw new Error('Player not in a game');
    }

    return this.processDiscard(playerInfo.playerId, payload.gameId, payload.cardIds);
  }

  async processDiscard(playerId: string, gameId: string, cardIds: string[]): Promise<ClientGameState | null> {
    const gameState = await this.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.phase !== 'DISCARDING_TO_CRIB') {
      throw new Error('Not in discard phase');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const expectedDiscards = DISCARDS_PER_PLAYER[gameState.playerCount];
    if (cardIds.length !== expectedDiscards) {
      throw new Error(`Must discard exactly ${expectedDiscards} cards`);
    }

    // Move cards from hand to crib
    const discardedCards: Card[] = [];
    for (const cardId of cardIds) {
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        throw new Error('Card not in hand');
      }
      discardedCards.push(player.hand[cardIndex]);
      player.hand.splice(cardIndex, 1);
    }

    gameState.crib.push(...discardedCards);
    gameState.updatedAt = Date.now();

    // Check if all players have discarded
    const expectedCribSize = gameState.playerCount * expectedDiscards;
    if (gameState.crib.length >= expectedCribSize) {
      // Cut for starter
      const cutIndex = Math.floor(Math.random() * gameState.deck.length);
      gameState.starter = gameState.deck.splice(cutIndex, 1)[0];

      // Announce the starter card
      this.announce(gameId, `Starter card is ${cardToString(gameState.starter)}`);

      // Check for heels (Jack as starter - dealer gets 2 points)
      if (gameState.starter.rank === 'J') {
        const dealer = gameState.players[gameState.dealerIndex];
        gameState.scores[dealer.id] += 2;
        this.announce(gameId, `${dealer.name} gets 2 for his heels! :blob-hype:`);
      }

      // Store each player's hand for display during counting phase
      for (const p of gameState.players) {
        p.countingHand = [...p.hand];
        console.log(`[PRESERVE] Storing ${p.name}'s countingHand:`, p.countingHand.map(c => `${c.rank}${c.suit}`));
      }

      gameState.phase = 'PEGGING';
      gameState.currentPlayerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
      gameState.peggingState = {
        pile: [],
        currentCount: 0,
        playedCardIds: new Set(),
        consecutivePasses: 0,
        lastPlayerId: null,
      };
    }

    await this.saveGame(gameState);

    // Emit updates to all players
    this.emitGameUpdate(gameState);

    // Trigger bot actions
    this.triggerBotActions(gameId);

    return null; // Updates sent via emit
  }

  async playCard(socket: Socket, payload: PlayCardPayload): Promise<ClientGameState | null> {
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (!playerInfo) {
      throw new Error('Player not in a game');
    }

    return this.processPlayCard(playerInfo.playerId, payload.gameId, payload.cardId);
  }

  async processPlayCard(playerId: string, gameId: string, cardId: string): Promise<ClientGameState | null> {
    const gameState = await this.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.phase !== 'PEGGING') {
      throw new Error('Not in pegging phase');
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not in hand');
    }

    const card = player.hand[cardIndex];
    const cardValue = getCardValue(card);

    if (!isValidPeggingPlay(gameState.peggingState.currentCount, cardValue)) {
      throw new Error('Invalid play - would exceed 31');
    }

    // Play the card
    player.hand.splice(cardIndex, 1);
    gameState.peggingState.pile.push(card);
    gameState.peggingState.playedCardIds.add(cardId);
    gameState.peggingState.currentCount += cardValue;
    gameState.peggingState.lastPlayerId = playerId;
    gameState.peggingState.consecutivePasses = 0;

    // Score pegging points
    const peggingPoints = scorePegging(gameState.peggingState.pile, gameState.peggingState.currentCount);
    gameState.scores[playerId] += peggingPoints;

    // Announce the play
    let playAnnouncement = `${player.name} plays ${cardToString(card)} for ${gameState.peggingState.currentCount}`;
    if (peggingPoints > 0) {
      const scoreDesc = this.formatPeggingScore(peggingPoints, gameState.peggingState.currentCount, gameState.peggingState.pile);
      playAnnouncement += ` - ${scoreDesc}!`;
      if (peggingPoints >= 6) playAnnouncement += ' :blob-party:';
    }
    this.announce(gameId, playAnnouncement);

    // Check for 31 - reset pile
    if (gameState.peggingState.currentCount === 31) {
      gameState.peggingState.pile = [];
      gameState.peggingState.currentCount = 0;
    }

    // Move to next player
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    // Check if pegging is complete (all cards played)
    const allCardsPlayed = gameState.players.every(p => p.hand.length === 0);
    if (allCardsPlayed) {
      // Last card gets 1 point (if not 31)
      if (gameState.peggingState.currentCount > 0 && gameState.peggingState.currentCount < 31) {
        gameState.scores[playerId] += 1;
        this.announce(gameId, `${player.name} gets 1 for last card`);
      }
      gameState.phase = 'COUNTING_HANDS';
      gameState.currentPlayerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
      this.announce(gameId, `Pegging complete! Time to count hands.`);
    } else {
      // Check for Go
      this.checkForGoAndHandle(gameState, gameId);
    }

    gameState.updatedAt = Date.now();
    await this.saveGame(gameState);

    this.emitGameUpdate(gameState);
    this.triggerBotActions(gameId);

    return null;
  }

  async pass(socket: Socket, gameId: string): Promise<ClientGameState | null> {
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (!playerInfo) {
      throw new Error('Player not in a game');
    }

    return this.processPass(playerInfo.playerId, gameId);
  }

  async processPass(playerId: string, gameId: string): Promise<ClientGameState | null> {
    const gameState = await this.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    if (gameState.phase !== 'PEGGING') {
      throw new Error('Not in pegging phase');
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    // Verify player cannot play
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const canPlay = player.hand.some(card => {
      const value = getCardValue(card);
      return gameState.peggingState.currentCount + value <= 31;
    });

    if (canPlay) {
      throw new Error('You must play a card if possible');
    }

    gameState.peggingState.consecutivePasses++;
    this.announce(gameId, `${player.name} says "Go"`);
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    // If all players pass, give point to last player and reset
    if (gameState.peggingState.consecutivePasses >= gameState.players.length) {
      if (gameState.peggingState.lastPlayerId) {
        const lastPlayer = gameState.players.find(p => p.id === gameState.peggingState.lastPlayerId);
        gameState.scores[gameState.peggingState.lastPlayerId] += 1; // Go point
        if (lastPlayer) {
          this.announce(gameId, `${lastPlayer.name} gets 1 for the Go`);
        }
      }
      gameState.peggingState.pile = [];
      gameState.peggingState.currentCount = 0;
      gameState.peggingState.consecutivePasses = 0;
    }

    gameState.updatedAt = Date.now();
    await this.saveGame(gameState);

    this.emitGameUpdate(gameState);
    this.triggerBotActions(gameId);

    return null;
  }

  private checkForGoAndHandle(gameState: GameState, gameId: string): void {
    // Skip players who can't play
    let attempts = 0;
    while (attempts < gameState.players.length) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const canPlay = currentPlayer.hand.some(card => {
        const value = getCardValue(card);
        return gameState.peggingState.currentCount + value <= 31;
      });

      if (canPlay || currentPlayer.hand.length === 0) {
        break;
      }

      // This player must pass automatically
      if (currentPlayer.hand.length > 0) {
        this.announce(gameId, `${currentPlayer.name} says "Go"`);
      }

      gameState.peggingState.consecutivePasses++;
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      attempts++;
    }

    // If all players passed, give Go point and reset
    if (gameState.peggingState.consecutivePasses >= gameState.players.length) {
      if (gameState.peggingState.lastPlayerId) {
        const lastPlayer = gameState.players.find(p => p.id === gameState.peggingState.lastPlayerId);
        gameState.scores[gameState.peggingState.lastPlayerId] += 1;
        if (lastPlayer) {
          this.announce(gameId, `${lastPlayer.name} gets 1 for the Go`);
        }
      }
      gameState.peggingState.pile = [];
      gameState.peggingState.currentCount = 0;
      gameState.peggingState.consecutivePasses = 0;
    }
  }

  async continueToNextPhase(socket: Socket, gameId: string): Promise<ClientGameState | null> {
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (!playerInfo) {
      throw new Error('Player not in a game');
    }

    const gameState = await this.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    // Validate that the clicking player is the one whose turn it is to score
    if (gameState.phase === 'COUNTING_HANDS') {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (playerInfo.playerId !== currentPlayer.id) {
        throw new Error('It is not your turn to score');
      }
    } else if (gameState.phase === 'COUNTING_CRIB') {
      const dealer = gameState.players[gameState.dealerIndex];
      if (playerInfo.playerId !== dealer.id) {
        throw new Error('Only the dealer can score the crib');
      }
    }

    if (gameState.phase === 'COUNTING_HANDS') {
      // Score current player's hand (use countingHand which was preserved before pegging)
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const handToScore = currentPlayer.countingHand;

      console.log(`[COUNTING] Scoring ${currentPlayer.name}'s hand:`, handToScore.map(c => `${c.rank}${c.suit}`));

      const score = scoreHand(handToScore, gameState.starter!);
      gameState.scores[currentPlayer.id] += score.total;

      // Announce hand score
      const handStr = handToScore.map(c => cardToString(c)).join(' ');
      let announcement = `${currentPlayer.name}'s hand: ${handStr} = ${score.total} points`;
      if (score.total === 0) announcement += ' :blob-cry:';
      else if (score.total >= 12) announcement += ' :blob-party:';
      else if (score.total >= 8) announcement += ' :blob-happy:';
      this.announce(gameId, announcement);

      // Check for winner after hand scoring
      if (gameState.scores[currentPlayer.id] >= gameState.winningScore) {
        this.announce(gameId, `${currentPlayer.name} wins with ${gameState.scores[currentPlayer.id]} points! :blob-party: :blob-party: :blob-party:`);
        await this.trackGameEnded(gameId, currentPlayer.name);
        gameState.phase = 'GAME_OVER';
      } else {
        // Move to next player (wrapping around)
        const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

        // We've counted all hands when we return to the player after the dealer
        const firstCountingPlayer = (gameState.dealerIndex + 1) % gameState.players.length;

        console.log(`[COUNTING] currentIndex=${gameState.currentPlayerIndex}, nextIndex=${nextPlayerIndex}, firstCountingPlayer=${firstCountingPlayer}, dealerIndex=${gameState.dealerIndex}`);

        if (nextPlayerIndex === firstCountingPlayer) {
          // All hands counted, move to crib
          gameState.phase = 'COUNTING_CRIB';
          gameState.currentPlayerIndex = gameState.dealerIndex;
          console.log(`[COUNTING] All hands counted, moving to COUNTING_CRIB`);
        } else {
          gameState.currentPlayerIndex = nextPlayerIndex;
        }
      }
    } else if (gameState.phase === 'COUNTING_CRIB') {
      // Score crib
      const dealer = gameState.players[gameState.dealerIndex];
      const score = scoreCrib(gameState.crib, gameState.starter!);
      gameState.scores[dealer.id] += score.total;

      // Announce crib score
      const cribStr = gameState.crib.map(c => cardToString(c)).join(' ');
      let announcement = `${dealer.name}'s crib: ${cribStr} = ${score.total} points`;
      if (score.total === 0) announcement += ' :blob-cry:';
      else if (score.total >= 12) announcement += ' :blob-hype:';
      else if (score.total >= 8) announcement += ' :blob-happy:';
      this.announce(gameId, announcement);

      // Check for winner
      const winner = Object.entries(gameState.scores).find(([_, s]) => s >= gameState.winningScore);
      if (winner) {
        const winningPlayer = gameState.players.find(p => p.id === winner[0]);
        if (winningPlayer) {
          this.announce(gameId, `${winningPlayer.name} wins with ${winner[1]} points! :blob-party: :blob-party: :blob-party:`);
          // Track game ended for metrics
          await this.trackGameEnded(gameId, winningPlayer.name);
        }
        gameState.phase = 'GAME_OVER';
      } else {
        // Start new round
        gameState.dealerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
        const newDealer = gameState.players[gameState.dealerIndex];
        gameState.deck = shuffleDeck(createDeck());
        gameState.crib = [];
        gameState.starter = null;

        const cardsPerPlayer = CARDS_PER_PLAYER[gameState.playerCount];
        for (const player of gameState.players) {
          const { dealt, remaining } = dealCards(gameState.deck, cardsPerPlayer);
          player.hand = dealt;
          gameState.deck = remaining;
        }

        gameState.phase = 'DISCARDING_TO_CRIB';
        gameState.currentPlayerIndex = (gameState.dealerIndex + 1) % gameState.players.length;
        gameState.peggingState = {
          pile: [],
          currentCount: 0,
          playedCardIds: new Set(),
          consecutivePasses: 0,
          lastPlayerId: null,
        };

        this.announce(gameId, `New round! ${newDealer.name} is the dealer.`);
      }
    }

    gameState.updatedAt = Date.now();
    await this.saveGame(gameState);

    this.emitGameUpdate(gameState);
    this.triggerBotActions(gameId);

    return null;
  }

  private triggerBotActions(gameId: string): void {
    setTimeout(async () => {
      const gameState = await this.getGame(gameId);
      if (!gameState) return;

      for (const player of gameState.players) {
        if (player.isBot) {
          const bot = this.bots.get(player.id);
          if (bot) {
            await bot.takeTurn(gameState);
          }
        }
      }
    }, 500); // Small delay for better UX
  }

  handleDisconnect(socket: Socket): void {
    const playerInfo = this.socketToPlayer.get(socket.id);
    if (playerInfo) {
      this.socketToPlayer.delete(socket.id);
      // Mark player as disconnected
      this.getGame(playerInfo.gameId).then(async gameState => {
        if (gameState) {
          const player = gameState.players.find(p => p.id === playerInfo.playerId);
          if (player) {
            player.isConnected = false;

            // Check if any human players are still connected
            const connectedHumans = gameState.players.filter(p => !p.isBot && p.isConnected);

            if (connectedHumans.length === 0) {
              // No humans left - clean up the game
              await this.deleteGame(playerInfo.gameId);
              console.log(`Game ${playerInfo.gameId} deleted - no human players remaining`);

              // Clean up any bots associated with this game
              for (const p of gameState.players) {
                if (p.isBot) {
                  this.bots.delete(p.id);
                }
              }
            } else {
              // Still have humans - just save and notify
              await this.saveGame(gameState);
              this.io.to(playerInfo.gameId).emit('player_disconnected', {
                playerId: playerInfo.playerId,
                playerName: player.name,
              });
              // Announce the disconnect
              this.announce(playerInfo.gameId, `${player.name} left the game :blob-cry:`);
            }
          }
        }
      });
    }
  }

  private async deleteGame(gameId: string): Promise<void> {
    const key = `game:${gameId}`;
    await this.redis.del(key);
  }

  getPlayerId(socket: Socket): string {
    const info = this.socketToPlayer.get(socket.id);
    return info?.playerId || '';
  }

  async getPlayerName(gameId: string, playerId: string): Promise<string> {
    const gameState = await this.getGame(gameId);
    if (!gameState) return 'Unknown';
    const player = gameState.players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  }

  private async saveGame(gameState: GameState): Promise<void> {
    const key = `game:${gameState.id}`;
    // Convert Set to Array for JSON serialization
    const serializable = {
      ...gameState,
      peggingState: {
        ...gameState.peggingState,
        playedCardIds: Array.from(gameState.peggingState.playedCardIds),
      },
    };
    await this.redis.setex(key, GAME_TTL_SECONDS, JSON.stringify(serializable));
  }

  async getGame(gameId: string): Promise<GameState | null> {
    const key = `game:${gameId}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Convert Array back to Set
    return {
      ...parsed,
      peggingState: {
        ...parsed.peggingState,
        playedCardIds: new Set(parsed.peggingState.playedCardIds),
      },
    };
  }

  private toClientState(gameState: GameState, playerId: string): ClientGameState {
    const isCountingPhase = gameState.phase === 'COUNTING_HANDS' || gameState.phase === 'COUNTING_CRIB';

    return {
      id: gameState.id,
      name: gameState.name,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        isConnected: p.isConnected,
        handCount: p.hand.length,
        hand: p.id === playerId ? p.hand : undefined,
        // Include countingHand for all players during counting phases
        countingHand: isCountingPhase ? p.countingHand : undefined,
        teamId: p.teamId,
      })),
      cribCount: gameState.crib.length,
      // Show crib during COUNTING_CRIB phase
      crib: gameState.phase === 'COUNTING_CRIB' ? gameState.crib : undefined,
      starter: gameState.starter,
      currentPlayerIndex: gameState.currentPlayerIndex,
      dealerIndex: gameState.dealerIndex,
      phase: gameState.phase,
      peggingState: {
        pile: gameState.peggingState.pile,
        currentCount: gameState.peggingState.currentCount,
        playedCardIds: Array.from(gameState.peggingState.playedCardIds),
        consecutivePasses: gameState.peggingState.consecutivePasses,
        lastPlayerId: gameState.peggingState.lastPlayerId,
      },
      scores: gameState.scores,
      winningScore: gameState.winningScore,
      playerCount: gameState.playerCount,
      myPlayerId: playerId,
    };
  }

  private emitGameUpdate(gameState: GameState): void {
    for (const player of gameState.players) {
      if (!player.isBot) {
        const socket = this.getSocketByPlayerId(player.id);
        if (socket) {
          socket.emit('game_updated', this.toClientState(gameState, player.id));
        }
      }
    }
  }

  private getSocketByPlayerId(playerId: string): Socket | null {
    for (const [socketId, info] of this.socketToPlayer) {
      if (info.playerId === playerId) {
        return this.io.sockets.sockets.get(socketId) || null;
      }
    }
    return null;
  }
}
