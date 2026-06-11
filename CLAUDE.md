# Fantasy Football Suite — Working Notes for Claude

Monorepo for a Sleeper fantasy football ecosystem. **`README.md` at this root is the
master architectural spec** (API contracts, valuation formulas, trigger schedule,
GraphQL payloads) — read it before changing cross-service interfaces. This file covers
the operational stuff the README doesn't.

GitHub: https://github.com/SpeedyMc5peeder/fantasy-football-suite (branch `main`)

## The four services

| Service | What it is | Runs where | Key files |
|---|---|---|---|
| `JARVIS/` | AI commentary bot — polls Sleeper, writes articles via Gemini, posts to league chat | PM2 locally (`sleeper-bot`, 2-min watch poll) **and** GitHub Actions every 30 min | `index.js`, `src/promptTemplates.js`, `src/imagePrompts.js`, `JARVIS_CHARACTER_BIBLE.txt` |
| `Trade-Machine/` | React/Vite trade dashboard + opportunity scanner | Vite dev server (port 5173) + own Express API (`api/index.js`, port 5000) | `src/components/TradeMachine.jsx`, `src/tradeAlgorithm.js` |
| `Dynasty-Evaluator/` | **REMOVED June 2026** — logic migrated into JARVIS and Trade-Machine's own `api/` | — | — |
| `Image-Gen/` | Imagen 3 wrapper + canvas overlay for Ringer-style graphics | Local, port 5001 | `src/server.js`, `src/overlay.js` |

JARVIS depends on Dynasty-Evaluator (port 5000) and Image-Gen (port 5001) being up.
Images can't be uploaded to Sleeper directly — they're hosted via a Discord webhook
and embedded as markdown links (see README "Automated Image Delivery Flow").

## Secrets — never commit

- `config.json` (root) — Gemini key, Sleeper user token, Discord webhooks, league IDs,
  manager lore/mascot prompts. Gitignored; `config.template.json` is the safe template.
- `Trade-Machine/Keys/` (GeminiKey.txt, GroqKey.txt) — gitignored.
- GitHub Actions get secrets via repo Secrets (`GEMINI_API_KEY` etc.), not config.json.

## Automation (`.github/workflows/`)

- `jarvis-bot.yml` — every 30 min; manual dispatch with `--check-transactions`,
  `--weekly-recap`, or `--test-webhook`. Has `contents: write` to push state files back.
- `daily-scrape.yml` — daily 10:00 UTC, runs the Trade-Machine scraper and commits results.
- `weekly-opportunities.yml` — Tuesdays 13:00 UTC, trade opportunity finder.

**Caution:** both Actions and local PM2 run JARVIS. State files (`JARVIS/data/
prefix_state.json`, `processed_news.json`) are committed by the Actions runner, so
local and remote state can diverge — pull before debugging "duplicate post" issues.

## Local ops

- PM2: `pm2 start ecosystem.config.js` from `JARVIS/`; logs via `pm2 logs sleeper-bot`;
  `pm2 resurrect` after reboot. See `JARVIS/PM2_SETUP_GUIDE.md`.
- Posts go through Sleeper's internal GraphQL (`POST https://sleeper.com/graphql`) with
  the user token — there are no official webhooks. Posts start with a bare `🎙️ | ` mic
  marker; the randomized parenthetical prefixes are disabled via `USE_PREFIXES = false`
  in `JARVIS/src/poster.js` (user preference, June 2026 — flip to re-enable).
- The Gemini key in `config.json` is an `AQ.`-format key (Google's newer format — valid;
  don't assume only `AIza` keys work). All `AQ.Ab8RN...` keys look identical at a glance —
  compare full strings when debugging auth, and test with a direct `generateContent` call.

## JARVIS persona rules

Voice: 55% dry British wit / 35% American friendship-raillery / 10% Borat absurdity.
Influences: Norm Macdonald, Demetri Martin, Tom Segura, Bill Simmons skeleton.
~20% of posts include an "AI slip" glitch bit. Pub-level swearing is intentional.
No @-tagging in posts — use natural first names (Sleeper doesn't parse `<@user_id>`;
see commits `db7fdb3`/`8ab426b`). Full spec in `JARVIS/JARVIS_CHARACTER_BIBLE.txt`.
`JARVIS/bot-prefix/fantasy_bot_parentheticals_by_trigger.txt` is hand-edited by the
user — don't regenerate or reformat it wholesale.

## League context

- User's Sleeper username: **Rhymenoceros**.
- Leagues in config: **DFL** (user is commissioner, auto_post on) and
  **DynastyWarriors** (player). Sibling folders `Degens/`, `DFL/`, `DynastyWarriors/`
  hold league-specific assets/history.

## Current state (as of 2026-06-10)

All June-10 work verified and committed: Trade-Machine overhaul (Sleeper Sync, inverse
"Acquire a Position" finder with value tiers, true 3-way finder with broker legs,
dynasty/redraft dual rankings with league-type auto-detection, draft-aware pick
filtering, fixed `/api/evaluate` crash + Evaluate button), JARVIS fixes (news retry on
Gemini failure, prefix wiring, mic-only headers, shorter posts, single-message news/
eulogy posts), and the jarvis-bot.yml repair (was `cd`-ing into deleted
Dynasty-Evaluator since June 7 — every cloud run failed).

Redraft rankings: `scripts/scraper.js` builds `data/rankings_redraft.json` (KTC redraft
+ FantasyCalc blend); API serves `?format=redraft`; UI toggles 💎/🔁 per league type
(Sleeper `settings.type`: 0/1 → redraft, 2 → dynasty). The user primarily uses the
Trade Machine **on his phone** — keep it mobile-friendly.
