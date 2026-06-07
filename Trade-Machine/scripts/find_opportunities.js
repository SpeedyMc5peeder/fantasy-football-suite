import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'config.json');
const OPPS_DIR = path.join(__dirname, '..', 'opportunities');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure output directory exists
if (!fs.existsSync(OPPS_DIR)) {
  fs.mkdirSync(OPPS_DIR, { recursive: true });
}

// ─── Export Safe Configs for React UI ──────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Environment variable fallbacks for GitHub Actions / production
if (process.env.GEMINI_API_KEY) config.gemini_api_key = process.env.GEMINI_API_KEY;
if (process.env.SLEEPER_USER_TOKEN) config.sleeper_user_token = process.env.SLEEPER_USER_TOKEN;
if (process.env.PERSONAL_DISCORD_WEBHOOK) config.personal_webhook_url = process.env.PERSONAL_DISCORD_WEBHOOK;

// Export full config with keys (git-ignored)
fs.writeFileSync(path.join(PUBLIC_DIR, 'config.json'), JSON.stringify(config, null, 2));

// Export safe leagues list
const publicLeagues = config.leagues.map(l => ({
  name: l.name,
  sleeper_league_id: l.sleeper_league_id,
  role: l.role,
  user_team_username: l.user_team_username
}));
fs.writeFileSync(path.join(PUBLIC_DIR, 'leagues.json'), JSON.stringify(publicLeagues, null, 2));

// ─── 1. Load Config ────────────────────────────────────────────────────────
const gemini = new GoogleGenerativeAI(config.gemini_api_key);
const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

// ─── Discord Webhook Sender ──────────────────────────────────────────────────
async function sendToDiscordWebhook(markdownOutput, leagueName) {
  const webhookUrl = config.personal_webhook_url;
  if (!webhookUrl || webhookUrl.includes("YOUR_")) return;

  console.log(`   📤 Sending opportunities for ${leagueName} to personal webhook...`);

  // Split markdown by trade sections
  const sections = markdownOutput.split('## 🤝');
  if (sections.length <= 1) return;

  for (let i = 1; i < sections.length; i++) {
    const tradeBlock = '## 🤝' + sections[i];
    const cleanBlock = tradeBlock
      .replace(/## 🤝 (.*)/, '🤝 **$1**')
      .replace(/\*\*The Framework:\*\*/, '📦 **The Framework:**')
      .replace(/\*\*Trade Machine Analysis:\*\*/, '🎙️ **Bill Simmons Bot:**');

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Dynasty Trade Machine",
          avatar_url: "https://keeptradecut.com/public/images/logo.png",
          content: cleanBlock
        })
      });
      // Sleep to respect Discord rate limits
      await sleep(1000);
    } catch (err) {
      console.error("Error sending trade block to Discord:", err);
    }
  }
}

// ─── 2. Fetch Helper ───────────────────────────────────────────────────────
async function fetchRankings() {
  const res = await fetch('http://localhost:5000/api/rankings');
  if (!res.ok) throw new Error('Failed to fetch rankings. Is Dynasty-Evaluator running?');
  return res.json();
}

async function fetchSleeperLeagueData(leagueId) {
  const [usersRes, rostersRes] = await Promise.all([
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
  ]);
  
  if (!usersRes.ok || !rostersRes.ok) {
    throw new Error(`Failed to fetch Sleeper data for league ${leagueId}`);
  }

  const users = await usersRes.json();
  const rosters = await rostersRes.json();
  
  return { users, rosters };
}

// ─── 3. Identify Opportunities ──────────────────────────────────────────────
function findPositionalNeeds(rosters, users, rankings) {
  // Build a lookup map of Sleeper IDs to our player ranking data
  const playerMap = new Map();
  rankings.forEach(p => {
    if (p.sleeper_id) playerMap.set(p.sleeper_id, p);
  });

  const teams = rosters.map(roster => {
    const user = users.find(u => u.user_id === roster.owner_id);
    const username = user ? user.display_name : 'Unknown';
    
    // Total up positional values for this team
    const posTotals = { QB: 0, RB: 0, WR: 0, TE: 0, Picks: 0 };
    const playersInfo = { QB: [], RB: [], WR: [], TE: [] };
    
    // Add player values
    if (roster.players) {
      roster.players.forEach(pid => {
        const player = playerMap.get(pid);
        if (player) {
          posTotals[player.position] = (posTotals[player.position] || 0) + player.composite_value;
          playersInfo[player.position].push(player);
        }
      });
    }

    // Sort players within position by value (highest first)
    Object.keys(playersInfo).forEach(pos => {
      playersInfo[pos].sort((a, b) => b.composite_value - a.composite_value);
    });

    return {
      roster_id: roster.roster_id,
      owner_id: roster.owner_id,
      username,
      posTotals,
      playersInfo,
      totalValue: posTotals.QB + posTotals.RB + posTotals.WR + posTotals.TE
    };
  });

  return teams;
}

