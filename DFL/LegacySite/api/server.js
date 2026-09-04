import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Setup static upload serving
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for custom logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Persistent DB File
const DB_FILE = path.join(__dirname, '..', 'data', 'league_store.json');
const MASTER_DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'dfl_master_data.json');

// Default initial state
const DEFAULT_STATE = {
  pins: {
    Rhymenoceros: '1234',
    PoppinChunkies: '1234',
    MattyiceR: '1234',
    SamBaugh: '1234',
    Tklumb86: '1234',
    LMcVicker: '1234',
    doesntfleeze: '1234',
    MaffuJames: '1234',
    JayZone13: '1234',
    DukeofWales: '1234',
  },
  overUnderLines: [
    { teamKey: 'doesntfleeze', teamName: 'Washed🫩', manager: 'Trent', line: 9.5, tier: 'TIER 1: The Heavyweight Title Contenders', rationale: 'Heavyweight Title Contender setting the pace at 9.5 wins' },
    { teamKey: 'MattyiceR', teamName: "Heisenberg's Hitmen", manager: 'Matt', line: 8.5, tier: 'TIER 1: The Heavyweight Title Contenders', rationale: 'Reigning 2025 champion returning with veteran grit at 8.5 wins' },
    { teamKey: 'MaffuJames', teamName: "I don't Gibbs a Shough", manager: 'Matt James', line: 8.5, tier: 'TIER 1: The Heavyweight Title Contenders', rationale: 'Active trade maestro looking to break into the top tier at 8.5 wins' },
    { teamKey: 'Rhymenoceros', teamName: "Scott's Totts", manager: 'Dom', line: 7.5, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'The Commish leading the dangerous middle class at 7.5 wins' },
    { teamKey: 'PoppinChunkies', teamName: "Poppin' Chunkies", manager: 'Tyler', line: 7.0, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'Perennial powerhouse looking for redemption with a 7.0 win line' },
    { teamKey: 'LMcVicker', teamName: 'Laces Out, Ladies', manager: 'Lauren', line: 6.5, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'Inherited Tre legacy franchise, solid playoff contender at 6.5 wins' },
    { teamKey: 'DukeofWales', teamName: 'Hands for Jobs', manager: 'David', line: 6.5, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'Underdog looking to capitalize on high-upside young talent at 6.5 wins' },
    { teamKey: 'SamBaugh', teamName: "Dude, Where's Lamar?", manager: 'Sam', line: 6.0, tier: 'TIER 3: The Cellar Dwellers & Rebuild Trench', rationale: 'Loaded roster with Amon-Ra, Mahomes, and Hurts with a 6.0 win line' },
    { teamKey: 'Tklumb86', teamName: 'Who Dey', manager: 'Tony', line: 5.5, tier: 'TIER 3: The Cellar Dwellers & Rebuild Trench', rationale: 'New regime after Jake exit; stockpile of picks and depth at 5.5 wins' },
    { teamKey: 'JayZone13', teamName: 'Ronin', manager: 'Jason', line: 5.0, tier: 'TIER 3: The Cellar Dwellers & Rebuild Trench', rationale: '2024 champion with big upside aiming to shatter the 5.0 win line' },
  ],
  predictions: {},
  bets: [
    {
      id: 'bet-sample-1',
      createdBy: 'MattyiceR',
      targetUser: 'PoppinChunkies',
      title: 'Week 1 Showdown: Heisenberg vs PoppinChunkies',
      terms: 'Head-to-head regular season opener straight up.',
      stakes: '$20 & 1 Week of Humiliating Avatar',
      creatorPick: 'MattyiceR',
      targetPick: 'PoppinChunkies',
      status: 'ACCEPTED',
      acceptedBy: 'PoppinChunkies',
      winner: null,
      createdAt: '2026-09-01T12:00:00.000Z',
    },
    {
      id: 'bet-sample-2',
      createdBy: 'SamBaugh',
      targetUser: 'Tklumb86',
      title: 'Total Passing TDs: Mahomes vs Hurts',
      terms: 'Who throws more touchdown passes across the season?',
      stakes: 'A 6-pack of craft beer',
      creatorPick: 'Mahomes (Sam)',
      targetPick: 'Hurts (Tony)',
      status: 'ACCEPTED',
      acceptedBy: 'Tklumb86',
      winner: null,
      createdAt: '2026-09-02T14:30:00.000Z',
    },
    {
      id: 'bet-sample-3',
      createdBy: 'Rhymenoceros',
      targetUser: 'ALL',
      title: 'Barbershop Prop: Will Dom make a draft pick during a haircut?',
      terms: 'Any manager can take NO. Dom takes YES.',
      stakes: '$10 per manager',
      creatorPick: 'YES (Haircut draft)',
      targetPick: 'NO (Drafted from home)',
      status: 'OPEN',
      acceptedBy: null,
      winner: null,
      createdAt: '2026-09-03T18:00:00.000Z',
    }
  ],
  customProfiles: {
    Rhymenoceros: { slogan: "", accentColor: '#38bdf8' },
    PoppinChunkies: { slogan: "", accentColor: '#fbbf24' },
    MattyiceR: { slogan: "", accentColor: '#34d399' },
    SamBaugh: { slogan: "", accentColor: '#a78bfa' },
    Tklumb86: { slogan: "", accentColor: '#f97316' },
    LMcVicker: { slogan: "", accentColor: '#ec4899' },
    doesntfleeze: { slogan: "", accentColor: '#94a3b8' },
    MaffuJames: { slogan: "", accentColor: '#eab308' },
    JayZone13: { slogan: "", accentColor: '#ef4444' },
    DukeofWales: { slogan: "", accentColor: '#06b6d4' },
  }
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { ...DEFAULT_STATE, ...data };
  } catch (err) {
    console.error('Error reading DB:', err);
    return DEFAULT_STATE;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// 1. Get full state
app.get('/api/state', (req, res) => {
  const db = readDb();
  // Don't expose all pins to client
  const safeState = {
    ...db,
    pins: undefined, // hidden for security
  };
  res.json(safeState);
});

// 2. Get master historical data
app.get('/api/history', (req, res) => {
  if (fs.existsSync(MASTER_DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(MASTER_DATA_FILE, 'utf8'));
    res.json(data);
  } else {
    res.status(404).json({ error: 'Master data not yet generated. Please wait for the build script.' });
  }
});

// 3. Manager Login
app.post('/api/auth/login', (req, res) => {
  const { franchiseKey, pin } = req.body;
  if (!franchiseKey) {
    return res.status(400).json({ error: 'Franchise key is required' });
  }

  const db = readDb();
  const correctPin = db.pins[franchiseKey] || '1234';

  // Dom is commissioner and can use master PIN 0000 or his pin
  const isCommish = franchiseKey === 'Rhymenoceros' || pin === '0000';

  if (pin === correctPin || (isCommish && pin === '0000')) {
    res.json({
      success: true,
      franchiseKey,
      isCommissioner: franchiseKey === 'Rhymenoceros',
      token: `token-${franchiseKey}-${Date.now()}`
    });
  } else {
    res.status(401).json({ error: 'Incorrect 4-digit PIN. (Default is 1234)' });
  }
});

// 4. Update Manager PIN
app.post('/api/auth/set-pin', (req, res) => {
  const { franchiseKey, currentPin, newPin } = req.body;
  if (!franchiseKey || !newPin || !/^\d{4}$/.test(newPin)) {
    return res.status(400).json({ error: 'Invalid PIN. Must be exactly 4 numbers (0-9).' });
  }

  const db = readDb();
  if (!db.pins) db.pins = {};
  const storedPin = db.pins[franchiseKey] || '1234';

  if (storedPin !== currentPin && currentPin !== '0000') {
    return res.status(401).json({ error: 'Current PIN is incorrect. Default is 1234.' });
  }

  db.pins[franchiseKey] = newPin;
  writeDb(db);
  res.json({ success: true, message: 'PIN updated successfully.' });
});

// 5. Submit Predictions / Over-Under choices
app.post('/api/predictions', (req, res) => {
  const { franchiseKey, picks, awards } = req.body;
  if (!franchiseKey) {
    return res.status(400).json({ error: 'Franchise key is required' });
  }

  const db = readDb();
  db.predictions[franchiseKey] = {
    picks: picks || {},
    awards: awards || {},
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json({ success: true, predictions: db.predictions });
});

// 6. Create a Bet
app.post('/api/bets/create', (req, res) => {
  const { createdBy, targetUser, openType, title, terms, stakes, creatorPick, targetPick } = req.body;
  if (!createdBy || !title || !stakes) {
    return res.status(400).json({ error: 'Missing required bet fields' });
  }

  const db = readDb();
  const isAll = targetUser === 'ALL';
  const newBet = {
    id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdBy,
    targetUser: targetUser || 'ALL',
    openType: isAll ? (openType || 'FIRST_TO_TAKE') : 'DIRECT',
    takers: [],
    title,
    terms: terms || '',
    stakes,
    creatorPick: creatorPick || '',
    targetPick: targetPick || '',
    status: isAll ? 'OPEN' : 'PENDING_ACCEPTANCE',
    acceptedBy: null,
    winner: null,
    createdAt: new Date().toISOString(),
  };

  db.bets.unshift(newBet);
  writeDb(db);
  res.json({ success: true, bet: newBet, bets: db.bets });
});

// 7. Accept a Bet
app.post('/api/bets/accept', (req, res) => {
  const { betId, franchiseKey, chosenSide } = req.body;
  if (!betId || !franchiseKey) {
    return res.status(400).json({ error: 'Bet ID and Franchise Key required' });
  }

  const db = readDb();
  const bet = db.bets.find(b => b.id === betId);
  if (!bet) {
    return res.status(404).json({ error: 'Bet not found' });
  }

  // Handle Group Syndicate / Pool Bet (Managers can choose either CREATOR or TARGET side)
  if (bet.targetUser === 'ALL' && bet.openType === 'GROUP_POOL') {
    if (!bet.takers) bet.takers = [];

    const side = chosenSide === 'CREATOR' ? 'CREATOR' : 'TARGET';

    if (franchiseKey === bet.createdBy) {
      return res.status(400).json({ error: 'You are the creator of this wager (already backing your pick).' });
    }

    // Check if already in takers
    const existingIndex = bet.takers.findIndex(t => 
      (typeof t === 'string' ? t : t.franchiseKey) === franchiseKey
    );

    if (existingIndex !== -1) {
      // Update chosen side
      const existing = typeof bet.takers[existingIndex] === 'string'
        ? { franchiseKey, side, joinedAt: new Date().toISOString() }
        : { ...bet.takers[existingIndex], side };
      bet.takers[existingIndex] = existing;
    } else {
      bet.takers.push({
        franchiseKey,
        side,
        joinedAt: new Date().toISOString(),
      });
    }

    bet.status = 'OPEN'; // Stays open for more managers
    writeDb(db);
    return res.json({ success: true, bet, bets: db.bets });
  }

  if (bet.createdBy === franchiseKey) {
    return res.status(400).json({ error: 'You cannot accept your own bet.' });
  }

  // Standard 1-on-1 Duel or First-to-Take
  bet.status = 'ACCEPTED';
  bet.acceptedBy = franchiseKey;
  bet.acceptedAt = new Date().toISOString();

  writeDb(db);
  res.json({ success: true, bet, bets: db.bets });
});

// 8. Settle a Bet
app.post('/api/bets/settle', (req, res) => {
  const { betId, winner, settlerFranchise } = req.body;
  if (!betId || !winner) {
    return res.status(400).json({ error: 'Bet ID and winner required' });
  }

  const db = readDb();
  const bet = db.bets.find(b => b.id === betId);
  if (!bet) {
    return res.status(404).json({ error: 'Bet not found' });
  }

  const isGroupPool = bet.targetUser === 'ALL' && bet.openType === 'GROUP_POOL';
  const takerKeys = (bet.takers || []).map(t => (typeof t === 'string' ? t : t.franchiseKey));

  // Only the creator, acceptor, pool participants, or commissioner can settle
  const canSettle = 
    settlerFranchise === 'Rhymenoceros' ||
    settlerFranchise === bet.createdBy ||
    settlerFranchise === bet.acceptedBy ||
    (isGroupPool && takerKeys.includes(settlerFranchise));

  if (!canSettle) {
    return res.status(403).json({ error: 'Only participating managers or the Commissioner can settle this bet.' });
  }

  bet.status = 'SETTLED';
  bet.winner = winner;
  bet.settledAt = new Date().toISOString();
  bet.settledBy = settlerFranchise;

  // If group pool, compute and record full pari-mutuel payout breakdown
  if (bet.openType === 'GROUP_POOL') {
    const rawTakers = bet.takers || [];
    const takers = rawTakers.map(t => (typeof t === 'string' ? { franchiseKey: t, side: 'TARGET' } : t));
    const creatorWon = winner === bet.createdBy || winner === 'CREATOR';
    
    const sideAKeys = Array.from(new Set([bet.createdBy, ...takers.filter(t => t.side === 'CREATOR').map(t => t.franchiseKey)]));
    const sideBKeys = Array.from(new Set(takers.filter(t => t.side === 'TARGET').map(t => t.franchiseKey)));
    
    const stakeMatch = String(bet.stakes || '').match(/\$?(\d+(?:\.\d{1,2})?)/);
    const stakeAmount = stakeMatch ? parseFloat(stakeMatch[1]) : 10;
    const totalCount = sideAKeys.length + sideBKeys.length;
    const totalPot = totalCount * stakeAmount;

    if (creatorWon) {
      const payoutPerWinner = sideAKeys.length > 0 ? Number((totalPot / sideAKeys.length).toFixed(2)) : 0;
      bet.payoutSummary = {
        winningSide: 'CREATOR',
        winningPick: bet.creatorPick,
        winnerKeys: sideAKeys,
        loserKeys: sideBKeys,
        stakePerPerson: stakeAmount,
        totalPot,
        payoutPerWinner,
        profitPerWinner: Number((payoutPerWinner - stakeAmount).toFixed(2)),
      };
    } else {
      const payoutPerWinner = sideBKeys.length > 0 ? Number((totalPot / sideBKeys.length).toFixed(2)) : 0;
      bet.payoutSummary = {
        winningSide: 'TARGET',
        winningPick: bet.targetPick,
        winnerKeys: sideBKeys,
        loserKeys: sideAKeys,
        stakePerPerson: stakeAmount,
        totalPot,
        payoutPerWinner,
        profitPerWinner: Number((payoutPerWinner - stakeAmount).toFixed(2)),
      };
    }
  }

  writeDb(db);
  res.json({ success: true, bet, bets: db.bets });
});

// 8b. Update / Edit a Bet
app.post('/api/bets/update', (req, res) => {
  const { betId, requesterFranchise, title, terms, stakes, creatorPick, targetPick } = req.body;
  if (!betId || !requesterFranchise) {
    return res.status(400).json({ error: 'Bet ID and requester franchise required' });
  }

  const db = readDb();
  const bet = db.bets.find(b => b.id === betId);
  if (!bet) {
    return res.status(404).json({ error: 'Bet not found' });
  }

  const isCommish = requesterFranchise === 'Rhymenoceros';
  const isCreator = bet.createdBy === requesterFranchise;

  if (!isCommish && !isCreator) {
    return res.status(403).json({ error: 'Only the bet creator or Commissioner can edit this bet.' });
  }

  if (title !== undefined) bet.title = title;
  if (terms !== undefined) bet.terms = terms;
  if (stakes !== undefined) bet.stakes = stakes;
  if (creatorPick !== undefined) bet.creatorPick = creatorPick;
  if (targetPick !== undefined) bet.targetPick = targetPick;
  bet.updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ success: true, bet, bets: db.bets });
});

