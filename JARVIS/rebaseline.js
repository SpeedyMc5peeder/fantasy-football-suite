/**
 * rebaseline.js — one-off maintenance script.
 *
 * Marks the CURRENT backlog of transactions and news articles as already
 * processed, so neither the local nor cloud bot re-fires old events (e.g. a
 * drop that happened weeks ago re-triggering a Fallen Legend eulogy every run).
 * Only genuinely NEW events after this point will post.
 *
 * Run once:  node rebaseline.js
 */
const fs = require('fs');
const path = require('path');
const sleeper = require('./src/sleeperClient');
const newsScraper = require('./src/newsScraper');

const config = require('../config.json');
const dflConfig = config.leagues.find(l => l.name === 'DFL') || {};
const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || dflConfig.sleeper_league_id;

const TX_FILE = path.join(__dirname, 'data', 'processed_transactions.json');
const NEWS_FILE = path.join(__dirname, 'data', 'processed_news.json');

const load = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const uniq = (arr) => [...new Set(arr)];

(async () => {
  await sleeper.loadSleeperPlayers();

  // --- Transactions (trades + drops) for the current transaction window ---
  const league = await sleeper.getLeague(LEAGUE_ID);
  const week = league.settings.leg || 1;
  const weeks = week > 1 ? [week, week - 1] : [week];
  let txIds = [];
  for (const w of weeks) {
    const txns = await sleeper.getTransactions(LEAGUE_ID, w);
    txIds.push(...txns.filter(t => t.status === 'complete').map(t => t.transaction_id));
  }
  const prevTx = load(TX_FILE);
  const newTx = uniq([...prevTx, ...txIds]);
  fs.writeFileSync(TX_FILE, JSON.stringify(newTx, null, 2));
  console.log(`Transactions: ${prevTx.length} -> ${newTx.length} (baselined ${txIds.length} current tx across weeks ${weeks.join(',')})`);

  // --- News articles currently in the ESPN feed ---
  const articles = await newsScraper.fetchLatestNews();
  const newsIds = articles.map(a => String(a.id || a.headline));
  const prevNews = load(NEWS_FILE);
  const newNews = uniq([...prevNews, ...newsIds]);
  fs.writeFileSync(NEWS_FILE, JSON.stringify(newNews, null, 2));
  console.log(`News: ${prevNews.length} -> ${newNews.length} (baselined ${newsIds.length} current articles)`);

  console.log('Re-baseline complete. Only new events after now will post.');
})().catch(e => { console.error('rebaseline failed:', e.message); process.exit(1); });
