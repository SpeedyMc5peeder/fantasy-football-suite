/**
 * formulas.js — Dynasty Evaluator Core Mathematics
 *
 * Superflex · 0.5 PPR · No TE Premium
 *
 * Exports pure functions used by server.js for rankings and trade evaluation.
 */

// ─── 1. Composite Value Blending ─────────────────────────────────────────────

/**
 * Blend KTC crowdsourced value with Expert Consensus value.
 * @param {number} ktcValue  - KeepTradeCut value (0–9999)
 * @param {number} ecrValue  - Expert consensus value, normalized to 0–9999
 * @param {number} weight    - Market reactivity weight (0.0 = pure ECR, 1.0 = pure KTC, default 0.6)
 * @returns {number} Composite value rounded to nearest integer
 */
function compositeValue(ktcValue, ecrValue, weight = 0.6) {
  const ktc = Number(ktcValue) || 0;
  const ecr = Number(ecrValue) || 0;
  const w = Math.max(0, Math.min(1, weight));
  return Math.round(w * ktc + (1 - w) * ecr);
}

// ─── 2. Contender / Rebuilder Adjustments ────────────────────────────────────

/**
 * Position-specific age thresholds for value decay/boost.
 * "prime" = peak production years; "old" = decline territory.
 */
const AGE_THRESHOLDS = {
  QB:  { young: 24, prime: 28, old: 30 },
  RB:  { young: 23, prime: 26, old: 28 },
  WR:  { young: 24, prime: 27, old: 28 },
  TE:  { young: 24, prime: 27, old: 29 },
  RDP: { young: 0,  prime: 0,  old: 0 },   // Draft picks — handled separately
};

/**
 * Apply contender/rebuilder modifier to a composite value.
 * @param {number} value    - Composite value
 * @param {string} position - "QB", "RB", "WR", "TE", or "RDP"
 * @param {number} age      - Player age (0 for picks)
 * @param {"contender"|"rebuilder"|"neutral"} mode
 * @returns {number} Adjusted value
 */
function applyTeamMode(value, position, age, mode) {
  if (mode === 'neutral') return value;

  const pos = position?.toUpperCase() || '';

  // ── Draft picks ──
  if (pos === 'RDP') {
    if (mode === 'contender') return Math.round(value * 0.80);  // -20% discount for contenders
    if (mode === 'rebuilder') return Math.round(value * 1.20);  // +20% boost for rebuilders
    return value;
  }

  const thresholds = AGE_THRESHOLDS[pos] || AGE_THRESHOLDS.WR;
  const playerAge = Number(age) || 25;

  if (mode === 'contender') {
    // Contenders love proven veterans, penalize raw youth
    if (playerAge >= thresholds.old) return Math.round(value * 1.15);   // +15% veteran boost
    if (playerAge >= thresholds.prime) return Math.round(value * 1.10); // +10% prime boost
    if (playerAge < thresholds.young) return Math.round(value * 0.92); // -8% youth discount
    return value;
  }

  if (mode === 'rebuilder') {
    // Rebuilders love youth, dump aging vets
    if (playerAge >= thresholds.old) return Math.round(value * 0.70);   // -30% old vet tax
    if (playerAge >= thresholds.prime) return Math.round(value * 0.80); // -20% aging discount
    if (playerAge < thresholds.young) return Math.round(value * 1.20); // +20% youth premium
    return value;
  }

  return value;
}

// ─── 3. Stud Premium / Package Decay ─────────────────────────────────────────

/**
 * Calculate the adjusted value for a single player in a multi-player trade.
 *
 * Formula: v_adj = v * (d + (1-d) * (v/t)^k)
 *
 * @param {number} playerValue - This player's composite value
 * @param {number} tradePeak   - The highest-valued player in the entire trade
 * @param {number} d           - Base depth floor (default 0.5)
 * @param {number} k           - Decay exponent (default 1.3)
 * @returns {number} Package-adjusted value
 */
function studAdjust(playerValue, tradePeak, d = 0.5, k = 1.3) {
  const v = Number(playerValue) || 0;
  const t = Number(tradePeak) || 1;
  if (t <= 0) return v;
  const ratio = Math.min(v / t, 1);                    // cap at 1.0
  const adjusted = v * (d + (1 - d) * Math.pow(ratio, k));
  return Math.round(adjusted);
}

/**
 * Adjust an entire side of a trade (array of player values) using stud premium.
 * @param {number[]} values   - Array of composite values for one side
 * @param {number} tradePeak  - Highest value player across BOTH sides
 * @returns {number} Sum of package-adjusted values for this side
 */
