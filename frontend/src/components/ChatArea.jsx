import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import AIOrb from './AIOrb';
import MessageBubble from './MessageBubble';

const WELCOME_PROMPTS = [
  '🌌 What can you do?',
  '🔭 Explain quantum computing',
  '💡 Help me brainstorm ideas',
  '⚡ Write code for me',
  '🌍 Translate something',
];

export default function ChatArea({ messages, isLoading, onSuggestion, onWelcomePrompt }) {
  const endRef = useRef(null);
  const showWelcome = messages.length === 0 && !isLoading;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-container">
      {/* Orb always visible at top */}
      <AIOrb isActive={isLoading} />

      {/* Welcome screen */}
      {showWelcome && (
        <div className="welcome-chips">
          {WELCOME_PROMPTS.map(p => (
            <button key={p} className="welcome-chip" onClick={() => onWelcomePrompt(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <AnimatePresence initial={false}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSuggestion={onSuggestion}
          />
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {isLoading && (
        <MessageBubble
          message={{ id: 'typing', role: 'ai', content: '', typing: true, timestamp: Date.now() }}
          onSuggestion={() => {}}
        />
      )}

      <div ref={endRef} />
    </div>
  );
}
