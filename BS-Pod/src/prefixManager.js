/**
 * prefixManager.js — State Manager for Randomized Bill Bot Prefixes
 *
 * Loads custom prefixes from `/BS-Pod/bot-prefix/fantasy_bot_parentheticals_by_trigger.txt`.
 * Tracks used prefixes in `/BS-Pod/data/prefix_state.json` to prevent repetition.
 * Recycles prefixes once all in a category have been used.
 */

const fs = require('fs');
const path = require('path');

const PREFIX_FILE = path.join(__dirname, '..', 'bot-prefix', 'fantasy_bot_parentheticals_by_trigger.txt');
const STATE_FILE = path.join(__dirname, '..', 'data', 'prefix_state.json');

// Default fallbacks in case file is missing
const DEFAULT_PREFIXES = {
  trades: [
    "Who is aggregating this?",
    "A truly baffling trade...",
    "Wait, what?",
    "The Trade Machine broke",
    "A massive, shifting-gears panic trade"
  ],
  recaps: [
    "Are we sure this week was good?",
    "The Sunday Night Pod",
    "I watched the tape",
    "My dad is grumpy about this week",
    "The Red Zone meltdown piece"
  ],
  general: [
    "But first, our friends from Pearl Jam...",
    "Good job by you",
    "Warning: Do not aggregate",
    "A quick announcement"
  ]
};

/**
 * Parses the single fantasy_bot_parentheticals_by_trigger.txt file.
 * Returns an object mapping trigger name -> array of prefix strings.
 */
function parsePrefixFile() {
  const categories = {};
  
  if (!fs.existsSync(PREFIX_FILE)) {
    console.warn(`⚠️ Custom prefix file not found at ${PREFIX_FILE}. Using defaults.`);
    return DEFAULT_PREFIXES;
  }

  try {
    const fileContent = fs.readFileSync(PREFIX_FILE, 'utf8');
    const lines = fileContent.split('\n');
    let currentTrigger = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Detect trigger block, e.g., "# TRIGGER: recaps — Weekly Matchup Recaps (Tuesdays)"
      const triggerMatch = line.match(/^#\s*TRIGGER:\s*([a-zA-Z0-9_-]+)/i);
      if (triggerMatch) {
        currentTrigger = triggerMatch[1].toLowerCase();
        categories[currentTrigger] = [];
        continue;
      }

      // If we are inside a trigger block, parse lines starting with a number and dot, e.g. "1. (fired up after...)"
      if (currentTrigger) {
        const itemMatch = line.match(/^\d+\.\s*(.*)/);
        if (itemMatch) {
          let text = itemMatch[1].trim();
          
          // Strip outer parentheses if they exist, e.g. "(staring at a wall)" -> "staring at a wall"
          if (text.startsWith('(') && text.endsWith(')')) {
            text = text.substring(1, text.length - 1).trim();
          }

          if (text.length > 0) {
            categories[currentTrigger].push(text);
          }
        }
      }
    }

    // Print summary of loaded triggers
    const summary = Object.entries(categories).map(([k, v]) => `${k} (${v.length})`).join(', ');
    console.log(`📂 Loaded custom prefixes from file: ${summary}`);
    
    return categories;
  } catch (err) {
    console.error(`❌ Failed to parse prefix file ${PREFIX_FILE}:`, err.message);
    return DEFAULT_PREFIXES;
  }
}

/**
 * Reads prefix used state
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('⚠️ Failed to load prefix state, starting fresh.', err.message);
  }
  return {};
}

/**
 * Saves prefix used state
 */
function saveState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('❌ Failed to save prefix state:', err.message);
  }
}

/**
 * Selects a random, non-repeating prefix for the specified trigger.
 * Formats it nicely inside the "Bill Bot (xxxx)" wrapper.
 *
 * @param {string} trigger - One of the trigger types (trades, recaps, waivers, etc.)
 * @returns {string} The fully formatted prefix header
 */
function getFormattedPrefix(trigger = 'general') {
  // Normalize trigger name
  const allParsed = parsePrefixFile();
  const validTriggers = Object.keys(allParsed);
  const activeTrigger = validTriggers.includes(trigger) ? trigger : 'general';

  const allPrefixes = allParsed[activeTrigger] || DEFAULT_PREFIXES[activeTrigger] || DEFAULT_PREFIXES.general;
  const state = loadState();

  if (!state[activeTrigger]) {
    state[activeTrigger] = [];
  }

  // Filter unused prefixes
  let unused = allPrefixes.filter(p => !state[activeTrigger].includes(p));

  // If all prefixes have been used, recycle them
  if (unused.length === 0) {
    console.log(`♻️ Recycling prefixes for trigger: "${activeTrigger}"`);
    state[activeTrigger] = [];
    unused = allPrefixes;
  }

  // Select random prefix
  const randomIndex = Math.floor(Math.random() * unused.length);
  const selected = unused[randomIndex];

  // Mark as used
  state[activeTrigger].push(selected);
  saveState(state);

  // Format the prefix. The user wants just the parenthetical, as it'll be posted by a bot named Jarvis.
  let formatted = `(${selected})`;

  return `🎙️ | ${formatted}:\n\n`;
}

module.exports = {
  getFormattedPrefix,
  parsePrefixFile
};
