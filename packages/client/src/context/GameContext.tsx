import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ClientGameState, ChatMessage } from '@cribbage/shared';
import { useSocket } from '../hooks/useSocket';

// Store session info in localStorage for reconnection
const SESSION_KEY = 'cribbage_session';

interface SessionInfo {
  gameId: string;
  playerId: string;
}

function saveSession(gameId: string, playerId: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ gameId, playerId }));
}

function getSession(): SessionInfo | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

interface GameContextState {
  gameState: ClientGameState | null;
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
}

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: ClientGameState }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_GAME' };

const initialState: GameContextState = {
  gameState: null,
  messages: [],
  isConnected: false,
  error: null,
  isLoading: false,
};

function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload, error: null };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_GAME':
      return { ...initialState, isConnected: state.isConnected };
    default:
      return state;
  }
}

interface GameContextValue extends GameContextState {
  createGame: (playerName: string, playerCount: 2 | 4, winningScore: number, addBot?: boolean) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: (gameId: string) => void;
  discardToCrib: (gameId: string, cardIds: string[]) => void;
  playCard: (gameId: string, cardId: string) => void;
  pass: (gameId: string) => void;
  continueGame: (gameId: string) => void;
  sendChat: (gameId: string, message: string) => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket, isConnected } = useSocket();
  const hasAttemptedRejoin = useRef(false);

  useEffect(() => {
    dispatch({ type: 'SET_CONNECTED', payload: isConnected });
  }, [isConnected]);

  // Attempt to rejoin game on reconnect
  useEffect(() => {
    if (!socket || !isConnected) {
      hasAttemptedRejoin.current = false;
      return;
    }

    // Only attempt rejoin once per connection and if we don't already have a game state
    if (hasAttemptedRejoin.current || state.gameState) return;
    hasAttemptedRejoin.current = true;

    const session = getSession();
    if (session) {
      console.log('Attempting to rejoin game:', session.gameId);
      socket.emit('rejoin_game', { gameId: session.gameId, playerId: session.playerId });
    }
  }, [socket, isConnected, state.gameState]);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_created', ({ gameState }: { gameState: ClientGameState }) => {
      saveSession(gameState.id, gameState.myPlayerId);
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    socket.on('player_joined', ({ gameState }: { gameState: ClientGameState }) => {
      saveSession(gameState.id, gameState.myPlayerId);
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    socket.on('game_rejoined', ({ gameState }: { gameState: ClientGameState }) => {
      console.log('Successfully rejoined game');
      saveSession(gameState.id, gameState.myPlayerId);
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('rejoin_failed', ({ message }: { message: string }) => {
      console.log('Failed to rejoin game:', message);
      clearSession();
    });

    socket.on('game_started', (gameState: ClientGameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('game_updated', (gameState: ClientGameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('chat_message', (message: ChatMessage) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('error', ({ message }: { message: string }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
    });

    socket.on('player_disconnected', ({ playerName }: { playerName: string }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: {
        id: `system-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        message: `${playerName} disconnected`,
        timestamp: Date.now(),
      }});
    });

    socket.on('player_reconnected', ({ playerName }: { playerName: string }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: {
        id: `system-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        message: `${playerName} reconnected`,
        timestamp: Date.now(),
      }});
    });

    return () => {
      socket.off('game_created');
      socket.off('player_joined');
      socket.off('game_rejoined');
      socket.off('rejoin_failed');
      socket.off('game_started');
      socket.off('game_updated');
      socket.off('chat_message');
      socket.off('error');
      socket.off('player_disconnected');
      socket.off('player_reconnected');
    };
  }, [socket]);

  const createGame = useCallback((
    playerName: string,
    playerCount: 2 | 4,
    winningScore: number,
    addBot?: boolean
  ) => {
    if (!socket) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    socket.emit('create_game', { playerName, playerCount, winningScore, addBot });
  }, [socket]);

  const joinGame = useCallback((gameId: string, playerName: string) => {
    if (!socket) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    socket.emit('join_game', { gameId, playerName });
  }, [socket]);

  const startGame = useCallback((gameId: string) => {
    if (!socket) return;
    socket.emit('start_game', { gameId });
  }, [socket]);

  const discardToCrib = useCallback((gameId: string, cardIds: string[]) => {
    if (!socket) return;
    socket.emit('discard_to_crib', { gameId, cardIds });
  }, [socket]);

  const playCard = useCallback((gameId: string, cardId: string) => {
    if (!socket) return;
    socket.emit('play_card', { gameId, cardId });
  }, [socket]);

  const pass = useCallback((gameId: string) => {
    if (!socket) return;
    socket.emit('pass', { gameId });
  }, [socket]);

  const continueGame = useCallback((gameId: string) => {
    if (!socket) return;
    socket.emit('continue_counting', { gameId });
  }, [socket]);

  const sendChat = useCallback((gameId: string, message: string) => {
    if (!socket) return;
    socket.emit('send_chat', { gameId, message });
  }, [socket]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value: GameContextValue = {
    ...state,
    createGame,
    joinGame,
    startGame,
    discardToCrib,
    playCard,
    pass,
    continueGame,
    sendChat,
    clearError,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
