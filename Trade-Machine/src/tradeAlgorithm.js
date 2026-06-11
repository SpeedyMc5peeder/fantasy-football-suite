// src/tradeAlgorithm.js

// --- Core Math from Backend (formulas.js) ---
const AGE_THRESHOLDS = {
  QB:  { young: 24, prime: 28, old: 30 },
  RB:  { young: 23, prime: 26, old: 28 },
  WR:  { young: 24, prime: 27, old: 28 },
  TE:  { young: 24, prime: 27, old: 29 },
  RDP: { young: 0,  prime: 0,  old: 0 },
};

export function applyTeamMode(value, position, age, mode) {
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

function filterDiverseTrades(trades, maxPerTeam = 2) {
  const seenSignatures = new Set();
  const byTeam = new Map(); // insertion order follows global fairness sort
  for (const t of trades) {
    // create a signature based on player IDs received
    const sig = t.assetsReceived.map(a => a.id).sort().join(',');
    if (seenSignatures.has(sig)) continue;
    seenSignatures.add(sig);
    const teamKey = String(t.teamB_id);
    if (!byTeam.has(teamKey)) byTeam.set(teamKey, []);
    const arr = byTeam.get(teamKey);
    if (arr.length < maxPerTeam) arr.push(t);
  }
  // Round-robin across teams: every opponent's best offer surfaces before any
  // team's second offer, so one stacked roster can't dominate the list
  const diverse = [];
  for (let round = 0; round < maxPerTeam; round++) {
    for (const arr of byTeam.values()) {
      if (arr[round]) diverse.push(arr[round]);
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

// 3-Way Finder: splits the user's trade block every possible way across every pair of
// opponent teams and tries every package coming back. When the two legs don't balance on
// their own, it searches the winning opponent's roster for a single "broker" asset to send
// to the losing opponent that closes the triangle — the move real 3-way trades are made of.
export function generateThreeWayTrades({ rosterData, userTeamId, userAssets, userMode = 'neutral', targetNeeds = [], maxResults = 5 }) {
  if (userAssets.length < 1) return []; // One asset is enough — the broker leg routes value to the team you don't send to

  // Cap the block at the 4 most valuable assets to keep the search fast
  const block = [...userAssets].sort((a, b) => (b.composite_value || 0) - (a.composite_value || 0)).slice(0, 4);
  const blockVals = block.map(a => applyTeamMode(a.composite_value, a.position, a.age, userMode));
  const n = block.length;

  // Tolerance for an opponent's final net scales with the size of their leg (10%, floor 400)
  const netTol = (legVolume) => Math.max(400, legVolume * 0.10);
  const LEG_SLACK = 2200; // max pre-broker leg imbalance worth trying to fix

  const results = [];
  const otherTeams = rosterData.filter(t => String(t.roster_id) !== String(userTeamId));

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

  // Broker candidates aren't restricted by the user's target needs — they flow between opponents
  const getAllAssets = (team) => {
    let all = [];
    ['QB', 'RB', 'WR', 'TE', 'Picks'].forEach(pos => {
      (team.players[pos] || []).forEach(p => { if ((p.composite_value || 0) > 0) all.push(p); });
    });
    return all;
  };

  // Every split of the block between B and C — including one-sided splits where
  // everything goes to one team and the broker leg compensates the other
  const partitions = [];
  for (let mask = 0; mask <= (1 << n) - 1; mask++) {
    const toB = [], toC = [];
    let valB = 0, valC = 0;
    for (let k = 0; k < n; k++) {
      if (mask & (1 << k)) { toB.push(block[k]); valB += blockVals[k]; }
      else { toC.push(block[k]); valC += blockVals[k]; }
    }
    partitions.push({ toB, toC, valB, valC });
  }

  // Subsets sorted ascending by value so the inner loops can window instead of cross-product
  const subsetsWithVals = (valid) => getSubsets(valid, 2).map(sub => ({
    sub,
    val: sub.reduce((s, a) => s + applyTeamMode(a.composite_value, a.position, a.age, 'neutral'), 0)
  })).sort((a, b) => a.val - b.val);

  // First index in a val-sorted array with val >= x
  const lowerBound = (arr, x) => {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid].val < x) lo = mid + 1; else hi = mid; }
    return lo;
  };

  // Closest-value asset to `needed` in a value-sorted roster, skipping assets already in the trade
  const nearestAsset = (sorted, needed, exclude) => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid].composite_value < needed) lo = mid + 1; else hi = mid; }
    let best = null, bestErr = Infinity;
    for (let k = lo - 5; k <= lo + 5; k++) {
      if (k < 0 || k >= sorted.length) continue;
      const a = sorted[k];
      if (exclude.indexOf(a.id) !== -1) continue;
      const err = Math.abs(a.composite_value - needed);
      if (err < bestErr) { bestErr = err; best = a; }
    }
    return best;
  };

  for (let i = 0; i < otherTeams.length; i++) {
    for (let j = i + 1; j < otherTeams.length; j++) {
      const teamB = otherTeams[i];
      const teamC = otherTeams[j];
      const subB = subsetsWithVals(getValid(teamB));
      const subC = subsetsWithVals(getValid(teamC));
      const allB = getAllAssets(teamB).sort((a, b) => a.composite_value - b.composite_value);
      const allC = getAllAssets(teamC).sort((a, b) => a.composite_value - b.composite_value);

      // Plenty of candidates per pair for the top-5 cut; stops runaway evaluation on deep rosters
      const PAIR_CAP = 500;
      let pairCount = 0;

      partSearch:
      for (const part of partitions) {
        const sentVal = part.valB + part.valC;
        const biStart = lowerBound(subB, part.valB - LEG_SLACK);
        for (let bi = biStart; bi < subB.length && subB[bi].val <= part.valB + LEG_SLACK; bi++) {
          const sb = subB[bi];
          const preNetB = part.valB - sb.val; // B's net: received from user minus sent to user

          // sc value window: leg slack ∩ raw user-fairness band (sent/recv between 0.80 and 1.30)
          const scLo = Math.max(part.valC - LEG_SLACK, sentVal / 1.30 - sb.val);
          const scHi = Math.min(part.valC + LEG_SLACK, sentVal / 0.80 - sb.val);
          if (scHi < scLo) continue;

          for (let ci = lowerBound(subC, scLo); ci < subC.length && subC[ci].val <= scHi; ci++) {
            const sc = subC[ci];
            const preNetC = part.valC - sc.val;

            // Close the triangle if the opponents' nets don't already balance
            const tolB = netTol(Math.max(part.valB, sb.val));
            const tolC = netTol(Math.max(part.valC, sc.val));
            let broker = null;
            if (Math.abs(preNetB) > tolB || Math.abs(preNetC) > tolC) {
              // Single transfer from the higher-net opponent to the lower; the final-net
              // check below rejects anything one asset can't fix
              const donorIsB = preNetB > preNetC;
              const needed = Math.abs(preNetB - preNetC) / 2;
              if (needed < 100) continue; // nets are nearly equal but out of tolerance — unfixable

              const exclude = [...sb.sub, ...sc.sub].map(a => a.id);
              const best = nearestAsset(donorIsB ? allB : allC, needed, exclude);
              if (!best) continue;
              const x = best.composite_value;
              const netB = donorIsB ? preNetB - x : preNetB + x;
              const netC = donorIsB ? preNetC + x : preNetC - x;
              if (Math.abs(netB) > tolB || Math.abs(netC) > tolC) continue;
              broker = donorIsB
                ? { asset: best, fromId: teamB.roster_id, fromName: teamB.name, toId: teamC.roster_id, toName: teamC.name }
                : { asset: best, fromId: teamC.roster_id, fromName: teamC.name, toId: teamB.roster_id, toName: teamB.name };
            }

            // A team that receives nothing from the user must at least get the broker
            // asset — nobody sends players away for literally nothing in return
            if (part.toB.length === 0 && (!broker || String(broker.toId) !== String(teamB.roster_id))) continue;
            if (part.toC.length === 0 && (!broker || String(broker.toId) !== String(teamC.roster_id))) continue;

            // Full user-side evaluation (stud premium + roster tax)
            const sideAValues = [...part.toB, ...part.toC].map(a => applyTeamMode(a.composite_value, a.position, a.age, userMode));
            const sideBValues = [...sb.sub, ...sc.sub].map(a => applyTeamMode(a.composite_value, a.position, a.age, 'neutral'));
            const userEval = evaluateTrade({ sideAValues, sideBValues });
            if (userEval.ratio < 0.90 || userEval.ratio > 1.11) continue;

            results.push({
              type: '3-way',
              teamB_name: teamB.name,
              teamB_id: teamB.roster_id,
              teamC_name: teamC.name,
              teamC_id: teamC.roster_id,
              assetsSentToB: part.toB,
              assetsSentToC: part.toC,
              assetsReceivedFromB: sb.sub,
              assetsReceivedFromC: sc.sub,
              broker,
              ratio: userEval.ratio,
              diff: Math.abs(1 - userEval.ratio)
            });
            if (++pairCount >= PAIR_CAP) break partSearch;
          }
        }
      }
    }
  }

  results.sort((a, b) => a.diff - b.diff);

  // Dedupe by what the user receives (+ broker asset). Cap each TEAM's total
  // appearances across all pairs — capping only per-pair let one deep roster
  // ride in every result through different partners.
  const diverse = [];
  const seen = new Set();
  const teamCounts = {};
  const MAX_PER_TEAM = 2;
  for (const t of results) {
    const sig = [
      ...t.assetsReceivedFromB.map(a => a.id),
      ...t.assetsReceivedFromC.map(a => a.id),
      t.broker ? `bk:${t.broker.asset.id}` : ''
    ].sort().join(',');
    if (seen.has(sig)) continue;
    const bKey = String(t.teamB_id);
    const cKey = String(t.teamC_id);
    if ((teamCounts[bKey] || 0) >= MAX_PER_TEAM || (teamCounts[cKey] || 0) >= MAX_PER_TEAM) continue;
    seen.add(sig);
    teamCounts[bKey] = (teamCounts[bKey] || 0) + 1;
    teamCounts[cKey] = (teamCounts[cKey] || 0) + 1;
    diverse.push(t);
    if (diverse.length >= maxResults) break;
  }

  return diverse.slice(0, maxResults);
}

