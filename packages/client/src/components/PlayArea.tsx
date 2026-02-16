import type { Card as CardType, ClientPeggingState } from '@cribbage/shared';
import Card from './Card';

interface Props {
  peggingState: ClientPeggingState;
  starter: CardType | null;
  cribCount: number;
  isDealer: boolean;
}

export default function PlayArea({ peggingState, starter, cribCount, isDealer }: Props) {
  return (
    <div className="bg-felt-dark/50 rounded-xl p-6 space-y-6">
      {/* Starter Card */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-green-200 text-sm mb-2">Starter</div>
          {starter ? (
            <Card card={starter} disabled />
          ) : (
            <div className="px-4 py-3 bg-gray-600/50 rounded-lg text-gray-400 text-sm">
              Cut pending
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-green-200 text-sm mb-2">Crib</div>
          <div className="px-4 py-3 bg-amber-900/50 rounded-lg text-amber-200">
            {cribCount} cards
            {isDealer && <span className="ml-1">(yours)</span>}
          </div>
        </div>
      </div>

      {/* Pegging Area */}
      <div className="text-center">
        <div className="text-green-200 text-sm mb-2">
          Pegging Count: <span className="font-bold text-white text-lg">{peggingState.currentCount}</span>
        </div>

        <div className="flex gap-2 justify-center flex-wrap min-h-[50px] items-center">
          {peggingState.pile.length === 0 ? (
            <span className="text-gray-400 text-sm">No cards played yet</span>
          ) : (
            peggingState.pile.map((card) => (
              <Card key={card.id} card={card} disabled small />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
