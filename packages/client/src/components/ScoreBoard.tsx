import type { ClientPlayer } from '@cribbage/shared';

interface Props {
  players: ClientPlayer[];
  scores: Record<string, number>;
  winningScore: number;
  dealerIndex: number;
  currentPlayerIndex: number;
}

export default function ScoreBoard({
  players,
  scores,
  winningScore,
  dealerIndex,
  currentPlayerIndex,
}: Props) {
  return (
    <div className="bg-amber-900/30 rounded-lg p-4 space-y-3">
      <h3 className="text-amber-100 font-bold text-lg mb-4">Score Board</h3>

      {players.map((player, index) => {
        const score = scores[player.id] || 0;
        const percentage = Math.min((score / winningScore) * 100, 100);
        const isDealer = index === dealerIndex;
        const isCurrent = index === currentPlayerIndex;

        return (
          <div key={player.id} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className={`${isCurrent ? 'text-amber-300 font-bold' : 'text-green-100'}`}>
                {player.name}
                {isDealer && <span className="ml-1 text-amber-400">(D)</span>}
                {player.isBot && <span className="ml-1 text-gray-400">[Bot]</span>}
                {!player.isConnected && <span className="ml-1 text-red-400">[Offline]</span>}
              </span>
              <span className="text-white font-mono">
                {score} / {winningScore}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
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
