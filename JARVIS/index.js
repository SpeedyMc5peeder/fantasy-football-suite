/**
 * index.js — JARVIS Commentary Bot Entrypoint & CLI Orchestrator
 *
 * Usage:
 *   node index.js --check-transactions
 *   node index.js --weekly-recap [week]
 *   node index.js --test-webhook
 *   
 * Options:
 *   --dry-run   Runs without posting to Sleeper (outputs to console/local preview)
 *   --force     Force reprocessing of already processed transactions
 */

const fs = require('fs');
const path = require('path');
const sleeper = require('./src/sleeperClient');
const CommentaryGenerator = require('./src/generator');
const { postToSleeper } = require('./src/poster');
const imageClient = require('./src/imageClient');
const newsScraper = require('./src/newsScraper');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const HISTORY_FILE = path.join(__dirname, 'data', 'processed_transactions.json');
const NEWS_HISTORY_FILE = path.join(__dirname, 'data', 'processed_news.json');

// Load configurations
let config = { leagues: [] };
try {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
} catch (err) {
  console.warn('⚠️ Failed to load or parse config.json, using environment variables if available.');
}

// Find DFL League Configuration
const dflConfig = config.leagues.find(l => l.name === 'DFL') || {};

const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || dflConfig.sleeper_league_id;
const USER_TOKEN = process.env.SLEEPER_USER_TOKEN || config.sleeper_user_token;
const MANAGER_LORE = dflConfig.manager_lore || {};
const MANAGER_MASCOTS = dflConfig.manager_mascots || {};
const GEMINI_KEY = process.env.GEMINI_API_KEY || config.gemini_api_key;

if (!LEAGUE_ID || !USER_TOKEN || !GEMINI_KEY) {
  console.error('❌ Missing credentials! Make sure SLEEPER_LEAGUE_ID, SLEEPER_USER_TOKEN, and GEMINI_API_KEY are configured in config.json or environment variables.');
  process.exit(1);
}

// Initialize generator
const generator = new CommentaryGenerator(GEMINI_KEY, 'gemini-2.5-flash');

// Load processed transactions history
let processedTransactions = [];
try {
  const historyDir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  if (fs.existsSync(HISTORY_FILE)) {
    processedTransactions = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
} catch (err) {
  console.warn('⚠️ Failed to load processed transactions history, starting fresh.', err.message);
}

// Load processed news history
let processedNews = [];
try {
  if (fs.existsSync(NEWS_HISTORY_FILE)) {
    processedNews = JSON.parse(fs.readFileSync(NEWS_HISTORY_FILE, 'utf8'));
  }
} catch (err) {
  console.warn('⚠️ Failed to load processed news history, starting fresh.', err.message);
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(processedTransactions, null, 2));
  } catch (err) {
    console.error('❌ Failed to save transaction history:', err.message);
  }
}

function saveNewsHistory() {
  try {
    fs.writeFileSync(NEWS_HISTORY_FILE, JSON.stringify(processedNews, null, 2));
  } catch (err) {
    console.error('❌ Failed to save news history:', err.message);
  }
}

/**
 * CLI Option Parser Helper
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    checkTransactions: args.includes('--check-transactions'),
    weeklyRecap: args.includes('--weekly-recap'),
    testWebhook: args.includes('--test-webhook'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    watch: args.includes('--watch') || args.includes('--daemon'),
    week: null
  };

  // Extract week number if provided after --weekly-recap or --week
  const recapIdx = args.indexOf('--weekly-recap');
  const weekIdx = args.indexOf('--week');
  
  if (recapIdx !== -1 && args[recapIdx + 1] && !args[recapIdx + 1].startsWith('-')) {
    options.week = parseInt(args[recapIdx + 1], 10);
  } else if (weekIdx !== -1 && args[weekIdx + 1]) {
    options.week = parseInt(args[weekIdx + 1], 10);
  }

  return options;
}

/**
 * Posts a test message to the webhook.
 */
async function runTestWebhook(dryRun) {
  const testMessage = `Greetings. I am JARVISbot, your newly activated AI League Assistant.

I've been analyzing your rosters, and frankly, it's a real tragedy what some of you are doing out there. Just a complete tragedy. 

I'll be dropping by to recap matchups, grade your panic-trades, and roast your waiver bids. 

...or so I'm told. Assuming this whole automated operation doesn't violently crash and burn immediately after I hit send. We'll see.

Beep Boop.`;
  
  console.log('🧪 Running Webhook test...');
  await postToSleeper(USER_TOKEN, LEAGUE_ID, testMessage, dryRun, 'general');
}