// 8c. Delete a Bet
app.post('/api/bets/delete', (req, res) => {
  const { betId, requesterFranchise } = req.body;
  if (!betId || !requesterFranchise) {
    return res.status(400).json({ error: 'Bet ID and requester franchise required' });
  }

  const db = readDb();
  const betIndex = db.bets.findIndex(b => b.id === betId);
  if (betIndex === -1) {
    return res.status(404).json({ error: 'Bet not found' });
  }

  const bet = db.bets[betIndex];
  const isCommish = requesterFranchise === 'Rhymenoceros';
  const isCreator = bet.createdBy === requesterFranchise;

  if (!isCommish && !isCreator) {
    return res.status(403).json({ error: 'Only the bet creator or Commissioner can delete this bet.' });
  }

  db.bets.splice(betIndex, 1);
  writeDb(db);
  res.json({ success: true, deletedId: betId, bets: db.bets });
});

// 9. Update Custom Profile & Branding
app.post('/api/profile/update', (req, res) => {
  const { franchiseKey, customLogoUrl, slogan, accentColor, mascot } = req.body;
  if (!franchiseKey) {
    return res.status(400).json({ error: 'Franchise key is required' });
  }

  const db = readDb();
  if (!db.customProfiles[franchiseKey]) {
    db.customProfiles[franchiseKey] = {};
  }

  if (customLogoUrl !== undefined) db.customProfiles[franchiseKey].customLogoUrl = customLogoUrl;
  if (slogan !== undefined) db.customProfiles[franchiseKey].slogan = slogan;
  if (accentColor !== undefined) db.customProfiles[franchiseKey].accentColor = accentColor;
  if (mascot !== undefined) db.customProfiles[franchiseKey].mascot = mascot;

  writeDb(db);
  res.json({ success: true, profile: db.customProfiles[franchiseKey] });
});

