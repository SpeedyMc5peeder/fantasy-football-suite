/**
 * sleeperClient.js — Sleeper API Client Wrapper
 *
 * Implements fetching league metadata, rosters, users, matchups, and transactions.
 * Manages a local cache of the complete Sleeper NFL player database to resolve names and
 * details for players (especially IDPs and deep bench players not in the KTC dataset).
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
const PLAYERS_CACHE_FILE = path.join(__dirname, '..', 'data', 'sleeper_players.json');

// Memory cache for user/roster data to avoid redundant API requests during a run
let rostersCache = null;
let usersCache = null;
let sleeperPlayersMap = null;

/**
 * Ensures the data directory exists and returns the local Sleeper player map.
 * Downloads the full database from Sleeper if not cached or if it's older than 7 days.
 */
async function loadSleeperPlayers() {
  if (sleeperPlayersMap) return sleeperPlayersMap;

  const cacheDir = path.dirname(PLAYERS_CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  let shouldDownload = true;
  if (fs.existsSync(PLAYERS_CACHE_FILE)) {
    const stats = fs.statSync(PLAYERS_CACHE_FILE);
    const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) {
      shouldDownload = false;
      try {
        console.log('📂 Loading Sleeper player database from cache...');
        const raw = fs.readFileSync(PLAYERS_CACHE_FILE, 'utf8');
        sleeperPlayersMap = JSON.parse(raw);
        console.log(`   ✅ Loaded ${Object.keys(sleeperPlayersMap).length} players from cache.`);
      } catch (err) {
        console.error('❌ Failed to read player cache file. Re-downloading...', err.message);
        shouldDownload = true;
      }
    }
  }

  if (shouldDownload) {
    console.log('📡 Fetching complete player database from Sleeper API (this takes a few seconds, ~30MB)...');
    try {
      const response = await axios.get(`${SLEEPER_BASE_URL}/players/nfl`);
      sleeperPlayersMap = response.data;
      fs.writeFileSync(PLAYERS_CACHE_FILE, JSON.stringify(sleeperPlayersMap, null, 2));
      console.log(`   ✅ Downloaded and cached ${Object.keys(sleeperPlayersMap).length} players.`);
    } catch (err) {
      console.error('❌ Failed to download player database from Sleeper:', err.message);
      // Fallback: return empty map if download fails so script doesn't crash
      sleeperPlayersMap = {};
    }
  }

  return sleeperPlayersMap;
}

/**
 * Resolve a player ID to a clean name, position, and team.
 */
async function resolvePlayer(playerId) {
  const players = await loadSleeperPlayers();
  const player = players[playerId];
  if (!player) {
    return {
      id: playerId,
      name: `Unknown Player (${playerId})`,
      position: 'UNKNOWN',
      team: 'N/A',
      age: 0
    };
  }

  // Handle defense/IDP positions
  let name = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim();
  if (!name) name = `Player ${playerId}`;

  return {
    id: playerId,
    name,
    position: player.position || 'UNKNOWN',
    team: player.team || 'FA',
    age: player.age || 0,
    years_exp: player.years_exp || 0
  };
}

/**
 * Resolve a player by their full name (used for matching news headlines).
 * Returns the resolved player object or null if not found.
 */
async function resolvePlayerByName(playerName) {
  const players = await loadSleeperPlayers();
  
  const cleanName = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z ]/g, '')
      .replace(/\s+(jr|sr|ii|iii|iv)$/g, '')
      .trim();
  };
  
  const searchName = cleanName(playerName);
  
  for (const [id, player] of Object.entries(players)) {
    const pName = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`;
    if (cleanName(pName) === searchName && player.status !== 'Inactive') {
      return await resolvePlayer(id);
    }
  }
  return null;
}

/**
 * Fetch league details.
 */
async function getLeague(leagueId) {
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}`;
  const response = await axios.get(url);
  return response.data;
}

/**
 * Fetch rosters and cache them.
 */
async function getRosters(leagueId, forceRefresh = false) {
  if (rostersCache && !forceRefresh) return rostersCache;
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}/rosters`;
  const response = await axios.get(url);
  rostersCache = response.data;
  return rostersCache;
}

/**
 * Fetch users and cache them.
 */
async function getUsers(leagueId, forceRefresh = false) {
  if (usersCache && !forceRefresh) return usersCache;
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}/users`;
  const response = await axios.get(url);
  usersCache = response.data;
  return usersCache;
}

/**
 * Fetch matchups for a given week.
 */
async function getMatchups(leagueId, week) {
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}/matchups/${week}`;
  const response = await axios.get(url);
  return response.data;
}

/**
 * Fetch transactions for a given week.
 */
async function getTransactions(leagueId, week) {
  const url = `${SLEEPER_BASE_URL}/league/${leagueId}/transactions/${week}`;
  const response = await axios.get(url);
  return response.data;
}

/**
 * Maps a roster_id to the user's display name and custom team name.
 */
async function getTeamDetailsByRosterId(leagueId, rosterId) {
  const [rosters, users] = await Promise.all([
    getRosters(leagueId),
    getUsers(leagueId)
  ]);

  const roster = rosters.find(r => r.roster_id === rosterId);
  if (!roster) return { ownerName: `Roster ${rosterId}`, teamName: `Team ${rosterId}` };

  const user = users.find(u => u.user_id === roster.owner_id);
  if (!user) return { ownerName: `Roster ${rosterId}`, teamName: `Team ${rosterId}` };

  const REAL_NAMES_MAP = {
    'DukeofWales': 'David',
    'MaffuJames': 'Matt',
    'Rhymenoceros': 'Dom',
    'LMcVicker': 'Lauren',
    'SamBaugh': 'Sam',
    'JayZone13': 'Jason',
    'PoppinChunkies': 'Tyler',
    'Doesntfleeze': 'Trent',
    'Tklumb86': 'Tony',
    'MattyIcer': 'Matt'
  };

  const username = user.display_name;
  let ownerName = user.display_name;
  const match = Object.keys(REAL_NAMES_MAP).find(k => k.toLowerCase() === ownerName.toLowerCase());
  if (match) {
    ownerName = REAL_NAMES_MAP[match];
  }

  const teamName = user.metadata && user.metadata.team_name ? user.metadata.team_name : user.display_name;

  return { ownerName, username, teamName };
}

/**
 * Maps a roster_id to the user's display name. (Deprecated: prefer getTeamDetailsByRosterId)
 */
async function getOwnerNameByRosterId(leagueId, rosterId) {
  const details = await getTeamDetailsByRosterId(leagueId, rosterId);
  return details.ownerName;
}

module.exports = {
  loadSleeperPlayers,
  resolvePlayer,
  resolvePlayerByName,
  getLeague,
  getRosters,
  getUsers,
  getMatchups,
  getTransactions,
  getOwnerNameByRosterId,
  getTeamDetailsByRosterId
};
