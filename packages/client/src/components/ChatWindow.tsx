import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@cribbage/shared';
import EmojiPicker from './EmojiPicker';
import { parseEmojis, type Emoji } from '../data/emojis';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

function MessageContent({ message }: { message: string }) {
  const parts = parseEmojis(message);

  return (
    <span className="inline-flex flex-wrap items-center gap-0.5">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        // It's an emoji
        return (
          <img
            key={index}
            src={part.path}
            alt={part.name}
            title={part.shortcode}
            className="inline-block w-6 h-6 align-middle"
          />
        );
      })}
    </span>
  );
}

export default function ChatWindow({ messages, onSendMessage }: Props) {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (shortcode: string) => {
    setInput((prev) => prev + shortcode);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-gray-900/50 rounded-lg flex flex-col h-64 lg:h-full">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-green-100 font-bold">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No messages yet
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm ${
                msg.playerId === 'system'
                  ? 'text-gray-400 italic'
                  : 'text-green-100'
              }`}
            >
              {msg.playerId !== 'system' && (
                <span className="font-bold text-amber-300">{msg.playerName}: </span>
              )}
              <MessageContent message={msg.message} />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2 relative">
          {/* Emoji picker button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-xl rounded-lg transition-colors"
              title="Add emoji"
            >
              <span role="img" aria-label="emoji">😊</span>
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={500}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
