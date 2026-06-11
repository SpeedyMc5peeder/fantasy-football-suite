/**
 * scraper.js — Dynasty Evaluator Data Sync Engine
 *
 * 1. Fetches KeepTradeCut dynasty rankings HTML and extracts the embedded
 *    `var playersArray = [...]` JSON block (Superflex values).
 * 2. Fetches DynastyProcess values.csv for Expert Consensus Rankings.
 * 3. Fetches DynastyProcess db_playerids.csv for cross-platform ID mapping.
 * 4. Merges the datasets and writes `/data/rankings.json`.
 *
 * Run standalone:  node src/scraper.js
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { compositeValue, normalizeECR, applyTeamMode } from '../api/formulas.js';

// ─── Configuration ───────────────────────────────────────────────────────────

const KTC_URL = 'https://keeptradecut.com/dynasty-rankings';
const KTC_REDRAFT_URL = 'https://keeptradecut.com/fantasy-rankings';
const FC_REDRAFT_URL = 'https://api.fantasycalc.com/values/current?isDynasty=false&numQbs=2&numTeams=12&ppr=0.5';
const DP_VALUES_URL = 'https://raw.githubusercontent.com/dynastyprocess/data/master/files/values.csv';
const DP_IDS_URL = 'https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv';
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'rankings.json');
const REDRAFT_OUTPUT_FILE = path.join(DATA_DIR, 'rankings_redraft.json');

// Read config weight from root config.json if available
let marketWeight = 0.6;
try {
  const rootConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'config.json'), 'utf8'));
  if (rootConfig.market_weight != null) marketWeight = rootConfig.market_weight;
} catch (_) { /* use default */ }

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

// ─── 1. Parse KTC ────────────────────────────────────────────────────────────

