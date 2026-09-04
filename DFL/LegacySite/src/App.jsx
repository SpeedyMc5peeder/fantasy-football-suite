import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HallOfChampions from './components/HallOfChampions';
import Leaderboard from './components/Leaderboard';
import RivalryMatrix from './components/RivalryMatrix';
import OverUnderHub from './components/OverUnderHub';
import BettingLedger from './components/BettingLedger';
import ManagerDossiers from './components/ManagerDossiers';
import DynastyEmpirePot from './components/DynastyEmpirePot';
import LoginModal from './components/LoginModal';
import LogoCustomizer from './components/LogoCustomizer';
import ChangePinModal from './components/ChangePinModal';
import masterData from './data/dfl_master_data.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('champions');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // Dynamic server state
  const [franchises, setFranchises] = useState(masterData.franchises);
  const [lines, setLines] = useState([
    { teamKey: 'doesntfleeze', teamName: 'Washed🫩', manager: 'Trent', line: 9.5, tier: 'TIER 1: The Heavyweight Title Contenders', rationale: 'Heavyweight Title Contender setting the pace at 9.5 wins' },
    { teamKey: 'MattyiceR', teamName: "Heisenberg's Hitmen", manager: 'Matt', line: 8.5, tier: 'TIER 1: The Heavyweight Title Contenders', rationale: 'Reigning 2025 champion returning with veteran grit at 8.5 wins' },
    { teamKey: 'MaffuJames', teamName: "I don't Gibbs a Shough", manager: 'Matt James', line: 8.5, tier: 'TIER 1: The Heavyweight Title Contenders', rationale: 'Active trade maestro looking to break into the top tier at 8.5 wins' },
    { teamKey: 'Rhymenoceros', teamName: "Scott's Totts", manager: 'Dom', line: 7.5, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'The Commish leading the dangerous middle class at 7.5 wins' },
    { teamKey: 'PoppinChunkies', teamName: "Poppin' Chunkies", manager: 'Tyler', line: 7.0, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'Perennial powerhouse with a 7.0 win line' },
    { teamKey: 'LMcVicker', teamName: 'Laces Out, Ladies', manager: 'Lauren', line: 6.5, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'Inherited Tre legacy franchise, solid playoff contender at 6.5 wins' },
    { teamKey: 'DukeofWales', teamName: 'Hands for Jobs', manager: 'David', line: 6.5, tier: 'TIER 2: The Dangerous Middle Class', rationale: 'Underdog looking to capitalize on high-upside young talent at 6.5 wins' },
    { teamKey: 'SamBaugh', teamName: "Dude, Where's Lamar?", manager: 'Sam', line: 6.0, tier: 'TIER 3: The Cellar Dwellers & Rebuild Trench', rationale: 'Loaded roster with Amon-Ra, Mahomes, and Hurts aiming to beat the 6.0 win line' },
    { teamKey: 'Tklumb86', teamName: 'Who Dey', manager: 'Tony', line: 5.5, tier: 'TIER 3: The Cellar Dwellers & Rebuild Trench', rationale: 'New regime after Jake exit; stockpile of picks and depth at 5.5 wins' },
    { teamKey: 'JayZone13', teamName: 'Ronin', manager: 'Jason', line: 5.0, tier: 'TIER 3: The Cellar Dwellers & Rebuild Trench', rationale: '2024 champion with big upside looking to shatter the 5.0 win line' },
  ]);
  const [predictions, setPredictions] = useState({});
  const [bets, setBets] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dfl_theme') || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('dfl_theme', next);
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  // Load saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dfl_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  // Fetch dynamic state from backend API
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.overUnderLines) setLines(data.overUnderLines);
        if (data.predictions) setPredictions(data.predictions);
        if (data.bets) setBets(data.bets);

        // Merge custom logos/slogans into franchises
        if (data.customProfiles) {
          setFranchises(prev => {
            const updated = { ...prev };
            for (const [key, profile] of Object.entries(data.customProfiles)) {
              if (updated[key]) {
                updated[key] = {
                  ...updated[key],
                  customLogoUrl: profile.customLogoUrl || updated[key].customLogoUrl,
                  slogan: profile.slogan !== undefined ? profile.slogan : updated[key].slogan,
                };
              }
            }
            return updated;
          });
        }
      }
    } catch (err) {
      // Backend not running yet or offline
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('dfl_user', JSON.stringify(user));
    fetchState();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dfl_user');
  };

  // API Callbacks
  const handleSavePredictions = async (franchiseKey, picks, awards) => {
    setPredictions(prev => ({
      ...prev,
      [franchiseKey]: { picks, awards, updatedAt: new Date().toISOString() },
    }));

    try {
      await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchiseKey, picks, awards }),
      });
      fetchState();
    } catch (e) {}
  };

  const handleCreateBet = async (betPayload) => {
    try {
      const res = await fetch('/api/bets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(betPayload),
      });
      const data = await res.json();
      if (data.bets) setBets(data.bets);
    } catch (e) {}
  };

  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncSleeper = async () => {
    if (!currentUser || (!currentUser.isCommissioner && currentUser.franchiseKey !== 'Rhymenoceros')) {
      alert('Access Restricted: Only the Commissioner (Dom) can trigger a manual Sleeper sync.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/sleeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterFranchise: currentUser.franchiseKey }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data.lastSyncInfo);
        // Refresh state
        fetchState();
        alert('✅ Sleeper data successfully synced! Rosters, scores, and standings are fresh.');
      } else {
        alert('❌ Sleeper sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('❌ Sleeper sync error: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAcceptBet = async (betId, franchiseKey, chosenSide) => {
    try {
      const res = await fetch('/api/bets/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, franchiseKey, chosenSide }),
      });
      const data = await res.json();
      if (data.bets) setBets(data.bets);
    } catch (e) {}
  };

  const handleSettleBet = async (betId, winner, settlerFranchise) => {
    try {
      const res = await fetch('/api/bets/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, winner, settlerFranchise }),
      });
      const data = await res.json();
      if (data.bets) setBets(data.bets);
    } catch (e) {}
  };

  const handleUpdateBet = async (updatePayload) => {
    try {
      const res = await fetch('/api/bets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (data.bets) setBets(data.bets);
    } catch (e) {}
  };

  const handleDeleteBet = async (betId, requesterFranchise) => {
    try {
      const res = await fetch('/api/bets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, requesterFranchise }),
      });
      const data = await res.json();
      if (data.bets) setBets(data.bets);
    } catch (e) {}
  };

  const handleSaveProfile = async (franchiseKey, profileData) => {
    setFranchises(prev => ({
      ...prev,
      [franchiseKey]: {
        ...prev[franchiseKey],
        ...profileData,
      },
    }));

    if (currentUser && currentUser.franchiseKey === franchiseKey) {
      const updatedUser = { ...currentUser, ...profileData };
      setCurrentUser(updatedUser);
      localStorage.setItem('dfl_user', JSON.stringify(updatedUser));
    }

    try {
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchiseKey, ...profileData }),
      });
      fetchState();
    } catch (e) {}
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'theme-light bg-[#f8fafc] text-slate-900' : 'bg-[#0a0d14] text-slate-100'} flex flex-col justify-between transition-colors duration-200`}>
      <div>
        {/* Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onOpenBranding={() => setIsBrandingOpen(true)}
          onOpenChangePin={() => setIsChangePinOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSyncSleeper={handleSyncSleeper}
          isSyncing={isSyncing}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {activeTab === 'champions' && (
            <HallOfChampions
              champions={masterData.champions}
              seasons={masterData.seasons}
              franchises={franchises}
              theme={theme}
            />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard
              franchises={franchises}
              records={masterData.records}
            />
          )}

          {activeTab === 'rivalry' && (
            <RivalryMatrix
              franchises={franchises}
              rivalries={masterData.rivalries}
            />
          )}

          {activeTab === 'dynastypot' && (
            <DynastyEmpirePot
              franchises={franchises}
              seasons={masterData.seasons}
            />
          )}

          {activeTab === 'predictions' && (
            <OverUnderHub
              franchises={franchises}
              lines={lines}
              predictions={predictions}
              currentUser={currentUser}
              onOpenLogin={() => setIsLoginOpen(true)}
              onSavePredictions={handleSavePredictions}
            />
          )}

          {activeTab === 'betting' && (
            <BettingLedger
              bets={bets}
              franchises={franchises}
              currentUser={currentUser}
              onOpenLogin={() => setIsLoginOpen(true)}
              onCreateBet={handleCreateBet}
              onAcceptBet={handleAcceptBet}
              onSettleBet={handleSettleBet}
              onUpdateBet={handleUpdateBet}
              onDeleteBet={handleDeleteBet}
            />
          )}

          {activeTab === 'managers' && (
            <ManagerDossiers
              franchises={franchises}
              currentUser={currentUser}
              onOpenBranding={() => setIsBrandingOpen(true)}
              onOpenLogin={() => setIsLoginOpen(true)}
              onOpenChangePin={() => setIsChangePinOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080b11] py-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-display font-bold tracking-wider text-slate-400 text-sm">
          DYNASTY FOOTBALL LEAGUE • EST. 2022
        </p>
        <p>
          Commissioned by Dom (<span className="text-cyan-400 font-semibold">Rhymenoceros</span>) • Data from Sleeper API
        </p>
        <p className="text-[11px] text-slate-500">
          Built for the degenerates of DFL • Powered by cannabis, caffeine, and sending 2 AM trade offers
        </p>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        franchises={franchises}
        onLoginSuccess={handleLoginSuccess}
      />

      <LogoCustomizer
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onOpenChangePin={() => setIsChangePinOpen(true)}
      />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
