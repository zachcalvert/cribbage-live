import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import GameSetupModal from './GameSetupModal';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const { isConnected, error, clearError } = useGame();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Cribbage Live
        </h1>
        <p className="text-xl text-green-100 opacity-90">
          Play classic cribbage with friends in real-time
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => setShowModal(true)}
          disabled={!isConnected}
          className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-colors"
        >
          Start New Game
        </button>

        {!isConnected && (
          <p className="text-amber-200 text-center text-sm">
            Connecting to server...
          </p>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-100 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-200 hover:text-white ml-2"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 text-green-100/60 text-sm text-center">
        <p>2 or 4 players | Real-time gameplay | Play with bots</p>
      </div>

      {showModal && (
        <GameSetupModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
