require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKeys = (process.env.GEMINI_API_KEYS || '')
  .split(',')
  .map(k => k.replace(/["']/g, '').trim())
  .filter(Boolean);

if (apiKeys.length === 0) {
  console.log("❌ Tidak ada API Key yang ditemukan di .env");
  process.exit(1);
}

const key = apiKeys[0];
const genAI = new GoogleGenerativeAI(key);

async function listModels() {
  console.log(`\n🔍 Mengecek daftar model untuk Key: ${key.substring(0, 6)}...\n`);
  try {
    // Kita gunakan v1beta untuk list models karena biasanya lebih lengkap
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.error) {
      console.log(`❌ Error: ${data.error.message}`);
      return;
    }

    console.log("Daftar Model yang Tersedia:");
    data.models.forEach(model => {
      console.log(`- ${model.name.replace('models/', '')} (${model.displayName})`);
    });
    console.log("\n✅ Silakan pilih salah satu nama model di atas untuk digunakan.");
  } catch (error) {
    console.log(`❌ Gagal mengambil daftar model: ${error.message}`);
  }
}

listModels();
