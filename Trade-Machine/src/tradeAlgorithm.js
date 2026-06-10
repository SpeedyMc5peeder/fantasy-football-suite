// src/tradeAlgorithm.js

// --- Core Math from Backend (formulas.js) ---
const AGE_THRESHOLDS = {
  QB:  { young: 24, prime: 28, old: 30 },
  RB:  { young: 23, prime: 26, old: 28 },
  WR:  { young: 24, prime: 27, old: 28 },
  TE:  { young: 24, prime: 27, old: 29 },
  RDP: { young: 0,  prime: 0,  old: 0 },
};

function applyTeamMode(value, position, age, mode) {
  if (mode === 'neutral') return value;
  const pos = position?.toUpperCase() || '';
  if (pos === 'RDP') {
    if (mode === 'contender') return Math.round(value * 0.80);
    if (mode === 'rebuilder') return Math.round(value * 1.20);
    return value;
  }
  const thresholds = AGE_THRESHOLDS[pos] || AGE_THRESHOLDS.WR;
  const playerAge = Number(age) || 25;
  if (mode === 'contender') {
    if (playerAge >= thresholds.old) return Math.round(value * 1.15);
    if (playerAge >= thresholds.prime) return Math.round(value * 1.10);
    if (playerAge < thresholds.young) return Math.round(value * 0.92);
    return value;
  }
  if (mode === 'rebuilder') {
    if (playerAge >= thresholds.old) return Math.round(value * 0.70);
    if (playerAge >= thresholds.prime) return Math.round(value * 0.80);
    if (playerAge < thresholds.young) return Math.round(value * 1.20);
    return value;
  }
  return value;
}

function studAdjust(playerValue, tradePeak, d = 0.5, k = 1.3) {
  const v = Number(playerValue) || 0;
  const t = Number(tradePeak) || 1;
  if (t <= 0) return v;
  const ratio = Math.min(v / t, 1);
  return Math.round(v * (d + (1 - d) * Math.pow(ratio, k)));
}

function adjustSide(values, tradePeak) {
  return values.reduce((sum, v) => sum + studAdjust(v, tradePeak), 0);
}

const ROSTER_SPOT_COST = 500;

function rosterTax(sideACount, sideBCount) {
  const diff = sideACount - sideBCount;
  if (diff > 0) return { taxA: diff * ROSTER_SPOT_COST, taxB: 0 };
  if (diff < 0) return { taxA: 0, taxB: Math.abs(diff) * ROSTER_SPOT_COST };
  return { taxA: 0, taxB: 0 };
}

function evaluateTrade({ sideAValues, sideBValues }) {
  const allValues = [...sideAValues, ...sideBValues];
  const tradePeak = Math.max(...allValues, 1);

  const sideAAdj = adjustSide(sideAValues, tradePeak);
  const sideBAdj = adjustSide(sideBValues, tradePeak);

  const tax = rosterTax(sideBValues.length, sideAValues.length);
  const finalA = Math.max(0, sideAAdj - tax.taxA);
  const finalB = Math.max(0, sideBAdj - tax.taxB);

  const ratio = finalB > 0 ? +(finalA / finalB).toFixed(2) : Infinity;
  return { finalA, finalB, ratio };
}