function analyzeMatchups(teams) {
  const opportunities = [];

  // Calculate league average positional values to determine "surplus" and "deficit"
  const leagueAverages = { QB: 0, RB: 0, WR: 0, TE: 0 };
  teams.forEach(t => {
    leagueAverages.QB += t.posTotals.QB;
    leagueAverages.RB += t.posTotals.RB;
    leagueAverages.WR += t.posTotals.WR;
    leagueAverages.TE += t.posTotals.TE;
  });
  
  const numTeams = teams.length;
  if (numTeams === 0) return opportunities;

  Object.keys(leagueAverages).forEach(pos => {
    leagueAverages[pos] /= numTeams;
  });

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const teamA = teams[i];
      const teamB = teams[j];

      const positions = ['QB', 'RB', 'WR', 'TE'];
      
      for (let posA of positions) {
        for (let posB of positions) {
          if (posA === posB) continue;

          const aNeedsA = teamA.posTotals[posA] < leagueAverages[posA] * 0.8;
          const aHasSurplusB = teamA.posTotals[posB] > leagueAverages[posB] * 1.2;
          
          const bNeedsB = teamB.posTotals[posB] < leagueAverages[posB] * 0.8;
          const bHasSurplusA = teamB.posTotals[posA] > leagueAverages[posA] * 1.2;

          if (aNeedsA && aHasSurplusB && bNeedsB && bHasSurplusA) {
            const aTradeBait = teamA.playersInfo[posB][0];
            const bTradeBait = teamB.playersInfo[posA][0];
            
            if (aTradeBait && bTradeBait) {
              // Create a unique key for this matchup so we don't spam the same pair
              const key = [teamA.username, teamB.username].sort().join('-');
              
              if (!opportunities.some(o => o.key === key)) {
                opportunities.push({
                  key,
                  teamA: teamA.username,
                  teamB: teamB.username,
                  rationale: `${teamA.username} is weak at ${posA} but loaded at ${posB}. ${teamB.username} is weak at ${posB} but loaded at ${posA}.`,
                  suggestedTrade: {
                    teamAGives: aTradeBait,
                    teamBGives: bTradeBait
                  }
                });
              }
            }
          }
        }
      }
    }
  }

  // Return top 5 opportunities
  return opportunities.slice(0, 5);
}

// ─── 4. Generate AI Blurb ───────────────────────────────────────────────────
async function generateBlurb(opp, leagueInfo) {
  const prompt = `
You are the Trade Machine, a highly intelligent and slightly sarcastic fantasy football AI.
You have discovered a potential win-win trade opportunity in the "${leagueInfo.name}" league.

Here is the context:
${opp.rationale}

A potential framework to start negotiations:
- ${opp.teamA} sends ${opp.suggestedTrade.teamAGives.name} (${opp.suggestedTrade.teamAGives.position}, KTC Value: ${opp.suggestedTrade.teamAGives.ktc_value})
- ${opp.teamB} sends ${opp.suggestedTrade.teamBGives.name} (${opp.suggestedTrade.teamBGives.position}, KTC Value: ${opp.suggestedTrade.teamBGives.ktc_value})

Write a short, engaging blurb (1-2 paragraphs) pitching this trade to both managers. Explain why it makes sense based on their positional needs. Make it sound like a smart GM's recommendation, with a touch of Bill Simmons flair (e.g. "Who says no?"). Don't worry about exact value matches, just pitch the framework.
`;

  try {
    try {
      console.log(`     Attempting generation with gemini-2.5-flash...`);
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (firstErr) {
      console.warn(`     Flash model failed (503/overload). Retrying with gemini-2.5-pro...`, firstErr.message || firstErr);
      const proModel = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
      const result = await proModel.generateContent(prompt);
      return result.response.text();
    }
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    return "AI generation failed. But you guys should really consider trading these players!";
  }
}

// ─── 5. Main Execution ──────────────────────────────────────────────────────
async function run() {
  console.log('🔍 Trade Machine: Finding Opportunities...\n');
  
  try {
    const rankings = await fetchRankings();
    console.log(`✅ Loaded ${rankings.length} players from Dynasty-Evaluator API.`);

    for (const league of config.leagues) {
      if (!league.sleeper_league_id || league.sleeper_league_id.includes('YOUR_')) continue;
      
      console.log(`\n🏈 Processing League: ${league.name} (${league.sleeper_league_id})`);
      const { users, rosters } = await fetchSleeperLeagueData(league.sleeper_league_id);
      
      const teams = findPositionalNeeds(rosters, users, rankings);
      const opps = analyzeMatchups(teams);
      
      console.log(`   Found ${opps.length} potential trade opportunities.`);

      let markdownOutput = `# 📈 Trade Opportunities for ${league.name}\n\n`;
      markdownOutput += `*Generated on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

      if (opps.length === 0) {
        markdownOutput += "No obvious win-win opportunities found based on positional surpluses/deficits.";
      } else {
        for (const opp of opps) {
          console.log(`   🤖 Generating AI blurb for ${opp.teamA} vs ${opp.teamB}...`);
          const blurb = await generateBlurb(opp, league);
          
          markdownOutput += `## 🤝 ${opp.teamA} ↔️ ${opp.teamB}\n`;
          markdownOutput += `**The Framework:**\n`;
          markdownOutput += `- **${opp.teamA}** receives: ${opp.suggestedTrade.teamBGives.name} (${opp.suggestedTrade.teamBGives.position})\n`;
          markdownOutput += `- **${opp.teamB}** receives: ${opp.suggestedTrade.teamAGives.name} (${opp.suggestedTrade.teamAGives.position})\n\n`;
          markdownOutput += `**Trade Machine Analysis:**\n${blurb}\n\n---\n\n`;

          // Sleep 4 seconds to respect the Gemini Free Tier Rate Limit
          await sleep(4000);
        }
      }

      const outPath = path.join(OPPS_DIR, `${league.name}_opportunities.md`);
      fs.writeFileSync(outPath, markdownOutput);
      console.log(`✅ Wrote opportunities to ${outPath}`);

      // Send to personal Discord webhook if configured
      await sendToDiscordWebhook(markdownOutput, league.name);
    }
    
    console.log('\n🎉 Finished finding opportunities.');
  } catch (err) {
    console.error("❌ Error during script execution:", err.message);
    process.exit(1);
  }
}

run();
