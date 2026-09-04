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
const promptHelpers = require('./src/imagePrompts');
const heartbeat = require('./src/heartbeat');
const evaluator = require('./src/evaluator');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const HISTORY_FILE = path.join(__dirname, 'data', 'processed_transactions.json');
const NEWS_HISTORY_FILE = path.join(__dirname, 'data', 'processed_news.json');
const NEWS_PLAYER_LOG_FILE = path.join(__dirname, 'data', 'news_player_log.json');
const EVENTS_HISTORY_FILE = path.join(__dirname, 'data', 'processed_events.json');

// Don't post about the same player more than once within this window
const NEWS_PLAYER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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

// Initialize generator. Commentary model is configurable — set GEMINI_MODEL or
// config.gemini_model to 'gemini-2.5-flash-lite' to cut cost further (classifier
// calls always use flash-lite regardless). Defaults to flash for joke quality.
const COMMENTARY_MODEL = process.env.GEMINI_MODEL || config.gemini_model || 'gemini-2.5-flash';
const generator = new CommentaryGenerator(GEMINI_KEY, COMMENTARY_MODEL);
console.log(`🧠 Commentary model: ${COMMENTARY_MODEL}`);

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

// Load per-player news log (playerName -> last posted ISO timestamp) for dedupe
let newsPlayerLog = {};
try {
  if (fs.existsSync(NEWS_PLAYER_LOG_FILE)) {
    newsPlayerLog = JSON.parse(fs.readFileSync(NEWS_PLAYER_LOG_FILE, 'utf8'));
  }
} catch (err) {
  console.warn('⚠️ Failed to load news player log, starting fresh.', err.message);
}

