import type { Suit, Rank } from './types.js';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const RANK_VALUES: Record<Rank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 10,
  'Q': 10,
  'K': 10,
};

export const RANK_ORDER: Record<Rank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
};

export const DEFAULT_WINNING_SCORE = 121;
export const GAME_TTL_SECONDS = 7200; // 2 hours

// Cards dealt per player based on game type
export const CARDS_PER_PLAYER: Record<2 | 4, number> = {
  2: 6,
  4: 5,
};

// Cards each player discards to crib
export const DISCARDS_PER_PLAYER: Record<2 | 4, number> = {
  2: 2,
  4: 1,
};

// Game name word lists for generating memorable names
export const ADJECTIVES = [
  'red', 'blue', 'green', 'golden', 'silver', 'purple', 'orange', 'crimson',
  'azure', 'jade', 'coral', 'amber', 'ivory', 'scarlet', 'violet', 'indigo',
  'rusty', 'dusty', 'misty', 'stormy', 'sunny', 'cloudy', 'frosty', 'fiery',
  'swift', 'quiet', 'bold', 'brave', 'clever', 'gentle', 'mighty', 'noble',
];

export const NOUNS = [
  'dragon', 'phoenix', 'griffin', 'unicorn', 'tiger', 'eagle', 'falcon', 'raven',
  'wolf', 'bear', 'lion', 'panther', 'cobra', 'viper', 'hawk', 'owl',
  'storm', 'thunder', 'lightning', 'blizzard', 'tornado', 'volcano', 'glacier', 'canyon',
  'castle', 'tower', 'fortress', 'citadel', 'palace', 'temple', 'shrine', 'beacon',
];

export const MATERIALS = [
  'velvet', 'silk', 'satin', 'linen', 'cotton', 'leather', 'suede', 'denim',
  'marble', 'granite', 'obsidian', 'crystal', 'diamond', 'ruby', 'emerald', 'sapphire',
  'oak', 'maple', 'cedar', 'pine', 'birch', 'willow', 'bamboo', 'teak',
  'bronze', 'copper', 'iron', 'steel', 'titanium', 'platinum', 'gold', 'silver',
];
