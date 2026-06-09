const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('C:/Users/dommy/OneDrive/Documents/AntiGravity/FantasyFootball/config.json', 'utf8'));

async function test() {
  const genAI = new GoogleGenerativeAI(config.gemini_api_key);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });
  
  const promptTemplate = `You are a personal fantasy football AI trade assistant exclusively for the manager: "Rhymenoceros". 
User Request: "trade away saquon" (Please generate trade option #1)
When the user uses first-person pronouns like "I", "me", "my team", "my roster", "my picks", "who should I trade", they are referring to this manager.

League Teams & Roster Lists (Note: Players valued under 800 have been hidden for brevity):
Manager Name: "Rhymenoceros" (Roster ID: 1)
- RBs: Saquon Barkley (Age: 29, Value: 4000)

Manager Name: "Other Team" (Roster ID: 2)
- Picks: 2026 Mid 1st (Value: 4000)

Instructions:
1. ONLY SUGGEST TRADES FOR THE USER:
   - EVERY trade you suggest MUST include the user ("Rhymenoceros") as one of the primary trading partners (e.g. as Team A). Do NOT suggest trades between two other teams.

4. RESPONSE FORMAT:
   You must return your response ONLY as a JSON object containing EXACTLY 1 trade option matching this schema:
   {
     "teamA_name": "Name of Manager/Team A (Must be Rhymenoceros)",
     "teamB_name": "Name of Manager/Team B (Must match the list exactly)",
     "teamC_name": "Name of Manager/Team C (Must match the list exactly, or null if it's a 2-way trade)",
     "isThreeWay": false,
     "assetsA_sent": [ { "name": "Player Name", "dest_team_name": "Name of Manager receiving this player" } ],
     "assetsB_sent": [ { "name": "Player Name", "dest_team_name": "Name of Manager receiving this player" } ],
     "assetsC_sent": [ { "name": "Player Name", "dest_team_name": "Name of Manager receiving this player" } ],
     "rationale": "A brief, punchy 2-sentence explanation of why this trade makes strategic sense."
   }
   Return ONLY the JSON object for a single trade.`;

  try {
     const res = await model.generateContent(promptTemplate);
     console.log('RAW RESPONSE:', res.response.text());
     console.log('PARSED:', JSON.parse(res.response.text()));
  } catch (e) {
     console.warn('Failed:', e);
  }
}
test();