// Load processed weekly events history
let processedEvents = { matchupOfWeek: [], mondayMiracle: [], seasonPreview: [] };
try {
  if (fs.existsSync(EVENTS_HISTORY_FILE)) {
    processedEvents = JSON.parse(fs.readFileSync(EVENTS_HISTORY_FILE, 'utf8'));
    if (!processedEvents.seasonPreview) processedEvents.seasonPreview = [];
  }
} catch (err) {
  console.warn('⚠️ Failed to load processed events history, starting fresh.', err.message);
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

function saveNewsPlayerLog() {
  try {
    fs.writeFileSync(NEWS_PLAYER_LOG_FILE, JSON.stringify(newsPlayerLog, null, 2));
  } catch (err) {
    console.error('❌ Failed to save news player log:', err.message);
  }
}

function saveEventsHistory() {
  try {
    fs.writeFileSync(EVENTS_HISTORY_FILE, JSON.stringify(processedEvents, null, 2));
  } catch (err) {
    console.error('❌ Failed to save events history:', err.message);
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
    seasonPreview: args.includes('--season-preview'),
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
      const usernameA = detailsA.username;
      const teamNameA = detailsA.teamName;
      const managerB = detailsB.ownerName;
      const usernameB = detailsB.username;
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
        usernameA,
        teamNameA,
        managerALore,
        managerAMode,
        managerB,
        usernameB,
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

        // Claim the trade NOW that generation succeeded, before any posting.
        // If a post fails afterward we lose one reaction instead of re-posting
        // it on every subsequent 2-minute poll (the Odell Beckham spam bug).
        if (!options.dryRun) {
          processedTransactions.push(tradeId);
          saveHistory();
        }

        // Generate a trade comic ~50% of the time (changed from 100%)
        if (Math.random() < 0.5) {
          console.log(`   🎨 Generating trade cartoon...`);
          const imagePayload = {
            prompt: promptHelpers.getRandomPrompt('trades'),
            style: "retro-comic",
            overlayText: {
              title: "TRADE ALERT",
              mainHeadline: "BLOCKBUSTER",
              subHeadline: `${teamNameA} and ${teamNameB} strike a deal!`,
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
      } catch (err) {
        console.error(`❌ Failed to process and post trade ${tradeId}:`, err.message);
        if (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Quota'))) {
          console.warn('\n⚠️ Gemini API rate limit or quota exceeded. Stopping transaction scan to prevent further API errors.');
          break;
        }
      }
  }

  // --- WAIVERS & FREE AGENTS (FAAB & Fallen Legends) ---
  let processedEventCount = 0;
  const MAX_EVENTS_PER_RUN = 2;

  allDrops.sort((a, b) => a.status_updated - b.status_updated);

  for (const tx of allDrops) {
    const txId = tx.transaction_id;
    if (processedTransactions.includes(txId) && !options.force) continue;
    if (processedEventCount >= MAX_EVENTS_PER_RUN) break;

    let eventPosted = false;
    let claimed = false;
    // Claim exactly once. Called right after generation succeeds (before posting)
    // so a failed post can't trigger a re-post on every poll — the bug that
    // spammed Odell Beckham's eulogy 20+ times during the Gemini outage.
    const claim = () => {
      if (!claimed && !options.dryRun) {
        processedTransactions.push(txId);
        saveHistory();
        claimed = true;
      }
    };

    try {
      // 1. FAAB WAIVER HEIST PROTOCOL
      if (tx.type === 'waiver' && tx.settings && tx.settings.waiver_bid >= 25 && tx.adds) {
        for (const [playerId, rosterId] of Object.entries(tx.adds)) {
          const resolved = await sleeper.resolvePlayer(playerId);
          const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, rosterId);
          console.log(`   💰 MASSIVE FAAB DETECTED: ${details.teamName} spent $${tx.settings.waiver_bid} on ${resolved.name}!`);

          const data = {
            teamName: details.teamName,
            ownerName: details.ownerName,
            username: details.username,
            playerName: resolved.name,
            bid: tx.settings.waiver_bid,
            remainingFaab: "Unknown" // Sleeper transaction endpoint doesn't contain current FAAB balances
          };

          let article = await generator.generateFAABCommentary(data);
          article = article.replace(/\*/g, '');
          claim(); // generation succeeded — claim before posting

          if (Math.random() < 0.5) {
            console.log(`   🎨 Generating FAAB Vault image...`);
            const imagePayload = {
              prompt: promptHelpers.getRandomPrompt('faab'),
              style: "faab-heist",
              overlayText: {
                title: "FAAB ALERT",
                mainHeadline: "BANKRUPT",
                subHeadline: `${details.teamName} spends $${tx.settings.waiver_bid}!`,
                badgeText: "WAIVERS"
              },
              filename: `faab_${txId}`
            };
            const filename = await imageClient.generateImage(imagePayload);
            const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
            if (md) {
              await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'waivers', false);
            }
          }

          await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'waivers', true);
          eventPosted = true;
          break; // Only trigger one FAAB alert per transaction
        }
      }

      // 2. FALLEN LEGENDS PROTOCOL
      if (tx.drops) {
        for (const [playerId, rosterId] of Object.entries(tx.drops)) {
          const resolved = await sleeper.resolvePlayer(playerId);
          
          const isSkillPos = ['QB', 'RB', 'WR', 'TE'].includes(resolved.position);
          if (isSkillPos && (resolved.years_exp >= 4 || resolved.age >= 26)) {
            console.log(`   🕵️  Checking if dropped veteran ${resolved.name} is a Fallen Legend...`);
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
                ownerName: details.ownerName,
                username: details.username
              };
              
              let article = await generator.generateFallenLegendCommentary(data);
              article = article.replace(/\*/g, '');
              claim(); // generation succeeded — claim before posting

              if (Math.random() < 0.5) {
                console.log(`   🎨 Generating Fallen Legend memorial image...`);
                const imagePayload = {
                  prompt: promptHelpers.getRandomPrompt('fallenLegend'),
                  style: "fallen-legend",
                  overlayText: {
                    title: "FALLEN LEGEND",
                    mainHeadline: "GOODBYE",
                    subHeadline: `${resolved.name} dropped by ${details.teamName}`,
                    badgeText: "LEGEND"
                  },
                  filename: `legend_${txId}_${playerId}`
                };
                const filename = await imageClient.generateImage(imagePayload);
                const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
                if (md) {
                  await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'waivers', false);
                }
              }

              // The YouTube highlight link is already embedded in the eulogy text by the prompt —
              // posting it again as a separate message caused duplicate-link spam (see OBJ drop).
              await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'waivers', true);

              eventPosted = true;
            } else {
              console.log(`   ❌ AI Bouncer rejected ${resolved.name}. Just a veteran, not a legend.`);
            }
          }
        }
      }

      if (eventPosted) {
        processedEventCount++;
      }
      // Mark every examined transaction exactly once. Events were already
      // claimed pre-post; boring drops and rejected non-legends get claimed here
      // so we never re-examine them. A generation failure throws before any
      // claim(), leaving the tx unclaimed so it retries once Gemini recovers.
      claim();
    } catch (err) {
      console.error(`❌ Failed to process waiver transaction ${txId}:`, err.message);
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
  const league = await sleeper.getLeague(LEAGUE_ID);
  if (league.status !== 'in_season') {
    console.log(`⏳ League is not in season. Skipping Weekly Recap.`);
    return;
  }
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
    
    // Generate Magazine Cover
    if (Math.random() < 0.5) {
      console.log(`   🎨 Generating weekly recap image...`);
      const imagePayload = {
        prompt: promptHelpers.getRandomPrompt('recap'),
        style: "weekly-recap",
        overlayText: {
          title: "WEEKLY RECAP",
          mainHeadline: `WEEK ${week}`,
          subHeadline: `Highest Score: ${highestScoringOwner || 'N/A'}`,
          badgeText: "RECAP"
        },
        filename: `recap_week${week}_${Date.now()}`
      };
      const filename = await imageClient.generateImage(imagePayload);
      const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
      
      if (md) {
        // Post image cleanly as a standalone header message FIRST
        await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'recaps', false);
      }
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

  // Cold start protection: if we have no history, just save the current news and exit so we don't spam
  if (processedNews.length === 0 && !options.force) {
    console.log('🏁 Cold start detected for News: Initializing news database with existing articles to prevent spam...');
    articles.forEach(article => {
      const articleId = String(article.id || article.headline);
      processedNews.push(articleId);
    });
    saveNewsHistory();
    console.log(`✅ News database initialized with ${processedNews.length} articles. Exiting.`);
    return;
  }

  // Hard backstop: never post more than this many news items in a single run,
  // no matter what the dedup does. Bounds the blast radius of any dedup failure
  // (this is what would have capped the Stefon Diggs spam at 2 instead of 25).
  const MAX_NEWS_PER_RUN = 2;
  let newsPostsThisRun = 0;

  for (const article of articles) {
    if (newsPostsThisRun >= MAX_NEWS_PER_RUN) {
      console.log(`   ⏳ Hit news cap (${MAX_NEWS_PER_RUN}/run). Remaining articles will process next poll.`);
      break;
    }

    // ESPN API uses 'id' or 'nowId' for unique identification
    const articleId = String(article.id || article.headline);

    if (processedNews.includes(articleId)) {
      continue;
    }

    // Fast local pre-filter: check if headline/description mentions any rostered player in our league
    const rosters = await sleeper.getRosters(LEAGUE_ID);
    const rosteredPlayerIds = new Set(rosters.flatMap(r => r.players || []));
    const fullText = `${article.headline} ${article.description}`.toLowerCase();
    
    let hasRosteredPlayerMention = false;
    for (const pId of rosteredPlayerIds) {
      const p = await sleeper.resolvePlayer(pId);
      if (p && p.name && p.name.length > 3) {
        const lastName = p.name.split(' ').pop().toLowerCase();
        if (lastName.length >= 4 && fullText.includes(lastName)) {
          hasRosteredPlayerMention = true;
          break;
        }
      }
    }

    if (!hasRosteredPlayerMention) {
      // No rostered player mentioned — mark processed without wasting an API call
      processedNews.push(articleId);
      saveNewsHistory();
      continue;
    }

    // Pass to AI Bouncer first — only mark processed once we get a definitive answer.
    // If Gemini is down (503/401), leave the article unmarked so the next poll retries it.
    let playerMatch;
    try {
      playerMatch = await generator.checkNewsRelevance(article.headline, article.description);
    } catch (err) {
      console.error(`   ⏳ Bouncer unavailable for "${article.headline}" — will retry next poll.`);
      continue;
    }

    // Add to history so we don't process it again (even if it's ignored)
    processedNews.push(articleId);
    saveNewsHistory();

    if (playerMatch) {
      console.log(`   🚨 BREAKING NEWS RELEVANT to: ${playerMatch}`);

      // Per-player dedupe: skip if we already posted about this player recently,
      // so a flurry of articles about one guy doesn't spam the chat.
      const playerKey = playerMatch.toLowerCase().trim();
      const lastPosted = newsPlayerLog[playerKey] ? Date.parse(newsPlayerLog[playerKey]) : 0;
      if (lastPosted && (Date.now() - lastPosted) < NEWS_PLAYER_COOLDOWN_MS) {
        console.log(`   🔁 Already posted about ${playerMatch} in the last 24h — skipping duplicate.`);
        continue;
      }

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

      if (!roster) {
        // Only post news about players someone in the league actually rosters —
        // league-agnostic ESPN headlines about free agents aren't relevant to the chat.
        // (Already marked processed above, so this won't be re-evaluated next poll.)
        console.log(`   🤷 Player ${playerMatch} isn't on any roster in this league — skipping post.`);
        continue;
      }

      const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, roster.roster_id);
      console.log(`   🔥 Player ${playerMatch} is owned by ${details.ownerName}! Generating detailed news commentary...`);
      data.teamName = details.teamName;
      data.ownerName = details.ownerName;
      data.username = details.username;
      
      let commentary = await generator.generateNewsCommentary(data);
      commentary = commentary.replace(/\*/g, ''); // strip markdown

      // Match the prefix file's trigger sections: injuries for injury news, news_scraper otherwise
      const newsTrigger = data.isInjury ? 'injuries' : 'news_scraper';

      if (Math.random() < 0.5) {
        console.log(`   🎨 Generating breaking news image...`);
        const imagePayload = {
          prompt: promptHelpers.getRandomPrompt(data.isInjury ? 'injury' : 'news'),
          style: "breaking-news",
          overlayText: {
            title: "BREAKING NEWS",
            mainHeadline: data.isInjury ? "INJURY" : "ALERT",
            subHeadline: article.headline.substring(0, 40) + "...",
            badgeText: "NEWS"
          },
          filename: `news_${articleId}`
        };
        const filename = await imageClient.generateImage(imagePayload);
        const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
        if (md) {
          await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, newsTrigger, false);
        }
      }

      // Fold the article link into the commentary message instead of posting it separately
      const link = article.link && article.link.web ? article.link.web.href : null;
      if (link) {
        commentary += `\n\nRead more here: ${link}`;
      }

      await postToSleeper(USER_TOKEN, LEAGUE_ID, commentary, options.dryRun, newsTrigger, true);
      newsPostsThisRun++;

      // Record this player so repeat articles within the cooldown window are skipped
      if (!options.dryRun) {
        newsPlayerLog[playerKey] = new Date().toISOString();
        saveNewsPlayerLog();
      }
    }
  }
}