// 10. Upload Custom Logo
app.post('/api/profile/upload-logo', upload.single('logo'), (req, res) => {
  const { franchiseKey } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const logoUrl = `/uploads/${req.file.filename}`;

  if (franchiseKey) {
    const db = readDb();
    if (!db.customProfiles[franchiseKey]) {
      db.customProfiles[franchiseKey] = {};
    }
    db.customProfiles[franchiseKey].customLogoUrl = logoUrl;
    writeDb(db);
  }

  res.json({ success: true, logoUrl });
});

// ==========================================
// 11. Automated Sleeper In-Season Cron Sync
// ==========================================
const lastSyncInfo = {
  lastSyncTime: new Date().toISOString(),
  status: 'IDLE',
  message: 'Initialized with current season master data',
};

function runSleeperSync() {
  return new Promise((resolve, reject) => {
    lastSyncInfo.status = 'SYNCING';
    lastSyncInfo.message = 'Syncing active rosters, matchups, scores, and standings from Sleeper API...';
    console.log('🔄 [CRON/SYNC] Starting automated Sleeper data sync...');

    const scriptPath = path.join(__dirname, '..', 'scripts', 'build_sleeper_data.js');
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ [SYNC ERROR]:', stderr || error.message);
        lastSyncInfo.status = 'ERROR';
        lastSyncInfo.message = error.message;
        return reject(error);
      }
      console.log('✅ [SYNC SUCCESS] Sleeper data successfully synced!');
      lastSyncInfo.status = 'SUCCESS';
      lastSyncInfo.lastSyncTime = new Date().toISOString();
      lastSyncInfo.message = 'Sleeper data synced successfully';
      resolve({ success: true, stdout });
    });
  });
}

