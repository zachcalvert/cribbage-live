import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface Props {
  onClose: () => void;
}

export default function GameSetupModal({ onClose }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [winningScore, setWinningScore] = useState(121);
  const [addBot, setAddBot] = useState(false);
  const { createGame, gameState, isLoading, error } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState) {
      navigate(`/game/${gameState.id}`);
    }
  }, [gameState, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    createGame(playerName.trim(), playerCount, winningScore, addBot);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">New Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Players
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPlayerCount(2)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  playerCount === 2
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                2 Players
              </button>
              <button
                type="button"
                onClick={() => setPlayerCount(4)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  playerCount === 4
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                4 Players (Teams)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Winning Score
            </label>
            <div className="flex gap-4">
              {[61, 121].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setWinningScore(score)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    winningScore === score
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {score} points
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={addBot}
                onChange={(e) => setAddBot(e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-gray-700">
                Play against bot (fills remaining spots)
              </span>
            </label>
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
            {isLoading ? 'Creating...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
}
