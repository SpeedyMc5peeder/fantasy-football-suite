/**
 * evaluator.js — Native Dynasty Evaluator Integration
 *
 * Exposes a local evaluate(payload) function that performs the same math
 * as the standalone Dynasty-Evaluator server API.
 */

const fs = require('fs');
const path = require('path');
const { evaluateTrade, applyTeamMode } = require('./formulas');

let rankingsData = null;

function loadRankings() {
  if (rankingsData) return;
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'rankings.json');
    if (fs.existsSync(dataPath)) {
      rankingsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`✅ Evaluator Engine: Loaded ${rankingsData.rankings.length} players locally.`);
    } else {
      console.warn(`⚠️ Evaluator Engine: rankings.json not found! Trades will be evaluated with 0 value.`);
    }
  } catch (e) {
    console.error('Error loading rankings.json', e);
  }
}

function findPlayer(query) {
  if (!rankingsData || !rankingsData.rankings) return null;
  const q = String(query).toLowerCase().trim();
  const found = rankingsData.rankings.find(p =>
    p.id === query ||
    String(p.ktc_id) === q ||
    p.sleeper_id === query ||
    p.name.toLowerCase() === q ||
    p.slug === q
  );
  if (found) return found;

  // Mock draft picks (e.g. 2027 Mid 1st => mock_2027_1st internally by evaluate? No, sleeper client uses "2027 Mid 1st")
  // Let's support the naming convention that JARVIS index.js generates ("2027 Mid 1st")
  if (q.includes(' mid ') || q.includes(' early ') || q.includes(' late ')) {
    let round = 4;
    if (q.includes('1st')) round = 1;
    else if (q.includes('2nd')) round = 2;
    else if (q.includes('3rd')) round = 3;

    const baseVals = { 1: 3000, 2: 1000, 3: 300, 4: 100 };
    return {
      id: query,
      name: query,
      position: 'RDP',
      composite_value: baseVals[round] || 100
    };
  }
  
  return null;
}

/**
 * Native trade evaluation function replacing the external REST API call.
 * 
 * @param {Object} payload 
 * {
 *   sideA: { players: [], picks: [] },
 *   sideB: { players: [], picks: [] },
 *   settings: { team_1_mode: 'neutral', team_2_mode: 'neutral' }
 * }
 */
function evaluate(payload) {
  loadRankings();

  const { sideA, sideB, settings } = payload;
  const modeA = settings?.team_1_mode || 'neutral';
  const modeB = settings?.team_2_mode || 'neutral';

  const sideAAssets = [
    ...(sideA.players || []),
    ...(sideA.picks || []),
  ];
  const sideBAssets = [
    ...(sideB.players || []),
    ...(sideB.picks || []),
  ];

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

  return {
    ...result,
    sideA_details: resolvedA,
    sideB_details: resolvedB,
  };
}

module.exports = {
  evaluate
};
