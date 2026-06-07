const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../config.json', 'utf8'));
const ai = new GoogleGenAI({ apiKey: config.gemini_api_key });

async function listModels() {
  console.log("Listing models...");
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      if (model.name.includes('imagen') || model.name.includes('image')) {
        console.log(model.name);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
listModels();
