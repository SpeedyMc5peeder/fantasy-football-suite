/**
 * server.js — Dynasty Evaluator REST API
 *
 * Exposes:
 *   GET  /api/rankings          → Full player rankings with composite, contender, rebuilder values
 *   POST /api/evaluate          → Trade evaluation with stud premium and roster taxes
 *   POST /api/rankings/refresh  → Trigger a fresh scrape + rebuild of rankings.json
 *
 * Default port: 5000 (matches README.md spec)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { evaluateTrade, applyTeamMode, compositeValue } = require('./formulas');
const { run: runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, '..', 'data', 'rankings.json');

app.use(cors());
app.use(express.json());

// ─── Load Rankings ───────────────────────────────────────────────────────────

let rankingsData = null;

function loadRankings() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      rankingsData = JSON.parse(raw);
      console.log(`📂 Loaded ${rankingsData.rankings.length} players from rankings.json (scraped: ${rankingsData.meta.scraped_at})`);
    } else {
      console.log('⚠️  No rankings.json found. Run "npm run scrape" first, or POST /api/rankings/refresh');
    }
  } catch (err) {
    console.error('❌ Failed to load rankings.json:', err.message);
  }
}

loadRankings();

// ─── Helper: find player by ID or name ───────────────────────────────────────

function findPlayer(query) {
  if (!rankingsData) return null;
  const q = String(query).toLowerCase().trim();
  return rankingsData.rankings.find(p =>
    p.id === query ||
    String(p.ktc_id) === q ||
    p.sleeper_id === query ||
    p.name.toLowerCase() === q ||
    p.slug === q
  ) || null;
}

// ─── GET /api/rankings ───────────────────────────────────────────────────────

app.get('/api/rankings', (req, res) => {
  if (!rankingsData) {
    return res.status(503).json({ error: 'Rankings not loaded. Run scraper first.' });
  }

  let results = [...rankingsData.rankings];

  // Optional filters
  const { position, team, search, limit, min_value } = req.query;

  if (position) {
    const positions = position.toUpperCase().split(',');
    results = results.filter(p => positions.includes(p.position));
  }
  if (team) {
    results = results.filter(p => p.team.toUpperCase() === team.toUpperCase());
  }
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(s));
  }
  if (min_value) {
    const mv = Number(min_value);
    results = results.filter(p => p.composite_value >= mv);
  }
  if (limit) {
    results = results.slice(0, Number(limit));
  }

  res.json(results);
});

// ─── GET /api/rankings/meta ──────────────────────────────────────────────────

app.get('/api/rankings/meta', (req, res) => {
  if (!rankingsData) {
    return res.status(503).json({ error: 'Rankings not loaded.' });
  }
  res.json(rankingsData.meta);
});

// ─── GET /api/player/:id ─────────────────────────────────────────────────────

app.get('/api/player/:id', (req, res) => {
  const player = findPlayer(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// ─── POST /api/evaluate ──────────────────────────────────────────────────────

app.post('/api/evaluate', (req, res) => {
  if (!rankingsData) {
    return res.status(503).json({ error: 'Rankings not loaded. Run scraper first.' });
  }

  const { sideA, sideB, settings } = req.body;
  if (!sideA || !sideB) {
    return res.status(400).json({ error: 'Both sideA and sideB are required.' });
  }

  const modeA = settings?.team_1_mode || 'neutral';
  const modeB = settings?.team_2_mode || 'neutral';

  // Resolve players and picks for Side A
  const sideAAssets = [
    ...(sideA.players || []),
    ...(sideA.picks || []),
  ];
  const sideBAssets = [
    ...(sideB.players || []),
    ...(sideB.picks || []),
  ];

  // Look up values
  const resolveAssets = (assetIds, mode) => {
    return assetIds.map(id => {
      const player = findPlayer(id);
      if (!player) {
        return { id, name: id, value: 0, found: false };
      }
      const adjusted = applyTeamMode(player.composite_value, player.position, player.age, mode);
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        composite_value: player.composite_value,
        adjusted_value: adjusted,
        found: true,
      };
    });
  };

  const resolvedA = resolveAssets(sideAAssets, modeA);
  const resolvedB = resolveAssets(sideBAssets, modeB);

  const sideAValues = resolvedA.map(a => a.adjusted_value || a.value || 0);
  const sideBValues = resolvedB.map(b => b.adjusted_value || b.value || 0);

  const result = evaluateTrade({ sideAValues, sideBValues });

  res.json({
    ...result,
    sideA_details: resolvedA,
    sideB_details: resolvedB,
  });
});

// ─── POST /api/rankings/refresh ──────────────────────────────────────────────

let scraping = false;

app.post('/api/rankings/refresh', async (req, res) => {
  if (scraping) {
    return res.status(429).json({ error: 'Scrape already in progress.' });
  }
  scraping = true;
  try {
    console.log('🔄 Manual refresh triggered...');
    await runScraper();
    loadRankings();
    res.json({ success: true, total: rankingsData?.rankings?.length || 0, scraped_at: rankingsData?.meta?.scraped_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    scraping = false;
  }
});

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rankings_loaded: !!rankingsData,
    total_players: rankingsData?.rankings?.length || 0,
    scraped_at: rankingsData?.meta?.scraped_at || null,
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🏈 Dynasty Evaluator API running on http://localhost:${PORT}`);
  console.log(`   GET  /api/rankings`);
  console.log(`   GET  /api/rankings?position=QB&limit=20`);
  console.log(`   GET  /api/player/:id`);
  console.log(`   POST /api/evaluate`);
  console.log(`   POST /api/rankings/refresh\n`);
});
