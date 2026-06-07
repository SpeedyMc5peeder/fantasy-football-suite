# 🎙️ Fantasy Football Commissioner & Player Suite

Welcome to the **Fantasy Football Commissioner & Player Suite**. This is a premium, multi-service ecosystem designed to evaluate player trade values, discover trade opportunities, generate Ringer-style commentary (Bill Simmons/Ryen Russillo), and automatically post to Sleeper league chats via webhooks.

This document serves as the **Master Architectural Specification** and **Single Source of Truth** for the entire project. All other bots, scripts, and repository sub-folders must reference and adhere to the interfaces and schemas defined below.

---

## 🏗️ System Architecture & Data Flow

The system is split into four core applications and a central configuration file:

1. **`Dynasty-Evaluator` (Valuation & REST API)**
   - Runs a scraper to ingest KeepTradeCut (KTC) rankings.
   - Merges expert consensus rankings (ECR) from external sources or a custom uploaded spreadsheet.
   - Calculates contender/rebuilder value shifts, package adjustments, and roster taxes.
   - Exposes a local REST API (default port `5000`).

2. **`Image-Gen` (Image Generation API)**
   - Connects to Google's Imagen 3 API using your shared Gemini key.
   - Exposes a local REST API (default port `5001`) to generate JPG graphics.
   - Includes overlay canvas scripts to draw Ringer-style titles onto images.

3. **`Trade-Machine` (UI Dashboard & Opportunity Finder)**
   - Runs a React web dashboard (Vite, default port `3000`) for visual drag-and-drop trade evaluation.
   - Runs a background worker that scans your Sleeper leagues, discovers win-win trade opportunities, and writes them with AI blurbs to `/Trade-Machine/opportunities/`.

4. **`JARVIS` (AI Commentary & Automation)**
   - Connects to Sleeper API to read matchups, standings, waivers, injuries, and trades.
   - Queries `Dynasty-Evaluator` for trade and player values.
   - Requests custom illustrations from `Image-Gen`.
   - Utilizes the Gemini API to write articles in the voice of Bill Simmons (75%) and Ryen Russillo (25%).
   - Posts articles directly to Sleeper league chat rooms using incoming webhooks or user token mutations.

5. **`config.json` (Central Config)**
   - A single, centralized JSON configuration file at the root of the workspace managing all API keys, Sleeper league IDs, roles, webhooks, and custom league lore.

### System Diagram
```mermaid
graph TD
    subgraph "Global Configuration"
        RootConfig[config.json at root]
    end

    subgraph "Dynasty-Evaluator (Port 5000)"
        DE_Scrape[Scraper: KTC / ECR] --> DE_DB[(Unified DB: rankings.json)]
        User_Upload[Late-Round CSV Upload] --> DE_DB
        DE_DB --> DE_API[REST API Server]
    end

    subgraph "Image-Gen (Port 5001)"
        IG_API[Imagen 3 API Server] -->|Generates JPGs| IG_Files[images/ output/]
    end

    subgraph "Trade-Machine (Port 3000)"
        TM_UI[Vite + React UI Dashboard] <-->|Queries API| DE_API
        TM_Worker[Trade Opportunity Scanner] -->|Fetches Rosters| Sleeper_API[Sleeper API]
        TM_Worker -->|Queries Values| DE_API
        TM_Worker -->|Generates Blurbs| BS_Gen
        TM_Worker -->|Writes files| TM_Files[opportunities/ league_name_opps.md]
    end

    subgraph "JARVIS (Cron / CLI Runner)"
        BS_Worker[Transaction & Weekly Cron] -->|Fetches Matchups & Logs| Sleeper_API
        BS_Worker -->|Queries values| DE_API
        BS_Worker -->|Requests cover image| IG_API
        BS_Worker -->|Custom Lore & Mappings| RootConfig
        BS_Worker -->|Prompts| BS_Gen[Gemini AI Generator]
        BS_Gen -->|Prefixes '[Bill Simmons Bot]' & Webhook| Sleeper_Chat[Sleeper League Chat]
    end

    RootConfig -.->|Configs & Keys| BS_Worker
    RootConfig -.->|Configs & Keys| TM_Worker
    RootConfig -.->|Configs & Keys| IG_API
```

---

## 📂 Directory Structure

