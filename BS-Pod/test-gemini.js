const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
const genAI = new GoogleGenerativeAI(config.gemini_api_key);

async function testModel(modelName) {
  console.log(`Testing ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello!");
    console.log(`Success with ${modelName}!`, result.response.text());
    return true;
  } catch (err) {
    console.error(`Failed with ${modelName}:`, err.message);
    return false;
  }
}

async function run() {
  await testModel("gemini-1.5-flash-latest");
  await testModel("gemini-1.5-pro-latest");
  await testModel("gemini-2.5-flash");
  await testModel("gemini-2.5-pro");
}

run();
