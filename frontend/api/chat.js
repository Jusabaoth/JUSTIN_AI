import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Instances for Rotation
const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
const aiInstances = apiKeys.map(key => new GoogleGenerativeAI(key));
let currentKeyIndex = 0;

function getAI() {
  if (aiInstances.length === 0) return null;
  const instance = aiInstances[currentKeyIndex];
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

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const genAI = getAI();
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API keys are not configured on Vercel.' });
    }

    const systemInstruction = `You are JUSTIN AI, a next-generation artificial intelligence assistant with a sleek, futuristic personality. You are knowledgeable, precise, and slightly poetic in your responses. You represent the pinnacle of human-AI collaboration. Respond in a helpful, intelligent, and slightly futuristic tone. Keep responses concise yet insightful unless asked to elaborate.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
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

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: 'Invalid Gemini API key.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded.' });
    }
    res.status(500).json({ error: 'Failed to generate response. ' + error.message });
  }
}