async function scrapeKTC() {
  console.log('📡 Fetching KeepTradeCut rankings...');
  const html = await fetchText(KTC_URL);

  // The entire player database is embedded as: var playersArray = [ {...}, {...}, ... ];
  const match = html.match(/var\s+playersArray\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not find playersArray in KTC HTML');

  const players = JSON.parse(match[1]);
  console.log(`   ✅ Parsed ${players.length} players/picks from KTC`);

  // Map to a cleaner structure using Superflex values (no TE premium)
  return players.map(p => {
    const sf = p.superflexValues || {};
    return {
      ktc_id: p.playerID,
      name: p.playerName,
      position: p.position,
      team: p.team,
      age: p.age || 0,
      rookie: p.rookie || false,
      ktc_value: sf.value || 0,
      ktc_rank: sf.rank || 9999,
      ktc_positional_rank: sf.positionalRank || 9999,
      ktc_tier: sf.overallTier || 99,
      ktc_trend: sf.overallTrend || 0,
      ktc_7day_trend: sf.overall7DayTrend || 0,
      slug: p.slug || '',
      college: p.college || '',
      draft_year: p.draftYear || 0,
      injury: p.injury || {},
      mfl_id: p.mflid || 0,
    };
  });
}

// ─── 1b. Parse KTC Redraft (fantasy-rankings) ────────────────────────────────

async function scrapeKTCRedraft() {
  console.log('📡 Fetching KeepTradeCut REDRAFT rankings...');
  const html = await fetchText(KTC_REDRAFT_URL);

  const match = html.match(/var\s+playersArray\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not find playersArray in KTC redraft HTML');

  const players = JSON.parse(match[1]);
  console.log(`   ✅ Parsed ${players.length} players from KTC redraft`);

  return players
    .filter(p => p.position !== 'RDP') // no draft picks in redraft
    .map(p => {
      const sf = p.superflexValues || {};
      return {
        ktc_id: p.playerID,
        name: p.playerName,
        position: p.position,
        team: p.team,
        age: p.age || 0,
        rookie: p.rookie || false,
        ktc_value: sf.value || 0,
        ktc_rank: sf.rank || 9999,
        ktc_positional_rank: sf.positionalRank || 9999,
        ktc_tier: sf.overallTier || 99,
        ktc_trend: sf.overallTrend || 0,
        ktc_7day_trend: sf.overall7DayTrend || 0,
        slug: p.slug || '',
        college: p.college || '',
        draft_year: p.draftYear || 0,
        injury: p.injury || {},
        mfl_id: p.mflid || 0,
      };
    });
}

// ─── 1c. FantasyCalc Redraft Values (public API) ─────────────────────────────

async function fetchFantasyCalcRedraft() {
  console.log('📡 Fetching FantasyCalc redraft values...');
  const res = await fetch(FC_REDRAFT_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`Failed to fetch FantasyCalc: ${res.status}`);
  const items = await res.json();
  console.log(`   ✅ Parsed ${items.length} FantasyCalc redraft entries`);

  const maxVal = Math.max(...items.map(i => Number(i.value) || 0), 1);
  const bySleeperId = {};
  const byName = {};
  for (const i of items) {
    const norm = Math.round(((Number(i.value) || 0) / maxVal) * 9999);
    if (i.player?.sleeperId) bySleeperId[String(i.player.sleeperId)] = norm;
    const key = (i.player?.name || '').toLowerCase().trim();
    if (key) byName[key] = norm;
  }
  return { bySleeperId, byName };
}

// ─── 2. Parse DynastyProcess Values CSV ──────────────────────────────────────

async function fetchDPValues() {
  console.log('📡 Fetching DynastyProcess expert values...');
  const csv = await fetchText(DP_VALUES_URL);
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  console.log(`   ✅ Parsed ${records.length} expert value entries`);

  // Find the maximum 2QB value for normalization
  const maxVal = Math.max(...records.map(r => Number(r.value_2qb) || 0), 1);

  // Build a lookup by player name (lowercased, trimmed)
  const lookup = {};
  for (const r of records) {
    const key = (r.player || '').toLowerCase().trim();
    if (!key) continue;
    lookup[key] = {
      ecr_raw: Number(r.value_2qb) || 0,
      ecr_rank_2qb: Number(r.ecr_2qb) || 999,
      ecr_pos_rank: Number(r.ecr_pos) || 999,
      fp_id: r.fp_id || '',
    };
  }
  return { lookup, maxVal };
}

// ─── 3. Parse DynastyProcess Player IDs CSV ──────────────────────────────────

async function fetchDPIds() {
  console.log('📡 Fetching DynastyProcess player ID mappings...');
  const csv = await fetchText(DP_IDS_URL);
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  console.log(`   ✅ Parsed ${records.length} player ID mappings`);

  // Build a lookup by KTC ID → sleeper_id
  const byKtcId = {};
  const byName = {};
  for (const r of records) {
    const ktcId = Number(r.ktc_id) || 0;
    const sId = (r.sleeper_id && r.sleeper_id !== 'NA') ? r.sleeper_id : '';
    if (ktcId > 0) {
      byKtcId[ktcId] = {
        sleeper_id: sId,
        mfl_id: r.mfl_id || '',
        fp_id: r.fantasypros_id || '',
      };
    }
    const key = (r.name || '').toLowerCase().trim();
    if (key) {
      byName[key] = {
        sleeper_id: sId,
        mfl_id: r.mfl_id || '',
        fp_id: r.fantasypros_id || '',
      };
    }
  }
  return { byKtcId, byName };
}

// ─── 4. Merge & Build Unified Rankings ───────────────────────────────────────

async function buildRankings() {
  const [ktcPlayers, dpValues, dpIds] = await Promise.all([
    scrapeKTC(),
    fetchDPValues(),
    fetchDPIds(),
  ]);

  const { lookup: ecrLookup, maxVal: ecrMax } = dpValues;
  const { byKtcId, byName } = dpIds;

  const rankings = ktcPlayers.map(player => {
    // Try to find ECR value by name match
    const nameKey = player.name.toLowerCase().trim();
    const ecr = ecrLookup[nameKey] || {};
    const ecrNormalized = ecr.ecr_raw ? normalizeECR(ecr.ecr_raw, ecrMax) : player.ktc_value;

    // Try to find Sleeper ID
    const idMap = byKtcId[player.ktc_id] || byName[nameKey] || {};

    // Composite blend
    const comp = compositeValue(player.ktc_value, ecrNormalized, marketWeight);

    // Contender / Rebuilder adjusted values
    const contenderVal = applyTeamMode(comp, player.position, player.age, 'contender');
    const rebuilderVal = applyTeamMode(comp, player.position, player.age, 'rebuilder');

    return {
      id: idMap.sleeper_id || String(player.ktc_id),
      ktc_id: player.ktc_id,
      sleeper_id: idMap.sleeper_id || '',
      name: player.name,
      position: player.position,
      team: player.team,
      age: player.age,
      rookie: player.rookie,
      college: player.college,
      draft_year: player.draft_year,
      injury: player.injury,
      slug: player.slug,

      // Values
      ktc_value: player.ktc_value,
      ecr_value: ecrNormalized,
      composite_value: comp,
      contender_value: contenderVal,
      rebuilder_value: rebuilderVal,

      // Rankings
      ktc_rank: player.ktc_rank,
      ktc_positional_rank: player.ktc_positional_rank,
      ktc_tier: player.ktc_tier,

      // Trends
      ktc_trend: player.ktc_trend,
      ktc_7day_trend: player.ktc_7day_trend,
    };
  });

  // Sort by composite value descending
  rankings.sort((a, b) => b.composite_value - a.composite_value);

  // Assign composite ranks
  rankings.forEach((p, i) => {
    p.composite_rank = i + 1;
  });

  return rankings;
}

// ─── 4b. Merge & Build Redraft Rankings ──────────────────────────────────────

async function buildRedraftRankings() {
  const [ktcPlayers, fc, dpIds] = await Promise.all([
    scrapeKTCRedraft(),
    fetchFantasyCalcRedraft(),
    fetchDPIds(),
  ]);

  const { byKtcId, byName } = dpIds;

  const rankings = ktcPlayers.map(player => {
    const nameKey = player.name.toLowerCase().trim();
    const idMap = byKtcId[player.ktc_id] || byName[nameKey] || {};
    const sleeperId = idMap.sleeper_id || '';

    // FantasyCalc value matched by sleeper ID first, then name; falls back to KTC alone
    const fcNorm = fc.bySleeperId[sleeperId] ?? fc.byName[nameKey] ?? player.ktc_value;

    const comp = compositeValue(player.ktc_value, fcNorm, marketWeight);

    return {
      id: sleeperId || String(player.ktc_id),
      ktc_id: player.ktc_id,
      sleeper_id: sleeperId,
      name: player.name,
      position: player.position,
      team: player.team,
      age: player.age,
      rookie: player.rookie,
      college: player.college,
      draft_year: player.draft_year,
      injury: player.injury,
      slug: player.slug,

      // Values (ecr_value carries the FantasyCalc blend partner in redraft mode)
      ktc_value: player.ktc_value,
      ecr_value: fcNorm,
      composite_value: comp,
      contender_value: comp,
      rebuilder_value: comp,

      // Rankings
      ktc_rank: player.ktc_rank,
      ktc_positional_rank: player.ktc_positional_rank,
      ktc_tier: player.ktc_tier,

      // Trends
      ktc_trend: player.ktc_trend,
      ktc_7day_trend: player.ktc_7day_trend,
    };
  });

  rankings.sort((a, b) => b.composite_value - a.composite_value);
  rankings.forEach((p, i) => { p.composite_rank = i + 1; });

  return rankings;
}

// ─── 5. Write Output ─────────────────────────────────────────────────────────

async function run() {
  try {
    console.log('\n🏈 Dynasty Evaluator — Data Sync\n');

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const rankings = await buildRankings();

    const output = {
      meta: {
        scraped_at: new Date().toISOString(),
        ktc_source: KTC_URL,
        ecr_source: DP_VALUES_URL,
        market_weight: marketWeight,
        total_players: rankings.length,
        format: 'Superflex · 0.5 PPR · No TE Premium',
      },
      rankings,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n💾 Wrote ${rankings.length} player rankings to ${OUTPUT_FILE}`);
    console.log(`   Top 10:`);
    rankings.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.position} - ${p.team}) — Composite: ${p.composite_value} | KTC: ${p.ktc_value} | ECR: ${p.ecr_value}`);
    });

    // Redraft rankings (KTC redraft + FantasyCalc blend)
    const redraftRankings = await buildRedraftRankings();
    const redraftOutput = {
      meta: {
        scraped_at: new Date().toISOString(),
        ktc_source: KTC_REDRAFT_URL,
        ecr_source: FC_REDRAFT_URL,
        market_weight: marketWeight,
        total_players: redraftRankings.length,
        format: 'Redraft · Superflex · 0.5 PPR · No TE Premium',
      },
      rankings: redraftRankings,
    };

    fs.writeFileSync(REDRAFT_OUTPUT_FILE, JSON.stringify(redraftOutput, null, 2));
    console.log(`\n💾 Wrote ${redraftRankings.length} REDRAFT rankings to ${REDRAFT_OUTPUT_FILE}`);
    console.log(`   Top 5 redraft:`);
    redraftRankings.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.position} - ${p.team}) — Composite: ${p.composite_value} | KTC: ${p.ktc_value} | FC: ${p.ecr_value}`);
    });

    console.log('\n✅ Sync complete.\n');
    return output;
  } catch (err) {
    console.error('❌ Scraper failed:', err.message);
    throw err;
  }
}

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}

export { run, buildRankings, buildRedraftRankings, scrapeKTC, scrapeKTCRedraft, fetchFantasyCalcRedraft, fetchDPValues, fetchDPIds };
