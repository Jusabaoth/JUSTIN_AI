import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = ['Explain simpler', 'Expand', 'Summarize', 'Translate', 'Give examples'];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatText(text) {
  // Basic markdown-like formatting
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('');
}

export default function MessageBubble({ message, onSuggestion }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`message-wrapper ${isUser ? 'user' : 'ai'}`}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="message-avatar">
        {isUser ? '👤' : '✦'}
      </div>

      <div className="message-content">
        {message.typing ? (
          <div className="typing-bubble">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        ) : (
          <div
            className="message-bubble"
            dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
          />
        )}

        {!isUser && !message.typing && message.showSuggestions && (
          <motion.div
            className="suggestion-chips"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {SUGGESTIONS.map(s => (
              <button key={s} className="suggestion-chip" onClick={() => onSuggestion(s)}>
                {s}
              </button>
            ))}
          </motion.div>
        )}

        {!message.typing && (
          <span className="message-time">{formatTime(message.timestamp)}</span>
        )}
      </div>
    </motion.div>
  );
}
