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

// Chat endpoint with Smart Rotation (Retries on 429)
app.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  let attempts = 0;
  const maxAttempts = aiInstances.length || 1;
  let lastError = null;

  while (attempts < maxAttempts) {
    const ai = getAI();
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API keys are not configured.' });
    }

    try {
      const systemInstruction = `You are JUSTIN AI, a next-generation artificial intelligence assistant with a sleek, futuristic personality. You are knowledgeable, precise, and slightly poetic in your responses. You represent the pinnacle of human-AI collaboration. Respond in a helpful, intelligent, and slightly futuristic tone. Keep responses concise yet insightful unless asked to elaborate.`;

      const model = ai.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        systemInstruction: systemInstruction 
      });

      const contents = [];
      for (const msg of history) {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

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

      return res.json({ reply }); // Success!

    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('quota');
      const isInvalidKey = error.message?.includes('API_KEY_INVALID') || error.status === 400 || error.status === 401;
      
      if ((isRateLimit || isInvalidKey) && attempts < maxAttempts - 1) {
        const reason = isRateLimit ? 'rate limited' : 'invalid';
        console.warn(`[KeyRotation] Key #${(currentKeyIndex === 0 ? aiInstances.length : currentKeyIndex)} was ${reason}. Automatically trying next key... (Attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
        continue;
      }
      break;
    }
  }

  // Handle errors after all attempts
  console.error('Final Gemini API Error:', lastError);

  if (lastError.message?.includes('API_KEY_INVALID') || lastError.message?.includes('API key')) {
    return res.status(401).json({ error: 'Invalid Gemini API key. Please check your configuration.' });
  }

  if (lastError.message?.includes('RATE_LIMIT') || lastError.status === 429 || lastError.message?.includes('quota')) {
    return res.status(429).json({ error: 'All API keys have reached their rate limit. Please try again in a few minutes.' });
  }

  res.status(500).json({ error: 'Failed to generate response. ' + lastError.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JUSTIN AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 API Rotation: ${apiKeys.length} keys configured ✓`);
});