// --- Combinatorial Helpers ---
function getSubsets(array, maxLen) {
  const result = [];
  function backtrack(start, path) {
    if (path.length > 0 && path.length <= maxLen) {
      result.push([...path]);
    }
    if (path.length === maxLen) return;
    for (let i = start; i < array.length; i++) {
      path.push(array[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return result;
}

function filterDiverseTrades(trades) {
  const seenSignatures = new Set();
  const diverse = [];
  for (const t of trades) {
    // create a signature based on player IDs received
    const sig = t.assetsReceived.map(a => a.id).sort().join(',');
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      diverse.push(t);
    }
  }
  return diverse;
}

// --- Main Trade Finders ---

export function generateTwoWayTrades({ rosterData, userTeamId, userAssets, userMode = 'neutral', targetNeeds = [], maxResults = 5 }) {
  if (userAssets.length === 0) return [];
  
  const sideAValues = userAssets.map(a => applyTeamMode(a.composite_value, a.position, a.age, userMode));
  const results = [];
  
  for (const team of rosterData) {
    if (String(team.roster_id) === String(userTeamId)) continue;
    
    let validAssets = [];
    ['QB', 'RB', 'WR', 'TE', 'Picks'].forEach(pos => {
      // If targetNeeds specified, only allow those positions (unless it's empty, then all)
      if (targetNeeds.length > 0 && !targetNeeds.includes(pos)) return;
      
      (team.players[pos] || []).forEach(p => {
        // Optimization: ignore worthless players to keep permutations fast
        if (p.composite_value >= 600 || pos === 'Picks') {
          validAssets.push(p);
        }
      });
    });

    const subsets = getSubsets(validAssets, 3);
    
    for (const sub of subsets) {
       const sideBValues = sub.map(a => applyTeamMode(a.composite_value, a.position, a.age, 'neutral')); // Defaulting opponents to neutral for now
       const evalResult = evaluateTrade({ sideAValues, sideBValues });
       
       // Keep trades that are within 10% fairness
       if (evalResult.ratio >= 0.90 && evalResult.ratio <= 1.11) {
          results.push({
             type: '2-way',
             teamB_name: team.name,
             teamB_id: team.roster_id,
             assetsSent: userAssets,
             assetsReceived: sub,
             ratio: evalResult.ratio,
             diff: Math.abs(1 - evalResult.ratio)
          });
       }
    }
  }

  results.sort((a, b) => a.diff - b.diff);
  return filterDiverseTrades(results).slice(0, maxResults);
}

// 3-Way "Broker" Finder: User trades away Asset 1 to Team B, Asset 2 to Team C. 
// User receives Asset 3 from Team B, Asset 4 from Team C. 
// This algorithm restricts userAssets to exactly 2 items for performance.
export function generateThreeWayTrades({ rosterData, userTeamId, userAssets, userMode = 'neutral', targetNeeds = [], maxResults = 5 }) {
  if (userAssets.length < 2) return []; // Need at least 2 assets to split
  
  const asset1 = userAssets[0];
  const asset2 = userAssets[1];
  
  const val1 = applyTeamMode(asset1.composite_value, asset1.position, asset1.age, userMode);
  const val2 = applyTeamMode(asset2.composite_value, asset2.position, asset2.age, userMode);

  const results = [];
  const otherTeams = rosterData.filter(t => String(t.roster_id) !== String(userTeamId));

  // O(N^2) over teams
  for (let i = 0; i < otherTeams.length; i++) {
    for (let j = i + 1; j < otherTeams.length; j++) {
      const teamB = otherTeams[i];
      const teamC = otherTeams[j];

      const getValid = (team) => {
        let valid = [];
        ['QB', 'RB', 'WR', 'TE', 'Picks'].forEach(pos => {
          if (targetNeeds.length > 0 && !targetNeeds.includes(pos)) return;
          (team.players[pos] || []).forEach(p => {
            if (p.composite_value >= 800 || pos === 'Picks') valid.push(p);
          });
        });
        return valid;
      };

      const validB = getValid(teamB);
      const validC = getValid(teamC);

      const subB = getSubsets(validB, 2); // Max 2 assets received from B
      const subC = getSubsets(validC, 2); // Max 2 assets received from C

      for (const sb of subB) {
        // Quick prune: Does B's return roughly match Asset 1?
        const valsB = sb.map(a => applyTeamMode(a.composite_value, a.position, a.age, 'neutral'));
        const evalB = evaluateTrade({ sideAValues: [val1], sideBValues: valsB });
        if (evalB.ratio < 0.85 || evalB.ratio > 1.15) continue;

        for (const sc of subC) {
          // Quick prune: Does C's return roughly match Asset 2?
          const valsC = sc.map(a => applyTeamMode(a.composite_value, a.position, a.age, 'neutral'));
          const evalC = evaluateTrade({ sideAValues: [val2], sideBValues: valsC });
          if (evalC.ratio < 0.85 || evalC.ratio > 1.15) continue;

          // Full 3-way evaluation
          const userRecvVals = [...valsB, ...valsC];
          const userEval = evaluateTrade({ sideAValues: [val1, val2], sideBValues: userRecvVals });

          if (userEval.ratio >= 0.90 && userEval.ratio <= 1.11) {
             results.push({
               type: '3-way',
               teamB_name: teamB.name,
               teamB_id: teamB.roster_id,
               teamC_name: teamC.name,
               teamC_id: teamC.roster_id,
               assetsSentToB: [asset1],
               assetsSentToC: [asset2],
               assetsReceivedFromB: sb,
               assetsReceivedFromC: sc,
               ratio: userEval.ratio,
               diff: Math.abs(1 - userEval.ratio)
             });
          }
        }
      }
    }
  }

  results.sort((a, b) => a.diff - b.diff);
  
  const diverse = [];
  const seen = new Set();
  for (const t of results) {
    const sig = [...t.assetsReceivedFromB.map(a=>a.id), ...t.assetsReceivedFromC.map(a=>a.id)].sort().join(',');
    if (!seen.has(sig)) {
      seen.add(sig);
      diverse.push(t);
    }
  }

  return diverse.slice(0, maxResults);
}