function adjustSide(values, tradePeak) {
  return values.reduce((sum, v) => sum + studAdjust(v, tradePeak), 0);
}

// ─── 4. Roster Space Tax ─────────────────────────────────────────────────────

const ROSTER_SPOT_COST = 500;

/**
 * Calculate roster tax for a trade.
 * The side receiving MORE players must pay a penalty (they need to drop bench guys).
 * @param {number} sideACount - Number of assets Side A receives (i.e., Side B sends)
 * @param {number} sideBCount - Number of assets Side B receives (i.e., Side A sends)
 * @returns {{ taxA: number, taxB: number }} Tax to subtract from each side
 */
function rosterTax(sideACount, sideBCount) {
  const diff = sideACount - sideBCount;
  if (diff > 0) {
    // Side A receives more players → Side A pays tax
    return { taxA: diff * ROSTER_SPOT_COST, taxB: 0 };
  } else if (diff < 0) {
    // Side B receives more players → Side B pays tax
    return { taxA: 0, taxB: Math.abs(diff) * ROSTER_SPOT_COST };
  }
  return { taxA: 0, taxB: 0 };
}

// ─── 5. Full Trade Evaluation ────────────────────────────────────────────────

/**
 * Evaluate a complete trade between two sides.
 *
 * @param {object} params
 * @param {number[]} params.sideAValues - Composite values for Side A's assets
 * @param {number[]} params.sideBValues - Composite values for Side B's assets
 * @returns {object} Full evaluation result matching the API contract
 */
function evaluateTrade({ sideAValues, sideBValues }) {
  const allValues = [...sideAValues, ...sideBValues];
  const tradePeak = Math.max(...allValues, 1);

  const sideARaw = sideAValues.reduce((a, b) => a + b, 0);
  const sideBRaw = sideBValues.reduce((a, b) => a + b, 0);

  const sideAAdj = adjustSide(sideAValues, tradePeak);
  const sideBAdj = adjustSide(sideBValues, tradePeak);

  // Side A sends sideAValues to Side B; Side B receives sideAValues.length assets
  // Side B sends sideBValues to Side A; Side A receives sideBValues.length assets
  const tax = rosterTax(sideBValues.length, sideAValues.length);

  const finalA = Math.max(0, sideAAdj - tax.taxA);
  const finalB = Math.max(0, sideBAdj - tax.taxB);

  const ratio = finalB > 0 ? +(finalA / finalB).toFixed(2) : Infinity;
  const winner = finalA > finalB ? 'sideA' : finalA < finalB ? 'sideB' : 'even';

  let marginDescription;
  const absRatio = winner === 'sideA' ? ratio : winner === 'sideB' ? 1 / ratio : 1;
  if (absRatio >= 2.5)      marginDescription = 'Highway robbery. Someone call the commissioner.';
  else if (absRatio >= 1.8)  marginDescription = 'Clear win. One side is getting fleeced.';
  else if (absRatio >= 1.3)  marginDescription = 'Solid advantage. Not a steal, but definitely favorable.';
  else if (absRatio >= 1.1)  marginDescription = 'Slight edge. Close enough to be a fair deal.';
  else                       marginDescription = 'Dead even. Both sides should feel good.';

  return {
    sideA_raw_value: sideARaw,
    sideA_adjusted_value: sideAAdj,
    sideB_raw_value: sideBRaw,
    sideB_adjusted_value: sideBAdj,
    roster_tax_applied: tax.taxA + tax.taxB,
    final_sideA_total: finalA,
    final_sideB_total: finalB,
    fairness_ratio: ratio,
    winner,
    margin_description: marginDescription,
  };
}

// ─── 6. ECR Normalization ────────────────────────────────────────────────────

/**
 * Normalize a DynastyProcess ECR value (which uses its own scale) to our 0–9999 range.
 * DynastyProcess values typically range ~0–10500+.
 * @param {number} dpValue - Raw DynastyProcess value_2qb (for Superflex)
 * @param {number} maxDP   - The maximum value observed in the dataset
 * @returns {number} Normalized value on 0–9999 scale
 */
function normalizeECR(dpValue, maxDP) {
  const v = Number(dpValue) || 0;
  const max = Number(maxDP) || 10500;
  return Math.round((v / max) * 9999);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  compositeValue,
  applyTeamMode,
  studAdjust,
  adjustSide,
  rosterTax,
  evaluateTrade,
  normalizeECR,
  AGE_THRESHOLDS,
  ROSTER_SPOT_COST,
};