// Inverse "Trade For" Finder: User selects a position they want (e.g., WR), 
// and the algorithm finds the best WRs on opponent teams and builds packages from the user's roster to buy them.
export function generateInverseTrades({ rosterData, userTeamId, targetNeeds = [], userMode = 'neutral', minTargetValue = 0, maxTargetValue = Infinity, maxResults = 5 }) {
  if (targetNeeds.length === 0) return []; // Must specify something to buy

  const results = [];
  const userTeam = rosterData.find(t => String(t.roster_id) === String(userTeamId));
  if (!userTeam) return [];

  // Flatten user's roster to build packages from.
  // Low floor (250) so depth-for-depth swaps are possible when hunting cheap targets.
  let validUserAssets = [];
  ['QB', 'RB', 'WR', 'TE', 'Picks'].forEach(pos => {
    (userTeam.players[pos] || []).forEach(p => {
      if (p.composite_value >= 250 || pos === 'Picks') {
        validUserAssets.push(p);
      }
    });
  });

  const userSubsets = getSubsets(validUserAssets, 2); // Max 2 for performance/realism

  for (const team of rosterData) {
    if (String(team.roster_id) === String(userTeamId)) continue;

    // Find opponent assets that match the target needs and clear the value floor
    let targetOpponentAssets = [];
    ['QB', 'RB', 'WR', 'TE', 'Picks'].forEach(pos => {
      if (!targetNeeds.includes(pos)) return;
      (team.players[pos] || []).forEach(p => {
        const v = p.composite_value || 0;
        if (v > 0 && v >= minTargetValue && v < maxTargetValue) {
          targetOpponentAssets.push({ ...p, mode: 'neutral' });
        }
      });
    });

    for (const targetAsset of targetOpponentAssets) {
      const sideBValues = [applyTeamMode(targetAsset.composite_value, targetAsset.position, targetAsset.age, 'neutral')];
      
      for (const sub of userSubsets) {
         // Do not package a player of the exact same position unless it's a pick
         if (sub.some(a => a.position === targetAsset.position && a.position !== 'RDP')) continue;

         const sideAValues = sub.map(a => applyTeamMode(a.composite_value, a.position, a.age, userMode));
         const evalResult = evaluateTrade({ sideAValues, sideBValues });
         
         if (evalResult.ratio >= 0.90 && evalResult.ratio <= 1.11) {
            results.push({
               type: '2-way',
               teamB_name: team.name,
               teamB_id: team.roster_id,
               assetsSent: sub,
               assetsReceived: [targetAsset],
               ratio: evalResult.ratio,
               diff: Math.abs(1 - evalResult.ratio)
            });
         }
      }
    }
  }

  // Sort by fairness, then by target value so the best player wins among equally fair offers
  results.sort((a, b) => a.diff - b.diff || (b.assetsReceived[0]?.composite_value || 0) - (a.assetsReceived[0]?.composite_value || 0));
  return filterDiverseTrades(results).slice(0, maxResults);
}
