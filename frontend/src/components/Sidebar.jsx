import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Sidebar({ sessions, activeId, onNewChat, onSelectChat, onRenameChat, onDeleteChat, isOpen, onToggle }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (e, s) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const handleSaveEdit = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      onDeleteChat(id);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onToggle}
            className="sidebar-overlay"
          />
        )}
      </AnimatePresence>

      {/* External Toggle (visible when sidebar is closed) */}
      {!isOpen && (
        <button className="sidebar-toggle external" onClick={onToggle} aria-label="Open sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      <motion.aside
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        initial={false}
        animate={{ 
          x: isOpen ? 0 : (window.innerWidth <= 768 ? '-100%' : 0),
          width: isOpen ? '260px' : (window.innerWidth <= 768 ? '260px' : '0px'),
          opacity: isOpen ? 1 : (window.innerWidth <= 768 ? 1 : 0),
          padding: isOpen ? '20px 14px' : '20px 0px'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header with Close Button */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon-wrap">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text-group">
              <div className="logo-text">JUSTIN <span>AI</span></div>
              <div className="logo-version">AI SYSTEM v2.5</div>
            </div>
          </div>
          <button className="close-sidebar-btn" onClick={onToggle} aria-label="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* New Chat */}
        <motion.button
          className="new-chat-btn"
          onClick={onNewChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Conversation
        </motion.button>

        {/* History */}
        <div className="sidebar-section-label">Recent Chats</div>
        <div className="chat-history">
          <AnimatePresence>
            {sessions.length === 0 && (
              <p className="no-chats-msg">No conversations yet</p>
            )}
            {sessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.03 }}
                className={`history-item ${s.id === activeId ? 'active' : ''}`}
                onClick={() => onSelectChat(s.id)}
              >
                <span className="history-icon">💬</span>
                
                {editingId === s.id ? (
                  <input
                    autoFocus
                    className="history-rename-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={(e) => handleSaveEdit(e, s.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(e, s.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="history-title">{s.title}</span>
                )}

                <div className="history-actions">
                  <button className="action-btn" onClick={(e) => handleStartEdit(e, s)} title="Rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="action-btn delete" onClick={(e) => handleDelete(e, s.id)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>


      </motion.aside>
    </>
  );
}

