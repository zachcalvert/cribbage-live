import { describe, it, expect } from 'vitest';
import { scoreHand, scoreCrib, scorePegging } from './scoring';
import type { Card } from './types';

function createCard(rank: string, suit: string): Card {
  return { id: `${rank}-${suit}`, rank: rank as Card['rank'], suit: suit as Card['suit'] };
}

describe('scoreHand', () => {
  it('scores fifteens correctly', () => {
    // 5 + 10 = 15 (2 points), 2 + 3 + 10 = 15 (2 more points)
    const hand: Card[] = [
      createCard('5', 'hearts'),
      createCard('10', 'spades'),
      createCard('2', 'clubs'),
      createCard('3', 'diamonds'),
    ];
    const starter = createCard('A', 'hearts');
    const score = scoreHand(hand, starter);
    expect(score.fifteens).toBe(4); // Two ways to make 15
  });

  it('scores pairs correctly', () => {
    // Pair of 5s (2 points)
    const hand: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
      createCard('2', 'clubs'),
      createCard('3', 'diamonds'),
    ];
    const starter = createCard('A', 'hearts');
    const score = scoreHand(hand, starter);
    expect(score.pairs).toBe(2);
  });

  it('scores three of a kind correctly', () => {
    // Three 5s = 3 pairs = 6 points
    const hand: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
      createCard('5', 'clubs'),
      createCard('3', 'diamonds'),
    ];
    const starter = createCard('A', 'hearts');
    const score = scoreHand(hand, starter);
    expect(score.pairs).toBe(6);
  });

  it('scores four of a kind correctly', () => {
    // Four 5s = 6 pairs = 12 points
    const hand: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
      createCard('5', 'clubs'),
      createCard('5', 'diamonds'),
    ];
    const starter = createCard('A', 'hearts');
    const score = scoreHand(hand, starter);
    expect(score.pairs).toBe(12);
  });

  it('scores runs correctly', () => {
    // Run of 3 (A-2-3)
    const hand: Card[] = [
      createCard('A', 'hearts'),
      createCard('2', 'spades'),
      createCard('3', 'clubs'),
      createCard('7', 'diamonds'),
    ];
    const starter = createCard('9', 'hearts');
    const score = scoreHand(hand, starter);
    expect(score.runs).toBe(3);
  });

  it('scores double run correctly', () => {
    // Two runs of 3: A-2-3, A-2-3 (6 points total)
    const hand: Card[] = [
      createCard('A', 'hearts'),
      createCard('A', 'spades'),
      createCard('2', 'clubs'),
      createCard('3', 'diamonds'),
    ];
    const starter = createCard('9', 'hearts');
    const score = scoreHand(hand, starter);
    expect(score.runs).toBe(6);
  });

  it('scores flush of 4 in hand correctly', () => {
    const hand: Card[] = [
      createCard('A', 'hearts'),
      createCard('3', 'hearts'),
      createCard('5', 'hearts'),
      createCard('7', 'hearts'),
    ];
    const starter = createCard('9', 'spades'); // Different suit
    const score = scoreHand(hand, starter);
    expect(score.flush).toBe(4);
  });

  it('scores flush of 5 correctly', () => {
    const hand: Card[] = [
      createCard('A', 'hearts'),
      createCard('3', 'hearts'),
      createCard('5', 'hearts'),
      createCard('7', 'hearts'),
    ];
    const starter = createCard('9', 'hearts'); // Same suit
    const score = scoreHand(hand, starter);
    expect(score.flush).toBe(5);
  });

  it('scores nobs correctly', () => {
    const hand: Card[] = [
      createCard('J', 'hearts'),
      createCard('3', 'spades'),
      createCard('5', 'clubs'),
      createCard('7', 'diamonds'),
    ];
    const starter = createCard('9', 'hearts'); // Jack matches starter suit
    const score = scoreHand(hand, starter);
    expect(score.nobs).toBe(1);
  });

  it('scores the perfect hand (29)', () => {
    // 5-5-5-J with 5 as starter (Jack matches suit)
    const hand: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
      createCard('5', 'clubs'),
      createCard('J', 'diamonds'),
    ];
    const starter = createCard('5', 'diamonds');
    const score = scoreHand(hand, starter);
    expect(score.total).toBe(29);
  });

  it('scores zero for no combinations', () => {
    // Cards chosen to avoid any 15s, pairs, runs, or flushes
    const hand: Card[] = [
      createCard('A', 'hearts'),
      createCard('3', 'spades'),
      createCard('7', 'clubs'),
      createCard('9', 'diamonds'),
    ];
    const starter = createCard('Q', 'hearts'); // Diff suit, no 15s possible
    const score = scoreHand(hand, starter);
    expect(score.total).toBe(0);
  });
});

describe('scoreCrib', () => {
  it('does not score flush of 4 in crib', () => {
    // Crib requires 5-card flush
    const crib: Card[] = [
      createCard('A', 'hearts'),
      createCard('3', 'hearts'),
      createCard('5', 'hearts'),
      createCard('7', 'hearts'),
    ];
    const starter = createCard('9', 'spades'); // Different suit
    const score = scoreCrib(crib, starter);
    expect(score.flush).toBe(0);
  });

  it('scores flush of 5 in crib', () => {
    const crib: Card[] = [
      createCard('A', 'hearts'),
      createCard('3', 'hearts'),
      createCard('5', 'hearts'),
      createCard('7', 'hearts'),
    ];
    const starter = createCard('9', 'hearts'); // Same suit
    const score = scoreCrib(crib, starter);
    expect(score.flush).toBe(5);
  });
});

describe('scorePegging', () => {
  it('scores 2 points for hitting 15', () => {
    const pile: Card[] = [
      createCard('5', 'hearts'),
      createCard('10', 'spades'),
    ];
    const points = scorePegging(pile, 15);
    expect(points).toBe(2);
  });

  it('scores 2 points for hitting 31', () => {
    const pile: Card[] = [
      createCard('10', 'hearts'),
      createCard('10', 'spades'),
      createCard('10', 'clubs'),
      createCard('A', 'diamonds'),
    ];
    const points = scorePegging(pile, 31);
    expect(points).toBe(2);
  });

  it('scores 2 points for a pair', () => {
    const pile: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
    ];
    const points = scorePegging(pile, 10);
    expect(points).toBe(2);
  });

  it('scores 6 points for three of a kind', () => {
    const pile: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
      createCard('5', 'clubs'),
    ];
    const points = scorePegging(pile, 15);
    // 6 for triple + 2 for hitting 15
    expect(points).toBe(8);
  });

  it('scores 12 points for four of a kind', () => {
    const pile: Card[] = [
      createCard('5', 'hearts'),
      createCard('5', 'spades'),
      createCard('5', 'clubs'),
      createCard('5', 'diamonds'),
    ];
    const points = scorePegging(pile, 20);
    expect(points).toBe(12);
  });

  it('scores 3 points for a run of 3', () => {
    const pile: Card[] = [
      createCard('4', 'hearts'),
      createCard('3', 'spades'),
      createCard('5', 'clubs'),
    ];
    const points = scorePegging(pile, 12);
    expect(points).toBe(3);
  });

  it('scores 4 points for a run of 4', () => {
    const pile: Card[] = [
      createCard('4', 'hearts'),
      createCard('3', 'spades'),
      createCard('5', 'clubs'),
      createCard('6', 'diamonds'),
    ];
    const points = scorePegging(pile, 18);
    expect(points).toBe(4);
  });
});
