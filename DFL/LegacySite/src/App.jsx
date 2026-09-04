import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HallOfChampions from './components/HallOfChampions';
import Leaderboard from './components/Leaderboard';
import RivalryMatrix from './components/RivalryMatrix';
import OverUnderHub from './components/OverUnderHub';
import BettingLedger from './components/BettingLedger';
import ManagerDossiers from './components/ManagerDossiers';
import LoginModal from './components/LoginModal';
import LogoCustomizer from './components/LogoCustomizer';
import masterData from './data/dfl_master_data.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('champions');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);

  // Dynamic server state
  const [franchises, setFranchises] = useState(masterData.franchises);
  const [lines, setLines] = useState([
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
  ]);
  const [predictions, setPredictions] = useState({});
  const [bets, setBets] = useState([]);

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

  const handleAcceptBet = async (betId, franchiseKey) => {
    try {
      const res = await fetch('/api/bets/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, franchiseKey }),
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
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between">
      <div>
        {/* Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onOpenBranding={() => setIsBrandingOpen(true)}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {activeTab === 'champions' && (
            <HallOfChampions
              champions={masterData.champions}
              seasons={masterData.seasons}
              franchises={franchises}
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
            />
          )}

          {activeTab === 'managers' && (
            <ManagerDossiers
              franchises={franchises}
              currentUser={currentUser}
              onOpenBranding={() => setIsBrandingOpen(true)}
              onOpenLogin={() => setIsLoginOpen(true)}
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
          Commissioned by Dom (<span className="text-cyan-400 font-semibold">Rhymenoceros</span>) • Powered by Sleeper Public API
        </p>
        <p className="text-[11px] text-slate-600">
          Built for the degenerates of DFL • Zero tokens billed • 100% Free
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
      />
    </div>
  );
}
