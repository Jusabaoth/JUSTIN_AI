import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';
import AuroraBackground from './components/AuroraBackground';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputBar from './components/InputBar';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';
const STORAGE_KEY = 'justin_sessions';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createSession(firstMessage = null) {
  return {
    id: generateId(),
    title: firstMessage ? firstMessage.slice(0, 36) + (firstMessage.length > 36 ? '…' : '') : 'New Conversation',
    messages: [],
    createdAt: Date.now(),
  };
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function App() {
  const [sessions, setSessions] = useState(() => loadSessions());
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // Auto-select first session or create one
  useEffect(() => {
    if (sessions.length > 0 && !activeId) {
      setActiveId(sessions[0].id);
    }
  }, []);

  const activeSession = sessions.find(s => s.id === activeId) || null;
  const messages = activeSession?.messages || [];

  // Persist on change
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const updateSession = useCallback((id, updater) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const handleNewChat = useCallback(() => {
    const session = createSession();
    setSessions(prev => [session, ...prev]);
    setActiveId(session.id);
    setSidebarOpen(false);
  }, []);

  const handleSelectChat = useCallback((id) => {
    setActiveId(id);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, []);

  const handleRenameChat = useCallback((id, newTitle) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  }, []);

  const handleDeleteChat = useCallback((id) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeId]);

  const sendMessage = useCallback(async (text) => {
    setError(null);

    // Ensure active session
    let currentId = activeId;
    if (!currentId) {
      const session = createSession(text);
      setSessions(prev => [session, ...prev]);
      setActiveId(session.id);
      currentId = session.id;
    }

    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Add user message and set title if first message
    setSessions(prev => prev.map(s => {
      if (s.id !== currentId) return s;
      const isFirst = s.messages.length === 0;
      return {
        ...s,
        title: isFirst ? text.slice(0, 36) + (text.length > 36 ? '…' : '') : s.title,
        messages: [...s.messages, userMsg],
      };
    }));

    setIsLoading(true);

    try {
      // Build history for context (last 20 messages)
      const history = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMsg = {
        id: generateId(),
        role: 'ai',
        content: data.reply,
        timestamp: Date.now(),
        showSuggestions: true,
      };

      setSessions(prev => prev.map(s =>
        s.id === currentId ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));
    } catch (err) {
      setError(err.message || 'Connection error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }, [activeId, messages]);

  const handleSuggestion = useCallback((suggestion) => {
    if (!messages.length) return;
    const last = messages.filter(m => m.role === 'ai').slice(-1)[0];
    if (!last) return;
    sendMessage(`${suggestion}: "${last.content.slice(0, 120)}${last.content.length > 120 ? '…' : ''}"`);
  }, [messages, sendMessage]);

  const handleWelcomePrompt = useCallback((prompt) => {
    // Strip emoji prefix
    const text = prompt.replace(/^[\p{Emoji}\s]+/u, '').trim();
    sendMessage(text);
  }, [sendMessage]);

  return (
    <div className="app-layout">
      <AuroraBackground />

      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
      />

      <div className="main-area">
        {/* Header */}
        <header className="chat-header">
          <div className="header-model">
            <div className="model-badge">GEMINI FLASH (LATEST)</div>
          </div>
          <div className="header-right">
            <div className="status-online">
              <span className="status-dot" />
              Online
            </div>
            <div className="memory-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Memory On
            </div>
          </div>
        </header>

        {/* Chat */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSuggestion={handleSuggestion}
          onWelcomePrompt={handleWelcomePrompt}
        />

        {/* Input */}
        <InputBar onSend={sendMessage} disabled={isLoading} />

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <span>⚠ {error}</span>
              <button className="error-cancel-btn" onClick={() => setError(null)} title="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
