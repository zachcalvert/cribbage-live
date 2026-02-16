import { useState } from 'react';
import { EMOJIS, type Emoji } from '../data/emojis';

interface Props {
  onSelect: (shortcode: string) => void;
  onClose: () => void;
}

type Category = 'blob' | 'meow' | 'piggy';

const CATEGORY_LABELS: Record<Category, string> = {
  blob: 'Blobs',
  meow: 'Cats',
  piggy: 'Piggies',
};

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('blob');

  const filteredEmojis = EMOJIS.filter(e => e.category === activeCategory);

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-72 z-50">
      {/* Header with close button */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-700">
        <span className="text-sm text-gray-300">Emojis</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          &times;
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-gray-700">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 px-3 py-2 text-sm transition-colors ${
              activeCategory === cat
                ? 'bg-gray-700 text-amber-300'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-1 p-2 max-h-48 overflow-y-auto">
        {filteredEmojis.map((emoji) => (
          <button
            key={emoji.shortcode}
            onClick={() => {
              onSelect(emoji.shortcode);
              onClose();
            }}
            className="p-1 rounded hover:bg-gray-700 transition-colors group relative"
            title={emoji.name}
          >
            <img
              src={emoji.path}
              alt={emoji.name}
              className="w-8 h-8 object-contain"
            />
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {emoji.shortcode}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