/**
 * Checks for Thursday Matchup of the Week.
 */
async function checkMatchupOfTheWeek(options) {
  const date = new Date();
  const day = date.getDay(); // 0 is Sunday, 4 is Thursday
  
  if (day !== 4) return; // Only run on Thursdays

  const league = await sleeper.getLeague(LEAGUE_ID);
  if (league.status !== 'in_season') {
    console.log(`⏳ League is not in season. Skipping Matchup of the Week.`);
    return;
  }
  const week = league.settings.leg || 1;
  const eventId = `week_${week}`;

  if (processedEvents.matchupOfWeek.includes(eventId)) return;

  console.log(`🏈 Checking for Matchup of the Week for Week ${week}...`);

  const matchups = await sleeper.getMatchups(LEAGUE_ID, week);
  if (!matchups || matchups.length === 0) return;

  const users = await sleeper.getUsers(LEAGUE_ID);
  const rosters = await sleeper.getRosters(LEAGUE_ID);

  // Group matchups by matchup_id
  const matchupPairs = {};
  for (const m of matchups) {
    if (!matchupPairs[m.matchup_id]) matchupPairs[m.matchup_id] = [];
    matchupPairs[m.matchup_id].push(m);
  }

  let closestMatchup = null;
  let smallestDiff = 999;

  for (const [matchupId, pair] of Object.entries(matchupPairs)) {
    if (pair.length !== 2) continue;
    const team1 = pair[0];
    const team2 = pair[1];

    // Note: Projected scores require parsing starters and calculating projections.
    // For simplicity, we will assume standard ESPN/Sleeper projections, but since we don't have
    // an easy projection endpoint, we will use their CURRENT scores or a random close game.
    // Sleeper's /matchups endpoint actually does not contain projected scores natively.
    // We will just find the highest scoring team's matchup from last week, OR just pick a random matchup for the hype.
    // Actually, picking a random matchup is easiest if projections aren't available.
    
    // For now, just pick the first matchup to act as the Matchup of the Week hype.
    closestMatchup = pair;
    break; 
  }

  if (closestMatchup) {
    const t1 = closestMatchup[0];
    const t2 = closestMatchup[1];
    const d1 = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, t1.roster_id);
    const d2 = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, t2.roster_id);

    const data = {
      teamA: d1.teamName,
      ownerA: d1.ownerName,
      projA: "115.4", // Placeholder for actual projection integration
      teamB: d2.teamName,
      ownerB: d2.ownerName,
      projB: "112.8",
      records: {
        [d1.teamName]: "TBD",
        [d2.teamName]: "TBD"
      }
    };

    let article = await generator.generateMatchupOfTheWeekCommentary(data);
    article = article.replace(/\*/g, '');

    if (Math.random() < 0.5) {
      console.log(`   🎨 Generating Matchup of the Week image...`);
      const imagePayload = {
        prompt: promptHelpers.getRandomPrompt('matchup'),
        style: "matchup-week",
        overlayText: {
          title: "MATCHUP OF THE WEEK",
          mainHeadline: "THURSDAY PREVIEW",
          subHeadline: `${d1.teamName} vs ${d2.teamName}`,
          badgeText: "PREVIEW"
        },
        filename: `matchup_${week}`
      };
      const filename = await imageClient.generateImage(imagePayload);
      const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
      if (md) {
        await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'recaps', false);
      }
    }

    await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'recaps', true);

    if (!options.dryRun) {
      processedEvents.matchupOfWeek.push(eventId);
      saveEventsHistory();
    }
  }
}

