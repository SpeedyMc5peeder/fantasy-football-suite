import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

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
    { teamKey: 'PoppinChunkies', teamName: 'Poppinchunkies', manager: 'Tyler', line: 10.5, rationale: 'Perennial 44-12 powerhouse looking for redemption' },
    { teamKey: 'MattyiceR', teamName: "Heisenberg's Hitmen", manager: 'Matt', line: 8.5, rationale: 'Reigning 2025 champion returning with veteran grit' },
    { teamKey: 'SamBaugh', teamName: "Dude, Where's Lamar?", manager: 'Sam', line: 8.5, rationale: 'Loaded roster with Amon-Ra, Mahomes, and Hurts' },
    { teamKey: 'Tklumb86', teamName: 'Who Dey', manager: 'Tony', line: 7.5, rationale: 'New regime after Jake exit; stockpile of picks and depth' },
    { teamKey: 'LMcVicker', teamName: 'Laces Out, Ladies', manager: 'Lauren', line: 7.5, rationale: 'Inherited Tre legacy franchise, solid playoff contender' },
    { teamKey: 'MaffuJames', teamName: "I don't Gibbs a Shough", manager: 'Matt James', line: 6.5, rationale: 'Active trade maestro looking to break into top tier' },
    { teamKey: 'JayZone13', teamName: 'Ronin', manager: 'Jason', line: 6.5, rationale: '2024 champion with big upside when postseason hits' },
    { teamKey: 'doesntfleeze', teamName: 'Washed🫩', manager: 'Trent', line: 6.5, rationale: 'Self-proclaimed cursed roster aiming to prove doubters wrong' },
    { teamKey: 'Rhymenoceros', teamName: "Scott's Totts", manager: 'Dom', line: 6.5, rationale: 'The Commish looking to improve on historical record' },
    { teamKey: 'DukeofWales', teamName: 'Hands for Jobs', manager: 'David', line: 5.5, rationale: 'Underdog looking to capitalize on Keon Coleman & youth' },
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
    Rhymenoceros: { slogan: "Drafting while getting a fade since 2022", accentColor: '#38bdf8' },
    PoppinChunkies: { slogan: "Mickey Mouse ring or not, 44-12 speaks for itself", accentColor: '#fbbf24' },
    MattyiceR: { slogan: "League champ btw. Give me my ribbon.", accentColor: '#34d399' },
    Tklumb86: { slogan: "My balls are in your hands, Commish", accentColor: '#f97316' },
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
  if (!franchiseKey || !newPin || newPin.length !== 4) {
    return res.status(400).json({ error: 'Invalid PIN. Must be exactly 4 digits.' });
  }

  const db = readDb();
  if (db.pins[franchiseKey] && db.pins[franchiseKey] !== currentPin && currentPin !== '0000') {
    return res.status(401).json({ error: 'Current PIN is incorrect.' });
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
  const { createdBy, targetUser, title, terms, stakes, creatorPick, targetPick } = req.body;
  if (!createdBy || !title || !stakes) {
    return res.status(400).json({ error: 'Missing required bet fields' });
  }

  const db = readDb();
  const newBet = {
    id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdBy,
    targetUser: targetUser || 'ALL',
    title,
    terms: terms || '',
    stakes,
    creatorPick: creatorPick || '',
    targetPick: targetPick || '',
    status: targetUser === 'ALL' ? 'OPEN' : 'PENDING_ACCEPTANCE',
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
  const { betId, franchiseKey } = req.body;
  if (!betId || !franchiseKey) {
    return res.status(400).json({ error: 'Bet ID and Franchise Key required' });
  }

  const db = readDb();
  const bet = db.bets.find(b => b.id === betId);
  if (!bet) {
    return res.status(404).json({ error: 'Bet not found' });
  }

  if (bet.createdBy === franchiseKey) {
    return res.status(400).json({ error: 'You cannot accept your own bet.' });
  }

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

  // Only the creator, acceptor, or commissioner can settle
  const canSettle = 
    settlerFranchise === 'Rhymenoceros' ||
    settlerFranchise === bet.createdBy ||
    settlerFranchise === bet.acceptedBy;

  if (!canSettle) {
    return res.status(403).json({ error: 'Only participating managers or the Commissioner can settle this bet.' });
  }

  bet.status = 'SETTLED';
  bet.winner = winner;
  bet.settledAt = new Date().toISOString();
  bet.settledBy = settlerFranchise;

  writeDb(db);
  res.json({ success: true, bet, bets: db.bets });
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
