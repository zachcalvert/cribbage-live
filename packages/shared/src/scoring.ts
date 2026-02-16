import type { Card, ScoreBreakdown } from './types.js';
import { getCardValue, getRankOrder } from './deck.js';

// Get all combinations of cards of a specific size
function combinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];

  const [first, ...rest] = arr;
  const withFirst = combinations(rest, size - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, size);

  return [...withFirst, ...withoutFirst];
}

// Score fifteens (combinations that sum to 15)
function scoreFifteens(cards: Card[]): { points: number; details: string[] } {
  let points = 0;
  const details: string[] = [];

  // Check all possible combinations (2 to 5 cards)
  for (let size = 2; size <= cards.length; size++) {
    const combos = combinations(cards, size);
    for (const combo of combos) {
      const sum = combo.reduce((acc, card) => acc + getCardValue(card), 0);
      if (sum === 15) {
        points += 2;
        details.push(`Fifteen for 2 (${combo.map(c => c.rank).join(', ')})`);
      }
    }
  }

  return { points, details };
}

// Score pairs (2 points per pair)
function scorePairs(cards: Card[]): { points: number; details: string[] } {
  let points = 0;
  const details: string[] = [];

  const pairs = combinations(cards, 2);
  for (const [card1, card2] of pairs) {
    if (card1.rank === card2.rank) {
      points += 2;
      details.push(`Pair of ${card1.rank}s for 2`);
    }
  }

  return { points, details };
}

// Score runs (3+ consecutive cards)
function scoreRuns(cards: Card[]): { points: number; details: string[] } {
  const details: string[] = [];

  // Sort by rank order
  const sortedCards = [...cards].sort((a, b) => getRankOrder(a.rank) - getRankOrder(b.rank));

  // Check for runs starting from longest possible
  for (let length = cards.length; length >= 3; length--) {
    const combos = combinations(sortedCards, length);
    let foundRuns = 0;

    for (const combo of combos) {
      const sorted = [...combo].sort((a, b) => getRankOrder(a.rank) - getRankOrder(b.rank));
      let isRun = true;

      for (let i = 1; i < sorted.length; i++) {
        if (getRankOrder(sorted[i].rank) !== getRankOrder(sorted[i - 1].rank) + 1) {
          isRun = false;
          break;
        }
      }

      if (isRun) {
        foundRuns++;
        details.push(`Run of ${length} (${sorted.map(c => c.rank).join(', ')}) for ${length}`);
      }
    }

    if (foundRuns > 0) {
      // Once we find runs of a certain length, don't look for shorter ones
      // (they would be subsets of longer runs)
      return { points: foundRuns * length, details };
    }
  }

  return { points: 0, details };
}

// Score flush (4 or 5 cards of same suit)
function scoreFlush(hand: Card[], starter: Card, isCrib: boolean): { points: number; details: string[] } {
  const details: string[] = [];

  // Check hand flush (4 cards same suit)
  const suitCounts = new Map<string, number>();
  for (const card of hand) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  }

  for (const [suit, count] of suitCounts) {
    if (count === 4) {
      // All 4 hand cards are same suit
      if (starter.suit === suit) {
        details.push(`Flush of 5 for 5`);
        return { points: 5, details };
      } else if (!isCrib) {
        // In crib, flush must include starter
        details.push(`Flush of 4 for 4`);
        return { points: 4, details };
      }
    }
  }

  return { points: 0, details };
}

// Score nobs (Jack of same suit as starter)
function scoreNobs(hand: Card[], starter: Card): { points: number; details: string[] } {
  const details: string[] = [];

  for (const card of hand) {
    if (card.rank === 'J' && card.suit === starter.suit) {
      details.push(`Nobs (Jack of ${starter.suit}) for 1`);
      return { points: 1, details };
    }
  }

  return { points: 0, details };
}

export function scoreHand(hand: Card[], starter: Card): ScoreBreakdown {
  const allCards = [...hand, starter];

  const fifteens = scoreFifteens(allCards);
  const pairs = scorePairs(allCards);
  const runs = scoreRuns(allCards);
  const flush = scoreFlush(hand, starter, false);
  const nobs = scoreNobs(hand, starter);

  const total = fifteens.points + pairs.points + runs.points + flush.points + nobs.points;
  const details = [
    ...fifteens.details,
    ...pairs.details,
    ...runs.details,
    ...flush.details,
    ...nobs.details,
  ];

  return {
    fifteens: fifteens.points,
    pairs: pairs.points,
    runs: runs.points,
    flush: flush.points,
    nobs: nobs.points,
    total,
    details,
  };
}

export function scoreCrib(crib: Card[], starter: Card): ScoreBreakdown {
  const allCards = [...crib, starter];

  const fifteens = scoreFifteens(allCards);
  const pairs = scorePairs(allCards);
  const runs = scoreRuns(allCards);
  const flush = scoreFlush(crib, starter, true); // Crib flush rules are stricter
  const nobs = scoreNobs(crib, starter);

  const total = fifteens.points + pairs.points + runs.points + flush.points + nobs.points;
  const details = [
    ...fifteens.details,
    ...pairs.details,
    ...runs.details,
    ...flush.details,
    ...nobs.details,
  ];

  return {
    fifteens: fifteens.points,
    pairs: pairs.points,
    runs: runs.points,
    flush: flush.points,
    nobs: nobs.points,
    total,
    details,
  };
}

// Score pegging (played during the play phase)
export function scorePegging(pile: Card[], currentCount: number): number {
  if (pile.length === 0) return 0;

  let points = 0;

  // 15 exactly = 2 points
  if (currentCount === 15) {
    points += 2;
  }

  // 31 exactly = 2 points
  if (currentCount === 31) {
    points += 2;
  }

  // Check for pairs from the end of the pile
  const lastCard = pile[pile.length - 1];
  let pairCount = 1;
  for (let i = pile.length - 2; i >= 0; i--) {
    if (pile[i].rank === lastCard.rank) {
      pairCount++;
    } else {
      break;
    }
  }

  // 2 of a kind = 2, 3 of a kind = 6, 4 of a kind = 12
  if (pairCount === 2) points += 2;
  if (pairCount === 3) points += 6;
  if (pairCount === 4) points += 12;

  // Check for runs (from last 3+ cards)
  for (let length = pile.length; length >= 3; length--) {
    const lastCards = pile.slice(-length);
    const ranks = lastCards.map(c => getRankOrder(c.rank)).sort((a, b) => a - b);

    let isRun = true;
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] !== ranks[i - 1] + 1) {
        isRun = false;
        break;
      }
    }

    if (isRun) {
      points += length;
      break;
    }
  }

  return points;
}

// Calculate expected hand value (for bot strategy)
export function calculateHandValue(hand: Card[], possibleStarters: Card[]): number {
  let totalValue = 0;

  for (const starter of possibleStarters) {
    const score = scoreHand(hand, starter);
    totalValue += score.total;
  }

  return totalValue / possibleStarters.length;
}