/**
 * Checks for Monday Night Miracle.
 */
async function checkMondayNightMiracle(options) {
  const date = new Date();
  const day = date.getDay(); // 1 is Monday
  
  if (day !== 1) return; // Only run on Mondays

  const league = await sleeper.getLeague(LEAGUE_ID);
  if (league.status !== 'in_season') {
    console.log(`⏳ League is not in season. Skipping Monday Night Miracle.`);
    return;
  }
  const week = league.settings.leg || 1;
  const eventId = `monday_${week}`;

  if (processedEvents.mondayMiracle.includes(eventId)) return;

  console.log(`🏈 Checking for Monday Night Miracle for Week ${week}...`);

  const matchups = await sleeper.getMatchups(LEAGUE_ID, week);
  if (!matchups || matchups.length === 0) return;

  // We group by matchup id, find the closest score diff where players are yet to play
  const matchupPairs = {};
  for (const m of matchups) {
    if (!matchupPairs[m.matchup_id]) matchupPairs[m.matchup_id] = [];
    matchupPairs[m.matchup_id].push(m);
  }

  let bestMiracle = null;
  let smallestDiff = 999;

  for (const [matchupId, pair] of Object.entries(matchupPairs)) {
    if (pair.length !== 2) continue;
    const team1 = pair[0];
    const team2 = pair[1];
    const diff = Math.abs((team1.points || 0) - (team2.points || 0));

    if (diff < 15 && diff < smallestDiff) {
      smallestDiff = diff;
      bestMiracle = pair;
    }
  }

  if (bestMiracle) {
    const t1 = bestMiracle[0];
    const t2 = bestMiracle[1];
    const d1 = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, t1.roster_id);
    const d2 = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, t2.roster_id);

    const data = {
      teamA: d1.teamName,
      scoreA: t1.points || 0,
      projA: "110",
      playersLeftA: ["MNF Player"],
      teamB: d2.teamName,
      scoreB: t2.points || 0,
      projB: "108",
      playersLeftB: ["MNF Player"]
    };

    let article = await generator.generateMondayNightMiracleCommentary(data);
    article = article.replace(/\*/g, '');

    if (Math.random() < 0.5) {
      console.log(`   🎨 Generating Monday Night Miracle image...`);
      const imagePayload = {
        prompt: promptHelpers.getRandomPrompt('mondayNight'),
        style: "monday-night",
        overlayText: {
          title: "MONDAY NIGHT MIRACLE",
          mainHeadline: "DOWN TO THE WIRE",
          subHeadline: `${d1.teamName} trails ${d2.teamName} by ${smallestDiff.toFixed(1)}!`,
          badgeText: "TENSION"
        },
        filename: `monday_${week}`
      };
      const filename = await imageClient.generateImage(imagePayload);
      const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
      if (md) {
        await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'recaps', false);
      }
    }

    await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'recaps', true);

    if (!options.dryRun) {
      processedEvents.mondayMiracle.push(eventId);
      saveEventsHistory();
    }
  }
}

