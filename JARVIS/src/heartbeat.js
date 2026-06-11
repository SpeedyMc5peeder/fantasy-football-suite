/**
 * heartbeat.js — "laptop is alive" signal for primary/backup failover.
 *
 * The local PM2 bot is primary. Each poll it force-pushes a timestamp to a
 * dedicated `bot-heartbeat` branch (throttled). The GitHub Actions bot reads
 * that branch at the start of every run: if the laptop checked in recently it
 * exits without posting, so the cloud bot only acts as a true backup when the
 * laptop is off. See jarvis-bot.yml "Check laptop heartbeat" step.
 *
 * Uses git plumbing (hash-object/mktree/commit-tree) so it never touches the
 * working tree or the index, and force-push keeps the branch a single commit.
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.join(__dirname, '..', '..');
const BRANCH = 'bot-heartbeat';
const PUSH_INTERVAL_MS = 5 * 60 * 1000; // don't push more than once per 5 min

let lastPush = 0;

function updateHeartbeat() {
  const now = Date.now();
  if (now - lastPush < PUSH_INTERVAL_MS) return;
  lastPush = now;

  try {
    const ts = new Date().toISOString();
    const content = JSON.stringify({ alive_at: ts, host: os.hostname() }) + '\n';
    const run = (cmd, input) =>
      execSync(cmd, { cwd: REPO_ROOT, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();

    const blob = run('git hash-object -w --stdin', content);
    const tree = run('git mktree', `100644 blob ${blob}\theartbeat.json\n`);
    const commit = run(`git commit-tree ${tree} -m "heartbeat ${ts}"`);
    run(`git push -f origin ${commit}:refs/heads/${BRANCH}`);
  } catch (_) {
    // Best-effort only — a heartbeat failure must never disrupt the bot.
  }
}

module.exports = { updateHeartbeat };
