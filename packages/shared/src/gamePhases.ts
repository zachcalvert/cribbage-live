import type { GamePhase } from './types.js';

export const PHASE_ORDER: GamePhase[] = [
  'WAITING_FOR_PLAYERS',
  'DEALING',
  'DISCARDING_TO_CRIB',
  'CUT_FOR_STARTER',
  'PEGGING',
  'COUNTING_HANDS',
  'COUNTING_CRIB',
  'GAME_OVER',
];

export function getPhaseDescription(phase: GamePhase): string {
  switch (phase) {
    case 'WAITING_FOR_PLAYERS':
      return 'Waiting for players to join...';
    case 'DEALING':
      return 'Dealing cards...';
    case 'DISCARDING_TO_CRIB':
      return 'Select cards to discard to the crib';
    case 'CUT_FOR_STARTER':
      return 'Cutting for the starter card...';
    case 'PEGGING':
      return 'Pegging phase - play your cards!';
    case 'COUNTING_HANDS':
      return 'Counting hands...';
    case 'COUNTING_CRIB':
      return 'Counting the crib...';
    case 'GAME_OVER':
      return 'Game over!';
    default:
      return 'Unknown phase';
  }
}

export function isPlayerActionRequired(phase: GamePhase): boolean {
  return phase === 'DISCARDING_TO_CRIB' || phase === 'PEGGING';
}

export function canStartGame(phase: GamePhase, playerCount: number, requiredPlayers: number): boolean {
  return phase === 'WAITING_FOR_PLAYERS' && playerCount >= requiredPlayers;
}

export function getNextPhase(currentPhase: GamePhase, isRoundComplete: boolean): GamePhase {
  switch (currentPhase) {
    case 'WAITING_FOR_PLAYERS':
      return 'DEALING';
    case 'DEALING':
      return 'DISCARDING_TO_CRIB';
    case 'DISCARDING_TO_CRIB':
      return 'CUT_FOR_STARTER';
    case 'CUT_FOR_STARTER':
      return 'PEGGING';
    case 'PEGGING':
      return 'COUNTING_HANDS';
    case 'COUNTING_HANDS':
      return 'COUNTING_CRIB';
    case 'COUNTING_CRIB':
      return isRoundComplete ? 'GAME_OVER' : 'DEALING';
    default:
      return 'GAME_OVER';
  }
}
