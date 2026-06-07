/**
 * poster.js — GraphQL Posting Utility for Sleeper League Chat
 *
 * Prepend the required bot prefix header, enforces Sleeper's character limit,
 * and makes the POST request to Sleeper's internal GraphQL endpoint using the user's authorization token.
 */

const axios = require('axios');
const crypto = require('crypto');

const { getFormattedPrefix } = require('./prefixManager');

const SLEEPER_CHAR_LIMIT = 4000;
const SAFE_LIMIT = 3800; // Leave buffer for formatting and header

/**
 * Splits a long markdown text into chunks of maximum size, trying to split on paragraph breaks.
 */
function chunkMessage(text, maxLen = SAFE_LIMIT) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk + '\n\n' + p).length > maxLen) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = p;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + p : p;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If a single paragraph is still too long, hard slice it
  return chunks.flatMap(chunk => {
    if (chunk.length <= maxLen) return [chunk];
    
    const subChunks = [];
    let remaining = chunk;
    while (remaining.length > 0) {
      subChunks.push(remaining.substring(0, maxLen));
      remaining = remaining.substring(maxLen);
    }
    return subChunks;
  });
}

/**
 * Send a message to the Sleeper League Chat via GraphQL
 * @param {string} userToken - The user's Sleeper token (JWT)
 * @param {string} leagueId - The Sleeper league ID
 * @param {string} content - The markdown content to send
 * @param {boolean} dryRun - If true, just log to console and do not make the HTTP request
 * @param {string} trigger - The trigger category (trades, recaps, waivers, injuries, etc.)
 */
async function postToSleeper(userToken, leagueId, content, dryRun = false, trigger = 'general') {
  // Prepend the randomized bot identification header
  const header = getFormattedPrefix(trigger);
  const fullContent = header + content;

  // Split into chunks if it exceeds the limit
  const chunks = chunkMessage(fullContent, SAFE_LIMIT);

  console.log(`📡 Preparing to send ${chunks.length} message chunk(s) to Sleeper...`);

  if (dryRun) {
    console.log('🚫 [DRY RUN] GraphQL post suppressed. Outputting contents to log instead:');
    chunks.forEach((chunk, i) => {
      console.log(`\n--- MESSAGE CHUNK ${i + 1}/${chunks.length} ---`);
      console.log(chunk);
      console.log('-------------------------------------\n');
    });
    return true;
  }

  if (!userToken || userToken === 'YOUR_SLEEPER_USER_TOKEN' || userToken.length < 20) {
    throw new Error('Invalid or missing Sleeper User Token in config.json. Cannot authenticate with Sleeper chat.');
  }

  if (!leagueId || leagueId.startsWith('YOUR_')) {
    throw new Error('Invalid or missing Sleeper League ID in config.json.');
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(`   🚀 Posting chunk ${i + 1}/${chunks.length} to Sleeper league chat via GraphQL...`);
      
      const clientId = crypto.randomUUID();
      const payload = {
        operationName: 'create_message',
        variables: {
          text: chunk
        },
        query: `mutation create_message($text: String) {
  create_message(parent_id: "${leagueId}", client_id: "${clientId}", parent_type: "league", text: $text) {
    message_id
    parent_id
    text
  }
}`
      };

      const response = await axios.post('https://sleeper.com/graphql', payload, {
        headers: {
          'Content-Type': 'application/json',
          'authorization': userToken
        }
      });

      if (response.data && response.data.errors) {
        throw new Error(`GraphQL Error response: ${JSON.stringify(response.data.errors)}`);
      }

      // Add a slight delay between chunks to prevent rate-limiting or out-of-order issues
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err) {
      console.error(`❌ Failed to post chunk ${i + 1} to Sleeper:`, err.response?.data || err.message);
      throw err;
    }
  }

  console.log('✅ Post successfully sent to Sleeper league chat.');
  return true;
}

module.exports = {
  postToSleeper,
  chunkMessage
};
