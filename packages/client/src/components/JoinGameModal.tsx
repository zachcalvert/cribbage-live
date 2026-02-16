import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

interface Props {
  gameId: string;
  onClose: () => void;
}

export default function JoinGameModal({ gameId, onClose }: Props) {
  const [playerName, setPlayerName] = useState('');
  const { joinGame, gameState, isLoading, error } = useGame();

  useEffect(() => {
    if (gameState) {
      onClose();
    }
  }, [gameState, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    joinGame(gameId, playerName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Join Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Joining game: <span className="font-mono font-bold">{gameId}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              autoFocus
              maxLength={20}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!playerName.trim() || isLoading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
}
