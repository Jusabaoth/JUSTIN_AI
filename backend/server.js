require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
}));
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'JUSTIN AI Backend is running' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    // Build conversation history for context
    const systemInstruction = `You are JUSTIN AI, a next-generation artificial intelligence assistant with a sleek, futuristic personality. You are knowledgeable, precise, and slightly poetic in your responses. You represent the pinnacle of human-AI collaboration. Respond in a helpful, intelligent, and slightly futuristic tone. Keep responses concise yet insightful unless asked to elaborate.`;

    // Build contents array with history
    const contents = [];

    // Add history messages
    for (const msg of history) {
      if (msg.role && msg.content) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const reply = response.text;

    res.json({ reply });
  } catch (error) {
    console.error('Gemini API Error:', error);

    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid Gemini API key. Please check your configuration.' });
    }

    if (error.message?.includes('RATE_LIMIT') || error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }

    res.status(500).json({ error: 'Failed to generate response. Please try again.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JUSTIN AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}`);
});