```
/ (Workspace Root)
├── config.json                     # Centralized configurations, webhooks, keys, and lore
├── config.template.json            # Safe configuration template committed to git
├── README.md                       # This master blueprint file
├── /Dynasty-Evaluator              # Backend rankings scraper & local REST API
│   ├── /data
│   │   ├── rankings.json           # Unified scraped & calculated values database
│   │   └── late_round_rankings.csv # (Optional) User-uploaded custom rankings
│   ├── /src
│   │   ├── scraper.js              # HTML/KTC parsing script
│   │   ├── formulas.js             # Composite value, Stud Premium, & Roster Tax math
│   │   └── server.js               # Express REST API (port 5000)
│   └── package.json
├── /Image-Gen                      # Imagen 3 API wrapper & canvas overlay tool
│   ├── /src
│   │   ├── server.js               # Express API (port 5001)
│   │   └── overlay.js              # Overlay script to draw magazine text on images
│   ├── /images                     # Folder for generated JPGs
│   └── package.json
├── /Trade-Machine                  # React UI & background opportunity script
│   ├── /src                        # React frontend components (Vite)
│   ├── /scripts
│   │   └── find_opportunities.js   # Background trade scanner & generator
│   ├── /opportunities              # Markdown output folder for generated trade sheets
│   │   ├── DFL_opportunities.md
│   │   └── DynastyWarriors_opportunities.md
│   └── package.json
└── /JARVIS                         # AI sports journalism engine & cron worker
    ├── /src
    │   ├── sleeperClient.js        # Handles Sleeper matchups, trades, and waivers
    │   ├── promptTemplates.js      # Few-shot prompts for Simmons & Russillo styles
    │   ├── generator.js            # Calls Gemini API to write articles
    │   └── poster.js               # Webhook messenger to Sleeper
    ├── index.js                    # Cron / CLI entrypoint
    └── package.json
```


---

## ⚙️ Shared API Contract: `Dynasty-Evaluator`

All sub-projects requiring player rankings or trade math must query the `Dynasty-Evaluator` API:

### 1. `GET /api/rankings`
Returns a unified array of players with blended scores and contender/rebuilder adjusted values.

**Response Schema (`200 OK`)**:
```json
[
  {
    "id": "1234",
    "name": "Justin Jefferson",
    "position": "WR",
    "team": "MIN",
    "age": 26,
    "ktc_value": 8500,
    "ecr_value": 8200,
    "composite_value": 8380,
    "contender_value": 8380,
    "rebuilder_value": 8380
  },
  {
    "id": "5678",
    "name": "Derrick Henry",
    "position": "RB",
    "team": "BAL",
    "age": 32,
    "ktc_value": 3200,
    "ecr_value": 3800,
    "composite_value": 3440,
    "contender_value": 4128,  // +20% veteran contender boost
    "rebuilder_value": 2236   // -35% veteran rebuilder tax
  }
]
```

### 2. `POST /api/evaluate`
Accepts a proposed trade package and returns side-by-side math including Package Adjustments (Stud Premium) and Roster Taxes.

**Request Body**:
```json
{
  "sideA": {
    "team_id": "1",
    "players": ["1234"], // Array of Player IDs
    "picks": ["2027_1st_mid"]
  },
  "sideB": {
    "team_id": "2",
    "players": ["5678", "9901"],
    "picks": []
  },
  "settings": {
    "team_1_mode": "contender", // "contender" | "rebuilder" | "neutral"
    "team_2_mode": "rebuilder"
  }
}
```

**Response Schema (`200 OK`)**:
```json
{
  "sideA_raw_value": 9880,
  "sideA_adjusted_value": 9880, // High-value player, no package decay
  "sideB_raw_value": 5440,
  "sideB_adjusted_value": 4100, // Multi-player package decay applied (Stud Premium)
  "roster_tax_applied": 500,    // Side B sent more players, requiring Side A to drop someone
  "final_sideA_total": 9880,
  "final_sideB_total": 3600,
  "fairness_ratio": 2.74,       // Final A divided by Final B
  "winner": "sideA",
  "margin_description": "Massive fleecing. Jefferson is a Tier 1 asset; Henry + depth does not move the needle."
}
```

---

## 📊 Core Calculation Logic

