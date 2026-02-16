import type { Card as CardType, Suit } from '@cribbage/shared';

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

interface Props {
  card: CardType;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  small?: boolean;
}

export default function Card({ card, selected, disabled, onClick, small }: Props) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  const baseClasses = small
    ? 'px-2 py-1 text-sm'
    : 'px-3 py-2 text-lg';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        font-bold rounded-lg shadow-md transition-all
        ${isRed ? 'text-red-600' : 'text-gray-800'}
        ${selected
          ? 'bg-amber-200 ring-2 ring-amber-500 transform -translate-y-1'
          : 'bg-white hover:bg-gray-50'
        }
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-lg'
        }
      `}
    >
      {card.rank}{suitSymbol}
    </button>
  );
}

export function CardBack({ small }: { small?: boolean }) {
  const baseClasses = small
    ? 'px-2 py-1 text-sm'
    : 'px-3 py-2 text-lg';

  return (
    <div
      className={`
        ${baseClasses}
        font-bold rounded-lg shadow-md
        bg-blue-800 text-blue-600
        border-2 border-blue-600
      `}
    >
      &#x2660;
    </div>
  );
}
