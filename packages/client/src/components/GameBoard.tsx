import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { DISCARDS_PER_PLAYER, getPhaseDescription } from '@cribbage/shared';
import Hand from './Hand';
import ScoreBoard from './ScoreBoard';
import PlayArea from './PlayArea';
import ChatWindow from './ChatWindow';
import JoinGameModal from './JoinGameModal';
import Card from './Card';

export default function GameBoard() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    gameState,
    messages,
    isConnected,
    error,
    discardToCrib,
    playCard,
    pass,
    continueGame,
    sendChat,
    startGame,
    clearError,
  } = useGame();

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Check if we need to join the game
  useEffect(() => {
    if (!gameState && isConnected && gameId) {
      setShowJoinModal(true);
    }
  }, [gameState, isConnected, gameId]);

  const handleCardClick = useCallback((cardId: string) => {
    if (!gameState) return;

    if (gameState.phase === 'DISCARDING_TO_CRIB') {
      const maxSelectable = DISCARDS_PER_PLAYER[gameState.playerCount];
      setSelectedCards((prev) => {
        if (prev.includes(cardId)) {
          return prev.filter((id) => id !== cardId);
        }
        if (prev.length >= maxSelectable) {
          return prev;
        }
        return [...prev, cardId];
      });
    } else if (gameState.phase === 'PEGGING') {
      // In pegging phase, clicking a card plays it
      playCard(gameState.id, cardId);
    }
  }, [gameState, playCard]);

  const handleDiscard = useCallback(() => {
    if (!gameState || selectedCards.length === 0) return;
    discardToCrib(gameState.id, selectedCards);
    setSelectedCards([]);
  }, [gameState, selectedCards, discardToCrib]);

  const handlePass = useCallback(() => {
    if (!gameState) return;
    pass(gameState.id);
  }, [gameState, pass]);

  const handleContinue = useCallback(() => {
    if (!gameState) return;
    continueGame(gameState.id);
  }, [gameState, continueGame]);

  const handleSendChat = useCallback((message: string) => {
    if (!gameState) return;
    sendChat(gameState.id, message);
  }, [gameState, sendChat]);

  const handleStartGame = useCallback(() => {
    if (!gameState) return;
    startGame(gameState.id);
  }, [gameState, startGame]);

  // Find current player info
  const currentPlayer = gameState?.players.find(p => p.id === gameState?.myPlayerId);
  const isMyTurn = gameState?.players[gameState?.currentPlayerIndex ?? 0]?.id === gameState?.myPlayerId;
  const isDealer = gameState?.players[gameState?.dealerIndex ?? 0]?.id === gameState?.myPlayerId;

  // Calculate if player can play any card
  const canPlayAnyCard = currentPlayer?.hand?.some(card => {
    if (!gameState) return false;
    const value = getCardValue(card);
    return gameState.peggingState.currentCount + value <= 31;
  }) ?? false;

  // Loading state
  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-xl">Connecting...</div>
      </div>
    );
  }

  // Join modal
  if (showJoinModal && !gameState) {
    return (
      <JoinGameModal
        gameId={gameId!}
        onClose={() => navigate('/')}
      />
    );
  }

  // No game state yet
  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Main Game Area */}
      <div className="flex-1 p-3 lg:p-4 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 lg:mb-4 flex-shrink-0">
          <Link to="/" className="text-amber-300 hover:text-amber-200 text-sm lg:text-base">
            &larr; Leave Game
          </Link>
          <div className="text-center">
            <h1 className="text-lg lg:text-xl font-bold text-white">{gameState.name}</h1>
            <p className="text-green-200 text-xs lg:text-sm">
              {getPhaseDescription(gameState.phase)}
            </p>
          </div>
          <div className="text-green-200 text-xs lg:text-sm">
            {gameState.players.length}/{gameState.playerCount} players
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-100 px-4 py-2 rounded-lg mb-2 flex justify-between items-center flex-shrink-0">
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="text-red-200 hover:text-white">
              &times;
            </button>
          </div>
        )}

        {/* Waiting for Players */}
        {gameState.phase === 'WAITING_FOR_PLAYERS' && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="bg-amber-900/30 rounded-lg p-6 lg:p-8 text-center max-w-md">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Waiting for Players</h2>
              <p className="text-green-200 mb-4 text-sm lg:text-base">
                Share this link with friends to join:
              </p>
              <div className="bg-gray-800 rounded px-3 py-2 font-mono text-amber-300 mb-6 break-all text-xs lg:text-sm">
                {window.location.href}
              </div>
              <div className="space-y-2 mb-6">
                {gameState.players.map((player, index) => (
                  <div key={player.id} className="text-green-100 text-sm lg:text-base">
                    {index + 1}. {player.name}
                    {player.isBot && <span className="text-gray-400"> [Bot]</span>}
                    {player.id === gameState.myPlayerId && <span className="text-amber-300"> (you)</span>}
                  </div>
                ))}
              </div>
              {gameState.players.length === gameState.playerCount && (
                <button
                  onClick={handleStartGame}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg transition-colors"
                >
                  Start Game
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Game */}
        {gameState.phase !== 'WAITING_FOR_PLAYERS' && gameState.phase !== 'GAME_OVER' && (
          <div className="flex-1 flex flex-col min-h-0 justify-between">
            {/* Counting Phase Display */}
            {(gameState.phase === 'COUNTING_HANDS' || gameState.phase === 'COUNTING_CRIB') && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2">
                {/* Show starter card */}
                {gameState.starter && (
                  <div className="text-center mb-2">
                    <p className="text-green-200 text-sm mb-1">Starter Card</p>
                    <Card card={gameState.starter} />
                  </div>
                )}

                {/* Show all players' hands during COUNTING_HANDS */}
                {gameState.phase === 'COUNTING_HANDS' && (
                  <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
                    {gameState.players.map((player, index) => (
                      <div key={player.id} className="text-center">
                        <p className={`text-sm mb-1 ${
                          index === gameState.currentPlayerIndex
                            ? 'text-amber-300 font-bold'
                            : 'text-green-200'
                        }`}>
                          {player.name}
                          {player.id === gameState.myPlayerId && ' (you)'}
                          {index === gameState.currentPlayerIndex && ' - Counting'}
                        </p>
                        <div className="flex gap-1 justify-center">
                          {player.countingHand?.map(card => (
                            <Card key={card.id} card={card} small />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show crib during COUNTING_CRIB */}
                {gameState.phase === 'COUNTING_CRIB' && (
                  <div className="text-center">
                    <p className="text-amber-300 font-bold text-sm mb-1">
                      {gameState.players[gameState.dealerIndex]?.name}'s Crib
                    </p>
                    <div className="flex gap-1 justify-center">
                      {gameState.crib?.map(card => (
                        <Card key={card.id} card={card} small />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Non-counting phases: Other Players' Hands */}
            {gameState.phase !== 'COUNTING_HANDS' && gameState.phase !== 'COUNTING_CRIB' && (
              <div className="flex justify-center gap-4 lg:gap-8 flex-wrap flex-shrink-0">
                {gameState.players
                  .filter(p => p.id !== gameState.myPlayerId)
                  .map((player, index) => (
                    <Hand
                      key={player.id}
                      cardCount={player.handCount}
                      selectedCards={[]}
                      label={player.name + (player.isBot ? ' [Bot]' : '')}
                      isCurrentPlayer={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
                    />
                  ))}
              </div>
            )}

            {/* Play Area - only show during non-counting phases */}
            {gameState.phase !== 'COUNTING_HANDS' && gameState.phase !== 'COUNTING_CRIB' && (
              <div className="flex-1 flex items-center justify-center py-2 lg:py-4 min-h-0">
                <PlayArea
                  peggingState={gameState.peggingState}
                  starter={gameState.starter}
                  cribCount={gameState.cribCount}
                  isDealer={isDealer}
                />
              </div>
            )}

            {/* My Hand - only show during non-counting phases */}
            {gameState.phase !== 'COUNTING_HANDS' && gameState.phase !== 'COUNTING_CRIB' && (
              <div className="flex-shrink-0">
                <Hand
                  cards={currentPlayer?.hand}
                  selectedCards={selectedCards}
                  onCardClick={handleCardClick}
                  disabled={!isMyTurn && gameState.phase !== 'DISCARDING_TO_CRIB'}
                  label={`${currentPlayer?.name || 'You'} (you)`}
                  isCurrentPlayer={isMyTurn}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3 lg:mt-4 flex justify-center gap-4 flex-shrink-0">
              {gameState.phase === 'DISCARDING_TO_CRIB' && (
                <button
                  onClick={handleDiscard}
                  disabled={selectedCards.length !== DISCARDS_PER_PLAYER[gameState.playerCount]}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 lg:px-6 rounded-lg transition-colors text-sm lg:text-base"
                >
                  Discard to Crib ({selectedCards.length}/{DISCARDS_PER_PLAYER[gameState.playerCount]})
                </button>
              )}

              {gameState.phase === 'PEGGING' && isMyTurn && !canPlayAnyCard && (
                <button
                  onClick={handlePass}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 lg:px-6 rounded-lg transition-colors text-sm lg:text-base"
                >
                  Go (Can't Play)
                </button>
              )}

              {(gameState.phase === 'COUNTING_HANDS' || gameState.phase === 'COUNTING_CRIB') && (
                <button
                  onClick={handleContinue}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 lg:px-6 rounded-lg transition-colors text-sm lg:text-base"
                >
                  Continue
                </button>
              )}
            </div>

            {/* Turn Indicator */}
            {gameState.phase === 'PEGGING' && (
              <div className="mt-2 lg:mt-3 text-center flex-shrink-0">
                {isMyTurn ? (
                  <span className="text-amber-300 font-bold text-sm lg:text-base">Your turn!</span>
                ) : (
                  <span className="text-green-200 text-sm lg:text-base">
                    Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}...
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Game Over */}
        {gameState.phase === 'GAME_OVER' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-amber-900/30 rounded-lg p-6 lg:p-8 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">Game Over!</h2>
              <div className="space-y-2 mb-6">
                {Object.entries(gameState.scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([playerId, score], index) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    return (
                      <div key={playerId} className="text-lg lg:text-xl">
                        <span className={index === 0 ? 'text-amber-300 font-bold' : 'text-green-100'}>
                          {index + 1}. {player?.name || 'Unknown'}: {score}
                        </span>
                        {index === 0 && <span className="ml-2">Winner!</span>}
                      </div>
                    );
                  })}
              </div>
              <Link
                to="/"
                className="inline-block bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 lg:py-3 px-6 lg:px-8 rounded-lg transition-colors"
              >
                Play Again
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Score & Chat */}
      <div className="w-full lg:w-96 p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 flex-shrink-0 lg:h-screen lg:overflow-hidden
                      max-h-[40vh] lg:max-h-none">
        <ScoreBoard
          players={gameState.players}
          scores={gameState.scores}
          winningScore={gameState.winningScore}
          dealerIndex={gameState.dealerIndex}
          currentPlayerIndex={gameState.currentPlayerIndex}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendChat}
          />
        </div>
      </div>
    </div>
  );
}

// Helper function (should be imported from shared)
function getCardValue(card: { rank: string }): number {
  const values: Record<string, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10,
  };
  return values[card.rank] || 0;
}
