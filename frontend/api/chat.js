import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Instances for Rotation
const apiKeys = (process.env.GEMINI_API_KEYS || '')
  .split(',')
  .map(k => k.replace(/["']/g, '').trim())
  .filter(Boolean);
const aiInstances = apiKeys.map(key => new GoogleGenerativeAI(key)); // Defaults to v1beta
let currentKeyIndex = 0;

function getAI() {
  if (aiInstances.length === 0) return null;
  const instance = aiInstances[currentKeyIndex];
  const maskedKey = apiKeys[currentKeyIndex].substring(0, 6) + '...' + apiKeys[currentKeyIndex].substring(apiKeys[currentKeyIndex].length - 4);
  console.log(`[KeyRotation] Processing Vercel request with Key #${currentKeyIndex + 1} (${maskedKey})`);
  // Cycle to next key for the next request
  currentKeyIndex = (currentKeyIndex + 1) % aiInstances.length;
  return instance;
}

export default async function handler(req, res) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      return res.status(500).json({ error: 'Gemini API keys are not configured on Vercel.' });
    }

    try {
      const systemInstruction = `You are JUSTIN AI, a next-generation artificial intelligence assistant with a sleek, futuristic personality. You are knowledgeable, precise, and slightly poetic in your responses. You represent the pinnacle of human-AI collaboration. Respond in a helpful, intelligent, and slightly futuristic tone. Keep responses concise yet insightful unless asked to elaborate.`;

      const model = ai.getGenerativeModel({ 
        model: 'gemini-flash-latest',
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

      return res.status(200).json({ reply }); // Success!

    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('quota');
      const isInvalidKey = error.message?.includes('API_KEY_INVALID') || error.status === 400 || error.status === 401;
      const isServiceBusy = error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded');

      if ((isRateLimit || isInvalidKey || isServiceBusy) && attempts < maxAttempts - 1) {
        let reason = 'rate limited';
        if (isInvalidKey) reason = 'invalid';
        if (isServiceBusy) reason = 'busy/overloaded';

        console.warn(`[KeyRotation] Key #${(currentKeyIndex === 0 ? aiInstances.length : currentKeyIndex)} was ${reason}. Automatically trying next key... (Attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
        continue;
      }
      break;
    }
  }

  // Handle final error
  console.error('Final Gemini API Error:', lastError);
  if (lastError.message?.includes('API_KEY_INVALID')) {
    return res.status(401).json({ error: 'Invalid Gemini API key.' });
  }
  if (lastError.status === 429 || lastError.message?.includes('quota')) {
    return res.status(429).json({ error: 'All API keys are currently at their rate limit.' });
  }
  res.status(500).json({ error: 'Failed to generate response. ' + lastError.message });
}
