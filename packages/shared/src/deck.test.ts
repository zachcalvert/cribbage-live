import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  getCardValue,
  isValidPeggingPlay,
  canPlayCard,
  cardToString,
} from './deck';

describe('createDeck', () => {
  it('creates a deck of 52 cards', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
  });

  it('has 4 suits with 13 cards each', () => {
    const deck = createDeck();
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

    for (const suit of suits) {
      const suitCards = deck.filter((card) => card.suit === suit);
      expect(suitCards.length).toBe(13);
    }
  });

  it('has unique card IDs', () => {
    const deck = createDeck();
    const ids = deck.map((card) => card.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(52);
  });
});

describe('shuffleDeck', () => {
  it('returns a deck of 52 cards', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(52);
  });

  it('does not modify the original deck', () => {
    const deck = createDeck();
    const originalFirst = deck[0].id;
    shuffleDeck(deck);
    expect(deck[0].id).toBe(originalFirst);
  });

  it('produces different orders on multiple shuffles', () => {
    const deck = createDeck();
    const shuffled1 = shuffleDeck(deck);
    const shuffled2 = shuffleDeck(deck);

    // Check if at least one card is in a different position
    // (extremely unlikely to get same order twice)
    let hasDifference = false;
    for (let i = 0; i < 52; i++) {
      if (shuffled1[i].id !== shuffled2[i].id) {
        hasDifference = true;
        break;
      }
    }
    expect(hasDifference).toBe(true);
  });
});

describe('dealCards', () => {
  it('deals the correct number of cards', () => {
    const deck = createDeck();
    const { dealt, remaining } = dealCards(deck, 6);
    expect(dealt.length).toBe(6);
    expect(remaining.length).toBe(46);
  });

  it('removes dealt cards from remaining deck', () => {
    const deck = createDeck();
    const { dealt, remaining } = dealCards(deck, 6);

    for (const card of dealt) {
      expect(remaining.find((c) => c.id === card.id)).toBeUndefined();
    }
  });
});

describe('getCardValue', () => {
  it('returns 1 for Ace', () => {
    expect(getCardValue({ id: '1', suit: 'hearts', rank: 'A' })).toBe(1);
  });

  it('returns face value for number cards', () => {
    expect(getCardValue({ id: '1', suit: 'hearts', rank: '5' })).toBe(5);
    expect(getCardValue({ id: '1', suit: 'hearts', rank: '10' })).toBe(10);
  });

  it('returns 10 for face cards', () => {
    expect(getCardValue({ id: '1', suit: 'hearts', rank: 'J' })).toBe(10);
    expect(getCardValue({ id: '1', suit: 'hearts', rank: 'Q' })).toBe(10);
    expect(getCardValue({ id: '1', suit: 'hearts', rank: 'K' })).toBe(10);
  });
});

describe('isValidPeggingPlay', () => {
  it('returns true when play keeps count at or below 31', () => {
    expect(isValidPeggingPlay(20, 10)).toBe(true);
    expect(isValidPeggingPlay(30, 1)).toBe(true);
    expect(isValidPeggingPlay(0, 10)).toBe(true);
  });

  it('returns false when play exceeds 31', () => {
    expect(isValidPeggingPlay(25, 10)).toBe(false);
    expect(isValidPeggingPlay(31, 1)).toBe(false);
  });
});

describe('canPlayCard', () => {
  it('returns true when at least one card can be played', () => {
    const hand = [
      { id: '1', suit: 'hearts' as const, rank: 'A' as const },
      { id: '2', suit: 'spades' as const, rank: 'K' as const },
    ];
    expect(canPlayCard(hand, 30)).toBe(true); // Ace can be played
  });

  it('returns false when no cards can be played', () => {
    const hand = [
      { id: '1', suit: 'hearts' as const, rank: '5' as const },
      { id: '2', suit: 'spades' as const, rank: 'K' as const },
    ];
    expect(canPlayCard(hand, 27)).toBe(false); // 5 and K both exceed 31
  });
});

describe('cardToString', () => {
  it('formats cards correctly', () => {
    expect(cardToString({ id: '1', suit: 'hearts', rank: 'A' })).toBe('A♥');
    expect(cardToString({ id: '1', suit: 'spades', rank: 'K' })).toBe('K♠');
    expect(cardToString({ id: '1', suit: 'diamonds', rank: '10' })).toBe('10♦');
    expect(cardToString({ id: '1', suit: 'clubs', rank: 'J' })).toBe('J♣');
  });
});
