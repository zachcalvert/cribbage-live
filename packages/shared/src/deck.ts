import type { Card, Suit, Rank } from './types.js';
import { SUITS, RANKS } from './constants.js';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `card-${id++}`,
        suit,
        rank,
      });
    }
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { dealt, remaining };
}

export function getCardValue(card: Card): number {
  const values: Record<Rank, number> = {
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
  return values[card.rank];
}

export function getRankOrder(rank: Rank): number {
  const order: Record<Rank, number> = {
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
  return order[rank];
}

export function cardToString(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

export function isValidPeggingPlay(currentCount: number, cardValue: number): boolean {
  return currentCount + cardValue <= 31;
}

export function canPlayCard(hand: Card[], currentCount: number): boolean {
  return hand.some(card => isValidPeggingPlay(currentCount, getCardValue(card)));
}

export function checkForGo(hand: Card[], currentCount: number): boolean {
  return !canPlayCard(hand, currentCount);
}
