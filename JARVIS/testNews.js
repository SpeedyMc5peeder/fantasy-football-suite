const scraper = require('./src/newsScraper');
const CommentaryGenerator = require('./src/generator');
const sleeper = require('./src/sleeperClient');
const path = require('path');
const config = require('../config.json');

const dflConfig = config.leagues.find(l => l.name === 'DFL') || {};
const GEMINI_KEY = process.env.GEMINI_API_KEY || config.gemini_api_key;
const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || dflConfig.sleeper_league_id;

async function runTest() {
  await sleeper.loadSleeperPlayers();
  const generator = new CommentaryGenerator(GEMINI_KEY, 'gemini-2.5-flash');
  
  const articles = await scraper.fetchLatestNews();
  console.log(`Fetched ${articles.length} articles.`);
  
  for (const article of articles) {
    const playerMatch = await generator.checkNewsRelevance(article.headline, article.description);
    if (playerMatch) {
      console.log(`\n🚨 RELEVANT TO: ${playerMatch}`);
      const resolved = await sleeper.resolvePlayerByName(playerMatch);
      if (!resolved) {
        console.log(`⚠️ Not found in sleeper DB.`);
        continue;
      }
      
      const rosters = await sleeper.getRosters(LEAGUE_ID);
      const roster = rosters.find(r => r.players && r.players.includes(resolved.id));
      const isInjury = article.headline.toLowerCase().includes('injur') || article.description.toLowerCase().includes('injur');
      
      let data = {
        headline: article.headline,
        description: article.description,
        playerName: resolved.name,
        isInjury: isInjury,
        isRostered: !!roster
      };

      if (roster) {
        const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, roster.roster_id);
        console.log(`🔥 Owned by ${details.ownerName}! Generating detailed news commentary...`);
        data.teamName = details.teamName;
        data.ownerName = details.ownerName;
      } else {
        console.log(`🤷 Free agent. Generating brief news commentary...`);
      }
      
      const commentary = await generator.generateNewsCommentary(data);
      console.log("\n==================== COMMENTARY ====================");
      console.log(commentary);
      console.log("====================================================\n");
    }
  }
}

runTest().catch(console.error);