/**
 * Core Logic: Scan for new trades and post commentary.
 */
async function checkTransactions(options) {
  console.log(`📡 Scanning DFL transactions...`);
  
  // 1. Fetch current week/leg of the league
  const league = await sleeper.getLeague(LEAGUE_ID);
  const currentWeek = league.settings.leg || 1;
  console.log(`🏈 Current league week/leg is: ${currentWeek}`);

  // We check the transactions for the current week.
  // Sometimes trades happen right around week boundaries, so we also check currentWeek - 1 if it's > 0
  const weeksToCheck = [currentWeek];
  if (currentWeek > 1) weeksToCheck.push(currentWeek - 1);

  const rosters = await sleeper.getRosters(LEAGUE_ID);
  const users = await sleeper.getUsers(LEAGUE_ID);

  // Gather all trades and drops across the checked weeks
  let allTrades = [];
  let allDrops = [];
  for (const week of weeksToCheck) {
    console.log(`🔍 Fetching transactions for Week ${week}...`);
    const transactions = await sleeper.getTransactions(LEAGUE_ID, week);
    const trades = transactions.filter(t => t.type === 'trade' && t.status === 'complete');
    const drops = transactions.filter(t => (t.type === 'free_agent' || t.type === 'waiver') && t.status === 'complete' && t.drops);
    allTrades = allTrades.concat(trades.map(t => ({ ...t, week })));
    allDrops = allDrops.concat(drops.map(t => ({ ...t, week })));
  }

  console.log(`   Found a total of ${allTrades.length} completed trade(s) and ${allDrops.length} drops in the active window.`);

  // If this is a cold start (empty history) and we're not forcing, initialize history and exit
  if (processedTransactions.length === 0 && !options.force) {
    console.log('🏁 Cold start detected: Initializing processed transactions database with existing transactions to prevent historical spam...');
    processedTransactions = allTrades.map(t => t.transaction_id).concat(allDrops.map(t => t.transaction_id));
    saveHistory();
    console.log(`✅ Processed transactions database initialized with ${processedTransactions.length} trades. Exiting.`);
    return;
  }

  let processedCount = 0;
  const MAX_TRADES_PER_RUN = 1; // Process at most 1 trade per run to prevent chat flooding

  // Sort trades so that the oldest unprocessed trade is processed first
  allTrades.sort((a, b) => a.status_updated - b.status_updated);

  for (const trade of allTrades) {
    const tradeId = trade.transaction_id;
    
    if (processedTransactions.includes(tradeId) && !options.force) {
      console.log(`   ⏭️ Trade ${tradeId} has already been processed. Skipping.`);
      continue;
    }

    if (processedCount >= MAX_TRADES_PER_RUN) {
      console.log(`   ⏳ Reached maximum trades per run limit (${MAX_TRADES_PER_RUN}). Remaining trades will be processed in subsequent runs.`);
      break;
    }

    console.log(`   📝 Processing Trade ${tradeId} (Week ${trade.week})...`);
    processedCount++;

      // Determine owners and assets
      const rosterIds = trade.roster_ids;
      if (rosterIds.length < 2) continue; // Safety check

      const rosterAId = rosterIds[0];
      const rosterBId = rosterIds[1];

      const detailsA = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, rosterAId);
      const detailsB = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, rosterBId);

      const managerA = detailsA.ownerName;
      const teamNameA = detailsA.teamName;
      const managerB = detailsB.ownerName;
      const teamNameB = detailsB.teamName;

      // Note: check lore using either manager username or team name
      const managerALore = MANAGER_LORE[managerA] || MANAGER_LORE[teamNameA] || '';
      const managerBLore = MANAGER_LORE[managerB] || MANAGER_LORE[teamNameB] || '';

      // Roster modes: check if specified in lore, otherwise default to neutral
      const getRosterMode = (lore) => {
        if (lore.toLowerCase().includes('rebuild')) return 'rebuilder';
        if (lore.toLowerCase().includes('contend')) return 'contender';
        return 'neutral';
      };
      const managerAMode = getRosterMode(managerALore);
      const managerBMode = getRosterMode(managerBLore);

      // Map adds/drops to side A and side B
      // Side A assets are what rosterA received (i.e. what rosterB dropped/sent)
      // Side B assets are what rosterB received (i.e. what rosterA dropped/sent)
      const sideAPlayerIds = [];
      const sideBPlayerIds = [];
      
      const sideAPlayerNames = [];
      const sideBPlayerNames = [];

      // Process players
      if (trade.adds) {
        for (const [playerId, rosterId] of Object.entries(trade.adds)) {
          const resolved = await sleeper.resolvePlayer(playerId);
          const formattedName = `${resolved.name} (${resolved.position} - ${resolved.team})`;
          
          if (rosterId === rosterAId) {
            sideAPlayerIds.push(playerId);
            sideAPlayerNames.push(formattedName);
          } else if (rosterId === rosterBId) {
            sideBPlayerIds.push(playerId);
            sideBPlayerNames.push(formattedName);
          }
        }
      }

      // Process draft picks
      const sideAPicks = [];
      const sideBPicks = [];

      if (trade.draft_picks) {
        for (const pick of trade.draft_picks) {
          // pick.roster_id in Sleeper draft_picks represents the original roster's ID
          const originalOwnerRoster = rosters.find(r => r.roster_id === pick.roster_id);
          const originalOwnerUser = originalOwnerRoster ? users.find(u => u.user_id === originalOwnerRoster.owner_id) : null;
          const originalOwnerName = originalOwnerUser ? originalOwnerUser.display_name : `Roster ${pick.roster_id}`;
          
          const pickName = `${pick.season} Round ${pick.round} (${originalOwnerName})`;
          // Map to Dynasty-Evaluator pick nomenclature (e.g. "2027 Mid 1st")
          const roundSuffix = pick.round === 1 ? '1st' : pick.round === 2 ? '2nd' : pick.round === 3 ? '3rd' : '4th';
          const evalPickId = `${pick.season} Mid ${roundSuffix}`;

          // pick.owner_id represents the NEW roster_id receiving the pick
          if (pick.owner_id === rosterAId) {
            sideAPicks.push(pickName);
            sideAPlayerIds.push(evalPickId); // Feed to Dynasty-Evaluator picks list
          } else if (pick.owner_id === rosterBId) {
            sideBPicks.push(pickName);
            sideBPlayerIds.push(evalPickId);
          }
        }
      }

      const tradeData = {
        managerA,
        teamNameA,
        managerALore,
        managerAMode,
        managerB,
        teamNameB,
        managerBLore,
        managerBMode,
        sideAPlayerIds,
        sideAPlayerNames,
        sideAPicks,
        sideBPlayerIds,
        sideBPlayerNames,
        sideBPicks
      };

      try {
        let article = await generator.generateTradeCommentary(tradeData);

        // Generate a trade comic ~50% of the time (changed from 100%)
        if (Math.random() < 0.5) {
          console.log(`   🎨 Generating trade cartoon...`);
          const mascotA = MANAGER_MASCOTS[managerA] || MANAGER_MASCOTS[teamNameA] || "a cunning fantasy football manager";
          const mascotB = MANAGER_MASCOTS[managerB] || MANAGER_MASCOTS[teamNameB] || "a desperate fantasy football manager";
          const imagePayload = {
            prompt: `A dramatic retro comic book panel showing a tense negotiation between ${mascotA} and ${mascotB}, pop-art comic style, do not include any text or words in the image`,
            style: "retro-comic",
            overlayText: {
              title: "TRADE ALERT",
              mainHeadline: "BLOCKBUSTER",
              subHeadline: `${managerA} and ${managerB} strike a deal!`,
              badgeText: "DEAL"
            },
            filename: `trade_${tradeId}`
          };
          const filename = await imageClient.generateImage(imagePayload);
          const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
          
          if (md) {
            // Post image cleanly as a standalone header message FIRST
            await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'trades', false);
          }
        }

        // Sleeper doesn't support Markdown, so strip all asterisks!
        article = article.replace(/\*/g, '');

        await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'trades', true);

        if (!options.dryRun) {
          processedTransactions.push(tradeId);
          saveHistory();
        }
      } catch (err) {
        console.error(`❌ Failed to process and post trade ${tradeId}:`, err.message);
        if (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Quota'))) {
          console.warn('\n⚠️ Gemini API rate limit or quota exceeded. Stopping transaction scan to prevent further API errors.');
          break;
        }
      }
  }

  // --- FALLEN LEGENDS PROTOCOL (Waivers & Free Agents) ---
  let processedDropCount = 0;
  const MAX_DROPS_PER_RUN = 2;

  allDrops.sort((a, b) => a.status_updated - b.status_updated);

  for (const dropTx of allDrops) {
    const dropId = dropTx.transaction_id;
    if (processedTransactions.includes(dropId) && !options.force) continue;
    if (processedDropCount >= MAX_DROPS_PER_RUN) break;

    if (!dropTx.drops) {
      if (!options.dryRun) {
        processedTransactions.push(dropId);
        saveHistory();
      }
      continue;
    }

    try {
      let postedTribute = false;
      // Evaluate each dropped player
      for (const [playerId, rosterId] of Object.entries(dropTx.drops)) {
        const resolved = await sleeper.resolvePlayer(playerId);
        
        // Phase 1: Veteran Check
        if (resolved.years_exp >= 7 || resolved.age >= 28) {
          console.log(`   🕵️  Checking if dropped veteran ${resolved.name} is a Fallen Legend...`);
          // Phase 2: AI Bouncer
          const isLegend = await generator.checkIsFallenLegend(resolved.name);
          if (isLegend) {
            console.log(`   🚨 FALLEN LEGEND DETECTED: ${resolved.name}! Generating Celebration of Life...`);
            const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, rosterId);
            const data = {
              playerName: resolved.name,
              position: resolved.position,
              age: resolved.age,
              yearsExp: resolved.years_exp,
              teamName: details.teamName,
              ownerName: details.ownerName
            };
            
            let article = await generator.generateFallenLegendCommentary(data);
            article = article.replace(/\*/g, ''); // strip markdown
            await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'waivers', true);
            
            // Post the YouTube highlight link separately
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(resolved.name + ' career highlights')}`;
            const ytMessage = `Pour one out to the highlight reel here: ${searchUrl}`;
            await postToSleeper(USER_TOKEN, LEAGUE_ID, ytMessage, options.dryRun, 'waivers', false);
            
            postedTribute = true;
          } else {
            console.log(`   ❌ AI Bouncer rejected ${resolved.name}. Just a veteran, not a legend.`);
          }
        }
      }

      if (postedTribute) {
        processedDropCount++;
      }
      
      if (!options.dryRun) {
        processedTransactions.push(dropId);
        saveHistory();
      }
    } catch (err) {
      console.error(`❌ Failed to process drop transaction ${dropId}:`, err.message);
    }
  }

  console.log('✅ Finished checking transactions.');
}

/**
 * Core Logic: Gather matchup data and generate weekly recaps.
 */
async function generateWeeklyRecap(options) {
  // 1. Determine which week to recap
  let week = options.week;
  if (!week) {
    const league = await sleeper.getLeague(LEAGUE_ID);
    const currentWeek = league.settings.leg || 1;
    // Recap the completed week (currentWeek - 1), or week 1 if we are still in week 1
    week = currentWeek > 1 ? currentWeek - 1 : 1;
  }

  console.log(`🏈 Generating weekly recap for Week ${week}...`);

  // 2. Fetch league data
  const rosters = await sleeper.getRosters(LEAGUE_ID);
  const users = await sleeper.getUsers(LEAGUE_ID);
  const matchups = await sleeper.getMatchups(LEAGUE_ID, week);

  if (!matchups || matchups.length === 0) {
    console.error(`❌ No matchups found for Week ${week}.`);
    return;
  }

  // 3. Map matchups into a clean format
  const matchupPairs = {}; // group matchups by matchup_id
  for (const m of matchups) {
    if (!matchupPairs[m.matchup_id]) {
      matchupPairs[m.matchup_id] = [];
    }
    matchupPairs[m.matchup_id].push(m);
  }

  const mappedMatchups = [];
  let highestScoringOwner = null;
  let highestScore = -1;

  for (const [matchupId, pair] of Object.entries(matchupPairs)) {
    if (pair.length < 2) continue; // Safety

    const team1 = pair[0];
    const team2 = pair[1];

    const details1 = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, team1.roster_id);
    const details2 = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, team2.roster_id);

    const owner1 = details1.ownerName;
    const team1Name = details1.teamName;
    const owner2 = details2.ownerName;
    const team2Name = details2.teamName;

    // Resolve details for starters and bench
    const processTeamDetails = async (team) => {
      const starters = [];
      const bench = [];

      // Starters
      for (let i = 0; i < team.starters.length; i++) {
        const pId = team.starters[i];
        if (!pId || pId === '0') continue;
        const resolved = await sleeper.resolvePlayer(pId);
        const pts = team.players_points[pId] != null ? team.players_points[pId] : 0;
        starters.push({ name: resolved.name, points: pts, position: resolved.position });
      }

      // Bench
      const benchIds = (team.players || []).filter(pId => !team.starters.includes(pId));
      for (const pId of benchIds) {
        const resolved = await sleeper.resolvePlayer(pId);
        const pts = team.players_points[pId] != null ? team.players_points[pId] : 0;
        // Only report bench players who scored reasonably well (e.g. > 5 pts) to avoid clutter
        if (pts > 5) {
          bench.push({ name: resolved.name, points: pts, position: resolved.position });
        }
      }

      // Sort by points descending
      starters.sort((a, b) => b.points - a.points);
      bench.sort((a, b) => b.points - a.points);

      return { starters, bench };
    };

    const details1Mapped = await processTeamDetails(team1);
    const details2Mapped = await processTeamDetails(team2);

    const score1 = team1.points || 0;
    const score2 = team2.points || 0;

    if (score1 > highestScore) { highestScore = score1; highestScoringOwner = owner1; }
    if (score2 > highestScore) { highestScore = score2; highestScoringOwner = owner2; }

    mappedMatchups.push({
      homeOwner: owner1,
      homeTeam: team1Name,
      homeScore: score1,
      homeStarters: details1Mapped.starters.slice(0, 3), // Top 3 scorers
      homeBench: details1Mapped.bench.slice(0, 2),       // Top 2 bench regrets
      
      awayOwner: owner2,
      awayTeam: team2Name,
      awayScore: score2,
      awayStarters: details2Mapped.starters.slice(0, 3),
      awayBench: details2Mapped.bench.slice(0, 2),

      winnerOwner: score1 > score2 ? owner1 : owner2,
      winnerTeam: score1 > score2 ? team1Name : team2Name,
      margin: Math.abs(score1 - score2)
    });
  }

  // 4. Calculate standings
  // We sort rosters by wins, then points for
  const sortedRosters = [...rosters].sort((a, b) => {
    const aWins = a.settings.wins || 0;
    const bWins = b.settings.wins || 0;
    if (aWins !== bWins) return bWins - aWins;
    const aPF = (a.settings.fpts || 0) + (a.settings.fpts_decimal || 0) / 100;
    const bPF = (b.settings.fpts || 0) + (b.settings.fpts_decimal || 0) / 100;
    return bPF - aPF;
  });

  const standings = [];
  for (const r of sortedRosters) {
    const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, r.roster_id);
    const ownerName = details.ownerName;
    const teamName = details.teamName;
    const wins = r.settings.wins || 0;
    const losses = r.settings.losses || 0;
    const pointsFor = ((r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100).toFixed(1);
    standings.push({ ownerName, teamName, wins, losses, pointsFor });
  }

  // Map MANAGER_LORE keys from manager usernames to team names
  const teamLore = {};
  for (const [mgr, lore] of Object.entries(MANAGER_LORE)) {
    const roster = sortedRosters.find(r => {
      const user = users.find(u => u.user_id === r.owner_id);
      return user && user.display_name === mgr;
    });
    if (roster) {
      const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, roster.roster_id);
      teamLore[details.teamName] = lore;
    } else {
      teamLore[mgr] = lore;
    }
  }

  const recapPayload = {
    week,
    matchups: mappedMatchups,
    standings,
    managerLore: teamLore
  };

  try {
    let article = await generator.generateWeeklyRecap(recapPayload);
    
    // Generate Magazine Cover (Comic is now rare: 1 in 6)
    console.log(`   🎨 Generating weekly recap magazine cover...`);
    const styles = ['sports-illustrated', 'sports-illustrated', 'sports-illustrated', 'ringer', 'ringer', 'retro-comic'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    
    // Put the highest scoring manager's mascot on the cover!
    const coverMascot = MANAGER_MASCOTS[highestScoringOwner] || "a heroic fantasy football player";
    
    const imagePayload = {
      prompt: `A dramatic, cinematic photography shot of ${coverMascot} celebrating a massive victory on the football field, high quality sports magazine cover, do not include any text or words in the image`,
      style: style,
      overlayText: {
        title: style === 'ringer' ? "THE RINGER" : style === 'retro-comic' ? "DFL COMICS" : "SPORTS ILLUSTRATED",
        mainHeadline: `WEEK ${week} RECAP`,
        subHeadline: "The highest highs and lowest lows of the DFL",
        badgeText: `ISSUE ${week}`
      },
      filename: `week_${week}_recap_${Date.now()}`
    };

    const filename = await imageClient.generateImage(imagePayload);
    const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
    
    if (md) {
      // Post image cleanly as a standalone header message FIRST
      await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'recaps', false);
    }

    // Sleeper doesn't support Markdown, so strip all asterisks!
    article = article.replace(/\*/g, '');

    await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'recaps', true);
  } catch (err) {
    console.error('❌ Failed to generate or post weekly recap:', err.message);
  }
}

/**
 * Fetches NFL news and checks for fantasy relevance.
 */
async function checkNews(options) {
  const articles = await newsScraper.fetchLatestNews();
  if (!articles || articles.length === 0) return;

  for (const article of articles) {
    // ESPN API uses 'id' or 'nowId' for unique identification
    const articleId = String(article.id || article.headline);
    
    if (processedNews.includes(articleId)) {
      continue;
    }
    
    // Add to history so we don't process it again (even if it's ignored)
    processedNews.push(articleId);
    saveNewsHistory();
    
    // Pass to AI Bouncer
    const playerMatch = await generator.checkNewsRelevance(article.headline, article.description);
    
    if (playerMatch) {
      console.log(`   🚨 BREAKING NEWS RELEVANT to: ${playerMatch}`);
      // Find if this player is rostered
      const resolved = await sleeper.resolvePlayerByName(playerMatch);
      if (!resolved) {
        console.log(`   ⚠️ Player ${playerMatch} not found in our local sleeper DB.`);
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
        console.log(`   🔥 Player ${playerMatch} is owned by ${details.ownerName}! Generating detailed news commentary...`);
        data.teamName = details.teamName;
        data.ownerName = details.ownerName;
      } else {
        console.log(`   🤷 Player ${playerMatch} is a free agent. Generating brief news commentary...`);
      }
      
      let commentary = await generator.generateNewsCommentary(data);
      commentary = commentary.replace(/\*/g, ''); // strip markdown
      
      await postToSleeper(USER_TOKEN, LEAGUE_ID, commentary, options.dryRun, 'breaking_news', true);
      
      // Post the article link
      const link = article.link && article.link.web ? article.link.web.href : null;
      if (link) {
        const ytMessage = `Read more here: ${link}`;
        await postToSleeper(USER_TOKEN, LEAGUE_ID, ytMessage, options.dryRun, 'breaking_news', false);
      }
    }
  }
}

/**
 * Runs the bot continuously, polling the Sleeper API every 15 minutes for new trades.
 */
async function startDaemon(options) {
  console.log('🤖 Watch daemon active. Polling Sleeper DFL completed trades every 2 minutes...');
  
  // Run once immediately
  try {
    await checkTransactions(options);
    await checkNews(options);
  } catch (err) {
    console.error('❌ Error during daemon trade check:', err.message);
  }
  
  const pollIntervalMs = 2 * 60 * 1000;
  
  const runLoop = async () => {
    try {
      console.log(`\n⏰ Polling interval triggered at ${new Date().toISOString()}...`);
      await checkTransactions(options);
      await checkNews(options);
    } catch (err) {
      console.error('❌ Error during daemon trade check:', err.message);
    } finally {
      setTimeout(runLoop, pollIntervalMs);
    }
  };

  // Start the recursive loop after the first immediate run
  setTimeout(runLoop, pollIntervalMs);
}

/**
 * Main execution routing
 */
async function main() {
  const options = parseArgs();
  console.log('🎙️ Starting JARVIS Commentary Bot...');
  console.log(`   Options: checkTransactions=${options.checkTransactions}, weeklyRecap=${options.weeklyRecap}, testWebhook=${options.testWebhook}, dryRun=${options.dryRun}, watch=${options.watch}`);

  // Set up local file cache at startup
  await sleeper.loadSleeperPlayers();

  if (options.testWebhook) {
    await runTestWebhook(options.dryRun);
  } else if (options.weeklyRecap) {
    await generateWeeklyRecap(options);
  } else if (options.checkTransactions) {
    if (options.watch) {
      await startDaemon(options);
    } else {
      await checkTransactions(options);
    }
  } else {
    console.log('\n🎙️  JARVIS Bot: No action specified.');
    console.log('   Use: --check-transactions, --weekly-recap, or --test-webhook');
    console.log('   Add: --dry-run (to output locally only) or --force (to reprocess old trades)');
    console.log('   Add: --watch (to run continuously in watch mode)\n');
  }
}

main().catch(err => {
  console.error('❌ Fatal error in orchestrator:', err.message);
  process.exit(1);
});
