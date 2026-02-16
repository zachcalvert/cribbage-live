import type { Card as CardType } from '@cribbage/shared';
import Card, { CardBack } from './Card';

interface Props {
  cards?: CardType[];
  cardCount?: number;
  selectedCards: string[];
  onCardClick?: (cardId: string) => void;
  disabled?: boolean;
  isCurrentPlayer?: boolean;
  label?: string;
}

export default function Hand({
  cards,
  cardCount,
  selectedCards,
  onCardClick,
  disabled,
  isCurrentPlayer,
  label,
}: Props) {
  // If we have actual cards, show them
  if (cards && cards.length > 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        {label && (
          <span className={`text-sm ${isCurrentPlayer ? 'text-amber-300 font-bold' : 'text-green-200'}`}>
            {label}
          </span>
        )}
        <div className="flex gap-2 flex-wrap justify-center">
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              selected={selectedCards.includes(card.id)}
              disabled={disabled}
              onClick={() => onCardClick?.(card.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Otherwise show card backs for hidden cards
  if (cardCount && cardCount > 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        {label && (
          <span className={`text-sm ${isCurrentPlayer ? 'text-amber-300 font-bold' : 'text-green-200'}`}>
            {label}
          </span>
        )}
        <div className="flex gap-1">
          {Array.from({ length: cardCount }).map((_, i) => (
            <CardBack key={i} small />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