/**
 * Core Logic: Generate Bill Simmons-style Preseason Over/Under Gambling Manifesto.
 */
async function generateSeasonPreview(options) {
  const date = new Date();
  const year = date.getFullYear();

  console.log(`🏈 Generating DFL Preseason Over/Under Gambling Manifesto for ${year}...`);

  const rosters = await sleeper.getRosters(LEAGUE_ID);
  const users = await sleeper.getUsers(LEAGUE_ID);

  if (!rosters || rosters.length === 0) {
    console.error('❌ No rosters found for league.');
    return;
  }

  // 1. Fetch recent transactions to capture offseason trades
  let recentTradesByRoster = {};
  try {
    const currentWeek = (await sleeper.getLeague(LEAGUE_ID))?.settings?.leg || 1;
    const weeksToCheck = [1, currentWeek];
    for (const w of weeksToCheck) {
      const txs = await sleeper.getTransactions(LEAGUE_ID, w);
      const trades = txs.filter(t => t.type === 'trade' && t.status === 'complete');
      for (const tr of trades) {
        for (const rId of (tr.roster_ids || [])) {
          if (!recentTradesByRoster[rId]) recentTradesByRoster[rId] = [];
          recentTradesByRoster[rId].push(tr);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch recent trades for preview:', err.message);
  }

  // 2. Fetch 14-week schedule to evaluate Strength of Schedule (SoS)
  let scheduleByRoster = {};
  try {
    for (let w = 1; w <= 14; w++) {
      const mList = await sleeper.getMatchups(LEAGUE_ID, w);
      if (!mList) continue;
      const mPairs = {};
      for (const m of mList) {
        if (!mPairs[m.matchup_id]) mPairs[m.matchup_id] = [];
        mPairs[m.matchup_id].push(m.roster_id);
      }
      for (const pair of Object.values(mPairs)) {
        if (pair.length === 2) {
          const [r1, r2] = pair;
          if (!scheduleByRoster[r1]) scheduleByRoster[r1] = [];
          if (!scheduleByRoster[r2]) scheduleByRoster[r2] = [];
          scheduleByRoster[r1].push(r2);
          scheduleByRoster[r2].push(r1);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch 14-week schedule for preview:', err.message);
  }

  // Evaluate each team's roster composite value
  const teamEvaluations = [];
  let totalLeagueValue = 0;

  evaluator.loadRankings();

  for (const r of rosters) {
    const details = await sleeper.getTeamDetailsByRosterId(LEAGUE_ID, r.roster_id);
    const playerIds = r.players || [];
    
    const playerObjects = [];
    let rosterVal = 0;
    for (const pId of playerIds) {
      const p = await sleeper.resolvePlayer(pId);
      if (p && p.name) {
        const found = evaluator.findPlayer(p.name) || evaluator.findPlayer(pId);
        const val = found?.composite_value || 100;
        p.val = val;
        rosterVal += val;
        playerObjects.push(p);
      }
    }

    const topStars = playerObjects
      .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5)
      .map(p => `${p.name} (${p.position})`);

    totalLeagueValue += rosterVal;

    const lore = MANAGER_LORE[details.ownerName] || MANAGER_LORE[details.teamName] || '';
    const getRosterMode = (l) => {
      if (l.toLowerCase().includes('rebuild')) return 'Rebuilder / Future Picks Hoarder';
      if (l.toLowerCase().includes('contend')) return 'Heavyweight Contender / Win-Now Window';
      return 'Middle-Class Purgatory';
    };

    const hasRecentTrade = (recentTradesByRoster[r.roster_id] || []).length > 0;
    const tradeSummary = hasRecentTrade 
      ? `Active in offseason trading (${recentTradesByRoster[r.roster_id].length} trade(s) completed recently)`
      : 'Quiet offseason, standing pat on current roster core';

    teamEvaluations.push({
      rosterId: r.roster_id,
      teamName: details.teamName.replace(/🫩/g, '').trim(),
      ownerName: details.ownerName,
      username: details.username,
      rosterMode: getRosterMode(lore),
      topPlayers: topStars.length > 0 ? topStars : ['Roster Core'],
      recentTrades: tradeSummary,
      lore,
      wins: r.settings.wins || 0,
      rosterVal
    });
  }

  const avgVal = totalLeagueValue / (teamEvaluations.length || 1);

  // Map opponent values to calculate Strength of Schedule (SoS)
  const rosterValMap = {};
  teamEvaluations.forEach(t => { rosterValMap[t.rosterId] = t.rosterVal; });

  const teamsData = teamEvaluations.map(t => {
    const oppIds = scheduleByRoster[t.rosterId] || [];
    let totalOppVal = 0;
    oppIds.forEach(oId => { totalOppVal += (rosterValMap[oId] || avgVal); });
    const avgOppVal = oppIds.length > 0 ? (totalOppVal / oppIds.length) : avgVal;

    let sosDescription = 'Balanced 14-Week Schedule';
    if (avgOppVal > avgVal + 2) {
      sosDescription = 'Tough 14-Week Schedule (Brutal opponent gauntlet)';
    } else if (avgOppVal < avgVal - 2) {
      sosDescription = 'Favorable 14-Week Schedule (Soft opponent slate)';
    }

    const diff = t.rosterVal - avgVal;
    let rawLine = 7.0 + (diff / 20.0);
    rawLine = Math.max(4.5, Math.min(9.5, rawLine));
    const winLine = (Math.round(rawLine * 2) / 2).toFixed(1);

    let playerNotes = '';
    if (t.ownerName.toLowerCase().includes('tyler')) {
      playerNotes = "BREAKING NEWS: Josh Jacobs recently placed on Commissioner's Exempt List and faces a potential season-long suspension! Backfield is in sudden jeopardy. Tank Dell is 26+ (older breakout, not a young dynasty prospect).";
    } else if (t.ownerName.toLowerCase().includes('dom')) {
      playerNotes = "In Superflex / 2QB format, holding Trevor Lawrence and Kyler Murray as his QB tandem alongside Ja'Marr Chase and A.J. Brown gives him one of the most explosive offensive cores in the league.";
    } else if (t.ownerName.toLowerCase().includes('tony')) {
      playerNotes = "Recently put Patrick Mahomes, Stefon Diggs, Jaylen Warren, and T.J. Hockenson on the trade block in chat.";
    } else if (t.ownerName.toLowerCase().includes('matt') && t.teamName.toLowerCase().includes('shough')) {
      playerNotes = "Recently complained in league chat about getting sniped on rookie QB Kyle McCord.";
    }

    return {
      teamName: t.teamName,
      ownerName: t.ownerName,
      winLine,
      rosterMode: t.rosterMode,
      topPlayers: t.topPlayers,
      sosDescription,
      recentTrades: t.recentTrades,
      playerNotes,
      lore: t.lore
    };
  });

  console.log(`   💬 Fetching recent league chat messages...`);
  const recentChat = await sleeper.getRecentChat(LEAGUE_ID, USER_TOKEN);
  console.log(`   ✅ Pulled ${recentChat.length} recent chat message(s).`);

  const previewPayload = {
    year,
    teams: teamsData,
    recentChat
  };

  try {
    let article = await generator.generateSeasonPreview(previewPayload);

    // Generate Custom Las Vegas / Over-Under Magazine Graphic (100% guaranteed)
    console.log(`   🎨 Generating Preseason Over/Under graphic...`);
    const imagePayload = {
      prompt: promptHelpers.getRandomPrompt('seasonPreview'),
      style: "retro-comic",
      overlayText: {
        title: "SEASON PREVIEW",
        mainHeadline: `${year} OVER / UNDER`,
        subHeadline: "GAMBLING MANIFESTO",
        badgeText: "PREVIEW"
      },
      filename: `preview_${year}_${Date.now()}`
    };
    const filename = await imageClient.generateImage(imagePayload);
    const md = await imageClient.pushAndGetMarkdown(filename, options.dryRun);
    if (md) {
      await postToSleeper(USER_TOKEN, LEAGUE_ID, md.trim(), options.dryRun, 'general', false);
    }

    article = article.replace(/\*/g, '');
    await postToSleeper(USER_TOKEN, LEAGUE_ID, article, options.dryRun, 'general', true);

    if (!options.dryRun) {
      if (!processedEvents.seasonPreview) processedEvents.seasonPreview = [];
      processedEvents.seasonPreview.push(`preview_${year}`);
      saveEventsHistory();
    }
  } catch (err) {
    console.error('❌ Failed to generate Preseason Over/Under column:', err.message);
  }
}

/**
 * Checks if it's time for the Preseason Over/Under (approx 1 week before NFL kickoff).
 */
async function checkPreseasonOverUnder(options) {
  const date = new Date();
  const year = date.getFullYear();
  const eventId = `preview_${year}`;

  if (!processedEvents.seasonPreview) processedEvents.seasonPreview = [];
  if (processedEvents.seasonPreview.includes(eventId) && !options.force) return;

  const month = date.getMonth();
  const day = date.getDate();

  // 1 week before kickoff corresponds to late August (Aug 24-31) or early Sept (Sept 1-8).
  const isOneWeekBeforeKickoff = (month === 7 && day >= 24) || (month === 8 && day <= 8);

  if (isOneWeekBeforeKickoff || options.force) {
    console.log(`🏈 1 Week Before Kickoff Triggered: Generating Preseason Over/Under Manifesto...`);
    await generateSeasonPreview(options);
  }
}

/**
 * Runs the bot continuously, polling the Sleeper API every 15 minutes for new trades.
 */
async function startDaemon(options) {
  console.log('🤖 Watch daemon active. Polling Sleeper DFL completed trades every 2 minutes...');

  // Run once immediately
  try {
    heartbeat.updateHeartbeat(); // tell the cloud backup the laptop is alive
    await checkTransactions(options);
    await checkMatchupOfTheWeek(options);
    await checkMondayNightMiracle(options);
  } catch (err) {
    console.error('❌ Error during daemon immediate check:', err.message);
  }

  const pollIntervalMs = 2 * 60 * 1000;

  const runLoop = async () => {
    try {
      console.log(`\n⏰ Polling interval triggered at ${new Date().toISOString()}...`);
      heartbeat.updateHeartbeat(); // throttled internally to ~5 min
      await checkTransactions(options);
      await checkMatchupOfTheWeek(options);
      await checkMondayNightMiracle(options);
    } catch (err) {
      console.error('❌ Error during daemon polling check:', err.message);
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
  } else if (options.seasonPreview) {
    await generateSeasonPreview(options);
  } else if (options.checkTransactions) {
    if (options.watch) {
      await startDaemon(options);
    } else {
      await checkTransactions(options);
    }
  } else {
    console.log('\n🎙️  JARVIS Bot: No action specified.');
    console.log('   Use: --check-transactions, --weekly-recap, --season-preview, or --test-webhook');
    console.log('   Add: --dry-run (to output locally only) or --force (to reprocess old trades)');
    console.log('   Add: --watch (to run continuously in watch mode)\n');
  }
}

main().catch(err => {
  console.error('❌ Fatal error in orchestrator:', err.message);
  process.exit(1);
});
