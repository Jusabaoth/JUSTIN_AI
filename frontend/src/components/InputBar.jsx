import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  useEffect(() => { autoResize(); }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-section">
      <motion.div
        className="input-bar"
        whileFocus={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
      >
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Ask anything to JUSTIN AI..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        <div className="input-actions">
          <motion.button
            className="input-btn voice-btn"
            title="Voice input (coming soon)"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </motion.button>

          <motion.button
            className="input-btn send-btn"
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            whileHover={!disabled && text.trim() ? { scale: 1.1 } : {}}
            whileTap={!disabled && text.trim() ? { scale: 0.9 } : {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>
      <div className="input-hint">Enter to send · Shift+Enter for newline</div>
    </div>
  );
}
