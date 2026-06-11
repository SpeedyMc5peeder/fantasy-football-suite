import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { evaluateTrade, applyTeamMode, compositeValue } from './formulas.js';

const app = express();
app.use(cors());
app.use(express.json());

import { fileURLToPath } from 'url';

const DATA_FILE = fileURLToPath(new URL('../data/rankings.json', import.meta.url));
const REDRAFT_DATA_FILE = fileURLToPath(new URL('../data/rankings_redraft.json', import.meta.url));

let rankingsData = null;
let redraftData = null;

function loadRankings() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      rankingsData = JSON.parse(raw);
    }
    if (fs.existsSync(REDRAFT_DATA_FILE)) {
      const raw = fs.readFileSync(REDRAFT_DATA_FILE, 'utf8');
      redraftData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('❌ Failed to load rankings:', err.message);
  }
}

// Load it immediately when cold start happens
loadRankings();

function findPlayer(query, dataset = rankingsData) {
  if (!dataset) return null;
  const q = String(query).toLowerCase().trim();
  const found = dataset.rankings.find(p =>
    p.id === query ||
    String(p.ktc_id) === q ||
    p.sleeper_id === query ||
    p.name.toLowerCase() === q ||
    p.slug === q
  );
  if (found) return found;

  if (q.startsWith('mock_')) {
    const parts = q.split('_'); // e.g. mock_2029_1st
    if (parts.length >= 3) {
      const rStr = parts[2];
      const round = rStr.startsWith('1') ? 1 : rStr.startsWith('2') ? 2 : rStr.startsWith('3') ? 3 : 4;
      const baseVals = { 1: 3000, 2: 1000, 3: 300, 4: 100 };
      return {
        id: query,
        name: query,
        position: 'RDP',
        composite_value: baseVals[round] || 100
      };
    }
  }
  return null;
}

// --- API ENDPOINTS ---

app.get('/api/rankings', (req, res) => {
  const data = req.query.format === 'redraft' ? redraftData : rankingsData;
  if (!data) return res.status(503).json({ error: 'Rankings not loaded.' });
  res.json(data.rankings);
});

app.post('/api/evaluate', (req, res) => {
  const { sideA, sideB, settings } = req.body;
  const dataset = settings?.format === 'redraft' ? redraftData : rankingsData;
  if (!dataset) return res.status(503).json({ error: 'Rankings not loaded.' });

  if (!sideA || !sideB) return res.status(400).json({ error: 'Both sideA and sideB are required.' });

  const modeA = settings?.team_1_mode || 'neutral';
  const modeB = settings?.team_2_mode || 'neutral';

  const resolveAssets = (assetIds, mode) => {
    return assetIds.map(id => {
      const player = findPlayer(id, dataset);
      if (!player) return { id, name: id, value: 0, found: false };
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

  const resolvedA = resolveAssets([...(sideA.players || []), ...(sideA.picks || [])], modeA);
  const resolvedB = resolveAssets([...(sideB.players || []), ...(sideB.picks || [])], modeB);

  const sideAValues = resolvedA.map(a => a.adjusted_value || a.value || 0);
  const sideBValues = resolvedB.map(b => b.adjusted_value || b.value || 0);

  const result = evaluateTrade({ sideAValues, sideBValues });

  res.json({ ...result, sideA_details: resolvedA, sideB_details: resolvedB });
});

// For local testing (Vercel ignores this if exported)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API running locally on port ${PORT}`));
}

export default app;
