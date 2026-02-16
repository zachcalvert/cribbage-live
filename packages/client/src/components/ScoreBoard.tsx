import { useRef, useState, useEffect } from 'react';
import type { ClientPlayer } from '@cribbage/shared';

interface Props {
  players: ClientPlayer[];
  scores: Record<string, number>;
  winningScore: number;
  dealerIndex: number;
  currentPlayerIndex: number;
}

interface ScoreAnimation {
  id: string;
  playerId: string;
  points: number;
}

export default function ScoreBoard({
  players,
  scores,
  winningScore,
  dealerIndex,
  currentPlayerIndex,
}: Props) {
  const prevScoresRef = useRef<Record<string, number>>({});
  const [animations, setAnimations] = useState<ScoreAnimation[]>([]);

  useEffect(() => {
    const prevScores = prevScoresRef.current;
    const newAnimations: ScoreAnimation[] = [];

    // Check for score increases
    for (const [playerId, score] of Object.entries(scores)) {
      const prevScore = prevScores[playerId] || 0;
      if (score > prevScore) {
        const points = score - prevScore;
        newAnimations.push({
          id: `${playerId}-${Date.now()}`,
          playerId,
          points,
        });
      }
    }

    // Add new animations
    if (newAnimations.length > 0) {
      setAnimations(prev => [...prev, ...newAnimations]);

      // Remove animations after they complete
      setTimeout(() => {
        setAnimations(prev =>
          prev.filter(a => !newAnimations.some(na => na.id === a.id))
        );
      }, 1500);
    }

    // Update previous scores
    prevScoresRef.current = { ...scores };
  }, [scores]);

  return (
    <div className="bg-amber-900/30 rounded-lg p-3 lg:p-4 space-y-3 flex-shrink-0">
      <h3 className="text-amber-100 font-bold text-sm lg:text-base">Score Board</h3>

      {players.map((player, index) => {
        const score = scores[player.id] || 0;
        const percentage = Math.min((score / winningScore) * 100, 100);
        const isDealer = index === dealerIndex;
        const isCurrent = index === currentPlayerIndex;
        const playerAnimations = animations.filter(a => a.playerId === player.id);

        return (
          <div key={player.id} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className={`${isCurrent ? 'text-amber-300 font-bold' : 'text-green-100'}`}>
                {player.name}
                {isDealer && <span className="ml-1 text-amber-400">(D)</span>}
                {player.isBot && <span className="ml-1 text-gray-400">[Bot]</span>}
                {!player.isConnected && <span className="ml-1 text-red-400">[Offline]</span>}
              </span>
              <div className="flex items-center gap-2">
                {/* Score animations */}
                <div className="relative w-12 h-5">
                  {playerAnimations.map(anim => (
                    <span
                      key={anim.id}
                      className="absolute right-0 text-green-400 font-bold text-sm animate-score-pop"
                    >
                      +{anim.points}
                    </span>
                  ))}
                </div>
                <span className="text-white font-mono">
                  {score} / {winningScore}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  score >= winningScore ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