### 1. Composite Player Valuation
We merge crowdsourced KeepTradeCut ($V_{KTC}$) and Expert ECR ($V_{ECR}$) into a single Composite Value ($V_{Comp}$):
$$V_{Comp} = w \cdot V_{KTC} + (1 - w) \cdot V_{ECR}$$
*   $w$ represents the **Market Reactivity Weight** (default `0.6`, adjustable via `/config.json`).
*   **Late-Round CSV Blending**: If `/Dynasty-Evaluator/data/late_round_rankings.csv` exists, the parser will normalize J.J. Zachariason's rankings to a `0-9999` scale and use it as $V_{ECR}$. Otherwise, it falls back to the default DynastyProcess/FantasyPros free dataset.

### 2. Contender/Rebuilder Adjustments
*   **Contenders**: Older producing veterans (age 28+ RBs/WRs, 30+ QBs) get a boost of `+10%` to `+20%`. Rookie draft picks get a discount of `-15%` to `-25%`.
*   **Rebuilders**: Younger developmental players (age < 24) and draft picks get a boost of `+10%` to `+25%`. Veterans (age 27+) get a discount of `-20%` to `-35%`.

### 3. Stud Premium & Roster Space Tax
For packages of multiple players, we penalize depth players relative to the highest-valued player in the deal ($t$):
$$v_P^{adj} = v_P \times \left( d + (1 - d) \times \left(\frac{v_P}{t}\right)^{1.3} \right)$$
*   $d$ (Base Depth Floor) is set to `0.5`.
*   **Roster Space Tax**: A flat penalty of `500` points per roster spot discrepancy is applied to the side receiving more players (representing the cost of dropping bench players).

---

## 📣 JARVIS Commentary System

Every article generated by the Gemini API must blend **75% Bill Simmons** (pop culture analogies, historical comparisons, Boston tropes, hyperbole) and **25% Ryen Russillo** (tape-grinder realism, contrarian angles, target shares, defensive alignment talk).

### 🤖 Webhook Post Identification Rule
To ensure transparency in league communication, **every message posted to a Sleeper league chat must start with a designated prefix header**:
`🎙️ | BS POD BOT: <Content>` or `[Bill Simmons Bot] <Content>`.

### 📡 Direct Chat GraphQL Mutation (Bypassing Webhooks)
Since Sleeper lacks official incoming webhooks, the bot will post messages directly using your `sleeper_user_token` via the internal GraphQL endpoint:
*   **URL:** `POST https://sleeper.com/graphql`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `authorization: <YOUR_SLEEPER_USER_TOKEN>`
*   **JSON Request Payload:**
    ```json
    {
      "operationName": "create_message",
      "variables": {
        "text": "🎙️ | BS POD BOT: Your article goes here"
      },
      "query": "mutation create_message($text: String) {\n  create_message(parent_id: \"<SLEEPER_LEAGUE_ID>\", client_id: \"<GENERATE_RANDOM_UUID>\", parent_type: \"league\", text: $text) {\n    message_id\n    parent_id\n    text\n  }\n}"
    }
    ```


### ⚡ Article Triggers, Schedule & Graphics
1. **Pre-Season Daily Team Previews (10 Days Leading to Kickoff)**:
   - *Schedule:* 1 article per team per day, counting down the 10 days to the regular season.
   - *Format:* Written in a classic Bill Simmons preview column structure, grouping managers into humorous pre-season tiers:
     - **Tier 1: The Apex Predators** (The league favorites, veteran win-now rosters).
     - **Tier 2: The "I Don't See It" Group** (Bubble teams with structural flaws).
     - **Tier 3: The Lottery Ticket Hoarders / Tanking Brigade** (Rebuilders playing for draft picks).
   - *Graphics:* Each preview features a custom 16:9 illustration of the team's mascot generated via `Image-Gen` from the `"manager_mascots"` configurations.
2. **Weekly Matchup Recaps (Tuesdays)**:
   - *Content:* Summary of the week's matchups, high scorers, and bench regrets.
   - *Graphics:* Each recap is headed by a custom "magazine cover photo" styled with text overlays by `Image-Gen`. The style is selected dynamically on each run using the following probabilities:
     - **50% Probability: Sports Illustrated Style** (Photorealistic sports action shot + bold overlays).
     - **35% Probability: The Ringer Style** (Vibrant vector/flat graphic illustration).
     - **15% Probability: Retro Comic Book Style** (Classic ink illustration + vintage textures).
