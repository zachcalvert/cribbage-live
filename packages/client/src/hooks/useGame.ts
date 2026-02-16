import { useContext } from 'react';
import { useGame as useGameContext } from '../context/GameContext';

// Re-export the hook from context for convenience
export function useGameActions() {
  const context = useGameContext();

  return {
    createGame: context.createGame,
    joinGame: context.joinGame,
    startGame: context.startGame,
    discardToCrib: context.discardToCrib,
    playCard: context.playCard,
    pass: context.pass,
    continueGame: context.continueGame,
    sendChat: context.sendChat,
    clearError: context.clearError,
  };
}

export function useGameState() {
  const context = useGameContext();

  return {
    gameState: context.gameState,
    messages: context.messages,
    isConnected: context.isConnected,
    error: context.error,
    isLoading: context.isLoading,
  };
}
