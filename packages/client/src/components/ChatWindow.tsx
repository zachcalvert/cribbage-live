import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@cribbage/shared';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export default function ChatWindow({ messages, onSendMessage }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
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
              {msg.message}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            maxLength={200}
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
