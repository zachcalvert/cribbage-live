import type { GameState, Card } from '@cribbage/shared';
import { getCardValue, scoreHand, calculateHandValue } from '@cribbage/shared';
import type { GameManager } from './GameManager.js';

type BotDifficulty = 'easy' | 'medium' | 'hard';

export class BotPlayer {
  private id: string;
  private name: string;
  private gameManager: GameManager;
  private gameId: string;
  private difficulty: BotDifficulty;

  constructor(
    id: string,
    name: string,
    gameManager: GameManager,
    gameId: string,
    difficulty: BotDifficulty = 'medium'
  ) {
    this.id = id;
    this.name = name;
    this.gameManager = gameManager;
    this.gameId = gameId;
    this.difficulty = difficulty;
  }

  async takeTurn(gameState: GameState): Promise<void> {
    const player = gameState.players.find(p => p.id === this.id);
    if (!player) return;

    switch (gameState.phase) {
      case 'DISCARDING_TO_CRIB':
        await this.handleDiscard(gameState, player.hand);
        break;
      case 'PEGGING':
        if (gameState.players[gameState.currentPlayerIndex].id === this.id) {
          await this.handlePegging(gameState, player.hand);
        }
        break;
      case 'COUNTING_HANDS':
      case 'COUNTING_CRIB':
        // Bots auto-continue through counting phases
        // Human players control the pace
        break;
    }
  }

  private async handleDiscard(gameState: GameState, hand: Card[]): Promise<void> {
    const player = gameState.players.find(p => p.id === this.id);
    if (!player || player.hand.length === 0) return;

    // Already discarded
    const expectedHandSize = gameState.playerCount === 2 ? 4 : 4;
    if (hand.length <= expectedHandSize) return;

    const discardCount = gameState.playerCount === 2 ? 2 : 1;
    const cardsToDiscard = this.selectCardsToDiscard(hand, discardCount, gameState);

    try {
      await this.gameManager.processDiscard(this.id, this.gameId, cardsToDiscard.map(c => c.id));
    } catch (error) {
      console.error(`Bot ${this.name} discard error:`, error);
    }
  }

  private selectCardsToDiscard(hand: Card[], count: number, gameState: GameState): Card[] {
    if (this.difficulty === 'easy') {
      // Random selection
      const shuffled = [...hand].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    // Medium/Hard: Try to maximize hand value
    const combinations = this.getCombinations(hand, count);
    let bestDiscard: Card[] = combinations[0];
    let bestValue = -Infinity;

    // Create a pool of possible starters (remaining deck)
    const usedCardIds = new Set(hand.map(c => c.id));
    const possibleStarters = gameState.deck.filter(c => !usedCardIds.has(c.id));

    for (const discard of combinations) {
      const keptCards = hand.filter(c => !discard.includes(c));
      const value = calculateHandValue(keptCards, possibleStarters.slice(0, 10)); // Sample starters

      // Penalty for discarding to opponent's crib
      const isOurCrib = gameState.players[gameState.dealerIndex].id === this.id;
      const discardValue = this.evaluateDiscardValue(discard);
      const adjustedValue = isOurCrib ? value + discardValue * 0.5 : value - discardValue * 0.3;

      if (adjustedValue > bestValue) {
        bestValue = adjustedValue;
        bestDiscard = discard;
      }
    }

    return bestDiscard;
  }

  private evaluateDiscardValue(cards: Card[]): number {
    // Estimate how valuable these cards might be in a crib
    let value = 0;

    // Fifteens potential
    const sum = cards.reduce((acc, c) => acc + getCardValue(c), 0);
    if (sum === 15) value += 2;
    if (sum === 5) value += 1; // Could combine with 10-value card

    // Pairs
    if (cards.length === 2 && cards[0].rank === cards[1].rank) {
      value += 2;
    }

    // Fives are valuable
    for (const card of cards) {
      if (card.rank === '5') value += 1;
    }

    return value;
  }

  private async handlePegging(gameState: GameState, hand: Card[]): Promise<void> {
    const playableCards = hand.filter(card => {
      const value = getCardValue(card);
      return gameState.peggingState.currentCount + value <= 31;
    });

    if (playableCards.length === 0) {
      // Must pass (Go)
      try {
        await this.gameManager.processPass(this.id, this.gameId);
      } catch (error) {
        console.error(`Bot ${this.name} pass error:`, error);
      }
      return;
    }

    const cardToPlay = this.selectCardToPlay(playableCards, gameState);

    try {
      await this.gameManager.processPlayCard(this.id, this.gameId, cardToPlay.id);
    } catch (error) {
      console.error(`Bot ${this.name} play error:`, error);
    }
  }

  private selectCardToPlay(playableCards: Card[], gameState: GameState): Card {
    if (this.difficulty === 'easy') {
      // Random selection
      return playableCards[Math.floor(Math.random() * playableCards.length)];
    }

    // Medium/Hard: Use heuristics
    let bestCard = playableCards[0];
    let bestScore = -Infinity;

    for (const card of playableCards) {
      const value = getCardValue(card);
      const newCount = gameState.peggingState.currentCount + value;
      let score = 0;

      // Hitting 15 or 31 is good
      if (newCount === 15) score += 3;
      if (newCount === 31) score += 3;

      // Pairs from pile
      const pile = gameState.peggingState.pile;
      if (pile.length > 0 && pile[pile.length - 1].rank === card.rank) {
        score += 2;
      }

      // Avoid giving opponent easy 15
      if (newCount === 5 || newCount === 10 || newCount === 21) {
        score -= 1;
      }

      // Prefer playing higher cards early
      if (gameState.peggingState.currentCount < 15) {
        score += value * 0.1;
      }

      // Save low cards for endgame
      if (gameState.peggingState.currentCount > 20 && value <= 5) {
        score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
      }
    }

    return bestCard;
  }

  private getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 0) return [[]];
    if (arr.length === 0) return [];

    const [first, ...rest] = arr;
    const withFirst = this.getCombinations(rest, size - 1).map(c => [first, ...c]);
    const withoutFirst = this.getCombinations(rest, size);

    return [...withFirst, ...withoutFirst];
  }
}