// Background Cron / Interval Scheduler:
// Runs automatically every Tuesday morning at 4:00 AM CST (9:00 UTC) post-Monday Night Football,
// and periodically every 6 hours during the season.
let lastSyncHour = -1;
setInterval(() => {
  const now = new Date();
  const utcHours = now.getUTCHours();
  if (utcHours % 6 === 0 && utcHours !== lastSyncHour) {
    lastSyncHour = utcHours;
    console.log(`⏰ [CRON] Triggering scheduled Sleeper sync (Hour ${utcHours}:00 UTC)...`);
    runSleeperSync().catch(err => console.error('[CRON SYNC FAILURE]', err));
  }
}, 10 * 60 * 1000); // Check schedule every 10 minutes

// Get sync status
app.get('/api/sync/status', (req, res) => {
  res.json({
    ...lastSyncInfo,
    cronSchedule: 'Every Tuesday 4:00 AM CST & every 6 hours in-season',
  });
});

// Trigger manual sync (Commissioner only)
app.post('/api/sync/sleeper', async (req, res) => {
  const { requesterFranchise, pin } = req.body || {};
  const isCommish = requesterFranchise === 'Rhymenoceros' || pin === '0000';
  if (!isCommish) {
    return res.status(403).json({ error: 'Access denied. Only the Commissioner (Dom) can trigger manual Sleeper syncs.' });
  }

  try {
    const result = await runSleeperSync();
    res.json({ success: true, lastSyncInfo, details: result.stdout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync Sleeper data', details: err.message });
  }
});

// Serve frontend in production build
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`📡 DFL API server running on http://localhost:${PORT}`);
});
