export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  hand: Card[];
  countingHand: Card[]; // Preserved for display during counting phase
  teamId?: number; // For 4-player team games
}

export type GamePhase =
  | 'WAITING_FOR_PLAYERS'
  | 'DEALING'
  | 'DISCARDING_TO_CRIB'
  | 'CUT_FOR_STARTER'
  | 'PEGGING'
  | 'COUNTING_HANDS'
  | 'COUNTING_CRIB'
  | 'GAME_OVER';

export interface PeggingState {
  pile: Card[];
  currentCount: number;
  playedCardIds: Set<string>;
  consecutivePasses: number;
  lastPlayerId: string | null;
}

export interface GameState {
  id: string;
  name: string;
  players: Player[];
  deck: Card[];
  crib: Card[];
  starter: Card | null;
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  peggingState: PeggingState;
  scores: Record<string, number>;
  winningScore: number;
  playerCount: 2 | 4;
  createdAt: number;
  updatedAt: number;
}

export interface ScoreBreakdown {
  fifteens: number;
  pairs: number;
  runs: number;
  flush: number;
  nobs: number;
  total: number;
  details: string[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

// Socket event payloads
export interface CreateGamePayload {
  playerName: string;
  playerCount: 2 | 4;
  winningScore: number;
  addBot?: boolean;
}

export interface JoinGamePayload {
  gameId: string;
  playerName: string;
}

export interface DiscardToCribPayload {
  gameId: string;
  cardIds: string[];
}

export interface PlayCardPayload {
  gameId: string;
  cardId: string;
}

export interface SendChatPayload {
  gameId: string;
  message: string;
}

// Client-side game state (with hidden info redacted)
export interface ClientGameState {
  id: string;
  name: string;
  players: ClientPlayer[];
  cribCount: number;
  crib?: Card[]; // Shown during COUNTING_CRIB phase
  starter: Card | null;
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  peggingState: ClientPeggingState;
  scores: Record<string, number>;
  winningScore: number;
  playerCount: 2 | 4;
  myPlayerId: string;
}

export interface ClientPlayer {
  id: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  handCount: number;
  hand?: Card[]; // Only present for the current player during pegging
  countingHand?: Card[]; // Shown during counting phases
  teamId?: number;
}

export interface ClientPeggingState {
  pile: Card[];
  currentCount: number;
  playedCardIds: string[];
  consecutivePasses: number;
  lastPlayerId: string | null;
}
