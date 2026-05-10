require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
}));
app.use(express.json());

// Initialize Gemini Instances for Rotation
const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
const aiInstances = apiKeys.map(key => new GoogleGenerativeAI(key));
let currentKeyIndex = 0;

function getAI() {
  if (aiInstances.length === 0) return null;
  const instance = aiInstances[currentKeyIndex];
  const maskedKey = apiKeys[currentKeyIndex].substring(0, 6) + '...';
  console.log(`[KeyRotation] Using Key #${currentKeyIndex + 1} (${maskedKey})`);
  // Cycle to next key for the next request
  currentKeyIndex = (currentKeyIndex + 1) % aiInstances.length;
  return instance;
}

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

    const genAI = getAI();
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API keys are not configured.' });
    }

    // Build conversation history for context
    const systemInstruction = `You are JUSTIN AI, a next-generation artificial intelligence assistant with a sleek, futuristic personality. You are knowledgeable, precise, and slightly poetic in your responses. You represent the pinnacle of human-AI collaboration. Respond in a helpful, intelligent, and slightly futuristic tone. Keep responses concise yet insightful unless asked to elaborate.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction 
    });

    // Build contents array with history
    const contents = [];
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

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const response = await result.response;
    const reply = response.text();

    res.json({ reply });
  } catch (error) {
    console.error('Gemini API Error:', error);

    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid Gemini API key. Please check your configuration.' });
    }

    if (error.message?.includes('RATE_LIMIT') || error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }

    res.status(500).json({ error: 'Failed to generate response. ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JUSTIN AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 API Rotation: ${apiKeys.length} keys configured ✓`);
});