3. **Trade Comments (On Transaction)**:
   - *Content:* Triggered immediately on league trades.
   - *Graphics:* If the trade has a value margin deficit exceeding **15%** (a significant fleecing), the bot generates a "fleecing cartoon" representing the crime (e.g. a robber with gold escaping a sad mascot).
4. **Waiver Wire Add/Drops**:
   - For major waiver runs (e.g. Wednesday mornings), writes a short summary of the key additions.
   - For individual one-off transactions, drops a quick 1-2 sentence comedic reaction, even if it's a minor/shitty player addition.
5. **Star Injuries (On Occurrence)**: Comments on injuries to players valued over `4000` KTC.
6. **Quarterly Standings Reviews (Weeks 4, 8, 12, 14)**: Mid-season playoff standing projections.
7. **"Good Stats, Bad Team" Award (Mid-Season)**: Criticizing elite players trapped on struggling 1-7 rosters.
8. **Trade Deadline Panic Guide (2 Weeks Before Deadline)**: Proposing fake, desperate trades for bubble teams.

### 🖼️ Automated Image Delivery Flow
Since Sleeper chat cannot ingest binary uploads via webhook/GraphQL, images are delivered as embeds:
1. `Image-Gen` creates the graphic and saves it in `/Image-Gen/images/`.
2. The automation workflow commits and pushes the new JPG to your private GitHub repository.
3. The bot posts the direct GitHub raw URL (e.g., `https://raw.githubusercontent.com/SpeedyMc5peeder/fantasy-football-suite/main/Image-Gen/images/filename.jpg`) inside the Sleeper chat message.
4. Sleeper's chat client reads the link and automatically renders the image inside the chat bubble.

---

## 🚀 GitHub Actions 24/7 Automation

To run the JARVIS scheduler 24/7 for free without requiring your laptop to remain on, we deploy a GitHub Actions workflow:

### `.github/workflows/monitor_league.yml`
```yaml
name: Monitor Sleeper League

on:
  schedule:
    - cron: '*/15 * * * *' # Runs every 15 minutes during the season
  workflow_dispatch: # Allows manual trigger

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-size: '18'
          cache: 'npm'
          cache-dependency-path: './JARVIS/package.json'

      - name: Install dependencies
        run: |
          cd Dynasty-Evaluator && npm install
          cd ../JARVIS && npm install

      - name: Start Evaluator Server (Background)
        run: |
          cd Dynasty-Evaluator
          npm start &
          sleep 5 # Wait for port 5000 to open

      - name: Run Monitor & Post Transactions
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          cd JARVIS
          node index.js --check-transactions
```
*(Note: A similar workflow can be scheduled weekly on Tuesdays for recaps, or triggered manually.)*

---

## ⚙️ Centralized `config.json` Reference

The `config.json` file at the root of the workspace holds your configuration keys, league details, and manager lore mappings. **Do not commit this file to public repositories.**

```json
{
  "gemini_api_key": "YOUR_GEMINI_API_KEY",
  "sleeper_user_token": "YOUR_SLEEPER_USER_TOKEN",
  "leagues": [
    {
      "name": "DFL",
      "sleeper_league_id": "1326430815118163968",
      "2025_sleeper_league_id": "YOUR_2025_DFL_LEAGUE_ID",
      "role": "commissioner",
      "auto_post": true,
      "webhook_url": "YOUR_SLEEPER_INCOMING_WEBHOOK_URL",
      "manager_lore": {
        "Tklumb86": "Took over the franchise formerly owned by TakethecakeJake. Known for aggressive rebuild moves and late-night trade negotiations.",
        "manager_username_2": "Describe their style, past beefs, or trade habits here..."
      },
      "manager_mascots": {
        "Tklumb86": "a robotic grey wolf running through a futuristic snowstorm, photorealistic 3D rendering",
        "Rhymenoceros": "a massive iron-clad war rhinoceros charging down an NFL gridiron, cinematic action shot"
      }
    },
    {
      "name": "DynastyWarriors",
      "sleeper_league_id": "YOUR_DYNASTY_WARRIORS_LEAGUE_ID",
      "role": "player",
      "auto_post": false,
      "webhook_url": "",
      "user_team_username": "Rhymenoceros"
    }
  ]
}
```

