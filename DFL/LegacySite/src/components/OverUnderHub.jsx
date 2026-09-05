import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Save, Award, Users, AlertCircle, Sparkles, ExternalLink, Clock } from 'lucide-react';
import RosterModal from './RosterModal';

export default function OverUnderHub({ franchises, lines, predictions, currentUser, onOpenLogin, onSavePredictions }) {
  const [selectedRosterKey, setSelectedRosterKey] = useState(null);
  const [picks, setPicks] = useState({});
  const [awards, setAwards] = useState({
    champion: '',
    runnerUp: '',
    toiletBowl: '',
    pointsChamp: '',
    boldPrediction: '',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('ballot'); // 'ballot' or 'consensus'
  const [mobileConsensusMode, setMobileConsensusMode] = useState('cards'); // 'cards' | 'grid'
  const [expandedConsensusTeam, setExpandedConsensusTeam] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: false });

  // Live countdown to 2026 season kickoff (Thursday, September 10, 2026, 7:15 PM CST)
  useEffect(() => {
    const kickoffTime = new Date('2026-09-10T19:15:00-05:00').getTime();
    const updateTimer = () => {
      const now = Date.now();
      const diff = kickoffTime - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isPassed: false,
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync state with current user's existing saved predictions
  useEffect(() => {
    if (currentUser && predictions[currentUser.franchiseKey]) {
      const userPreds = predictions[currentUser.franchiseKey];
      setPicks(userPreds.picks || {});
      setAwards(userPreds.awards || {
        champion: '',
        runnerUp: '',
        toiletBowl: '',
        pointsChamp: '',
        boldPrediction: '',
      });
    }
  }, [currentUser, predictions]);

  const handlePick = (teamKey, choice) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setPicks(prev => ({
      ...prev,
      [teamKey]: choice,
    }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    await onSavePredictions(currentUser.franchiseKey, picks, awards);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const totalLines = lines.length;
  const pickedCount = Object.keys(picks).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>2026 Season Stakes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            OVER / UNDER & PREDICTIONS HUB
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Lock in your win-total picks for all 10 franchises and stake your championship predictions
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('ballot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'ballot'
                ? 'bg-cyan-500 text-black shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>My Pick Ballot</span>
            {pickedCount > 0 && (
              <span className="bg-slate-950/40 text-black px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {pickedCount}/{totalLines}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('consensus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeSubTab === 'consensus'
                ? 'bg-cyan-500 text-black shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>League Consensus Grid</span>
          </button>
        </div>
      </div>

      {/* Live Kickoff Countdown Ticker */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 shadow-glow-cyan flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-left w-full md:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-inner">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-400">
                Official 2026 Season Kickoff
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white font-display tracking-wide">
              {timeLeft.isPassed ? '🔥 2026 SEASON IS LIVE! PICKS ARE LOCKED!' : 'Lock in your Over/Unders before Thursday Night kickoff!'}
            </h3>
          </div>
        </div>

        {/* Countdown Timer Blocks */}
        {!timeLeft.isPassed ? (
          <div className="flex items-center space-x-2 sm:space-x-3 text-center font-mono">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[52px] sm:min-w-[62px] shadow-sm">
              <span className="text-base sm:text-2xl font-black text-white block leading-tight">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 uppercase block tracking-wider">Days</span>
            </div>
            <span className="text-cyan-400 font-black text-base sm:text-lg">:</span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[52px] sm:min-w-[62px] shadow-sm">
              <span className="text-base sm:text-2xl font-black text-white block leading-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 uppercase block tracking-wider">Hours</span>
            </div>
            <span className="text-cyan-400 font-black text-base sm:text-lg">:</span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[52px] sm:min-w-[62px] shadow-sm">
              <span className="text-base sm:text-2xl font-black text-cyan-400 block leading-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 uppercase block tracking-wider">Mins</span>
            </div>
            <span className="text-cyan-400 font-black text-base sm:text-lg">:</span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[52px] sm:min-w-[62px] shadow-sm">
              <span className="text-base sm:text-2xl font-black text-amber-400 block leading-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 uppercase block tracking-wider">Secs</span>
            </div>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs font-mono border border-rose-500/40">
            LOCKED AT KICKOFF
          </div>
        )}
      </div>

      {/* User Login Warning if Guest */}
      {!currentUser && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-300 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>You are currently browsing as a guest. Sign in with your manager PIN to save your choices.</span>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition"
          >
            Log In Now
          </button>
        </div>
      )}

      {/* SUB-TAB 1: BALLOT */}
      {activeSubTab === 'ballot' && (
        <div className="space-y-8">
          {[
            {
              name: 'TIER 1: The Heavyweight Title Contenders',
              badge: '👑 Tier 1: The Heavyweight Title Contenders',
              style: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
              keys: ['doesntfleeze', 'MattyiceR', 'MaffuJames'],
            },
            {
              name: 'TIER 2: The Dangerous Middle Class',
              badge: '⚔️ Tier 2: The Dangerous Middle Class',
              style: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
              keys: ['Rhymenoceros', 'PoppinChunkies', 'LMcVicker', 'DukeofWales'],
            },
            {
              name: 'TIER 3: The Cellar Dwellers & Rebuild Trench',
              badge: '🕳️ Tier 3: The Cellar Dwellers & Rebuild Trench',
              style: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
              keys: ['SamBaugh', 'Tklumb86', 'JayZone13'],
            },
          ].map((tier) => {
            const tierLines = lines.filter(l => tier.keys.includes(l.teamKey));
            if (tierLines.length === 0) return null;

            return (
              <div key={tier.name} className="space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${tier.style}`}>
                    {tier.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tierLines.map((lineItem) => {
                    const f = franchises[lineItem.teamKey];
                    const currentPick = picks[lineItem.teamKey];

                    return (
                      <div
                        key={lineItem.teamKey}
                        className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={f?.customLogoUrl || f?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                              alt={lineItem.manager}
                              onClick={() => setSelectedRosterKey(lineItem.teamKey)}
                              className="w-11 h-11 rounded-xl border border-slate-700 object-cover cursor-pointer hover:border-cyan-400 transition"
                            />
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h3
                                  onClick={() => setSelectedRosterKey(lineItem.teamKey)}
                                  className="font-bold text-sm text-white hover:text-cyan-400 cursor-pointer transition flex items-center space-x-1"
                                >
                                  <span>{lineItem.teamName}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-500 inline opacity-70" />
                                </h3>
                                <span className="text-[11px] text-slate-400">({lineItem.manager})</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{lineItem.rationale}</p>
                              <button
                                type="button"
                                onClick={() => setSelectedRosterKey(lineItem.teamKey)}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 mt-1 transition"
                              >
                                <Users className="w-3 h-3" />
                                <span>Scout Roster & Picks</span>
                              </button>
                            </div>
                          </div>

                          {/* Win total line badge */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-black block">Line</span>
                            <span className="font-mono font-black text-xl text-amber-400">
                              {Number(lineItem.line).toFixed(1)} Wins
                            </span>
                          </div>
                        </div>

                        {/* Pick Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handlePick(lineItem.teamKey, 'OVER')}
                            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                              currentPick === 'OVER'
                                ? 'bg-emerald-500 text-black shadow-md font-black ring-2 ring-emerald-300'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            <span>OVER {Number(lineItem.line).toFixed(1)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePick(lineItem.teamKey, 'UNDER')}
                            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                              currentPick === 'UNDER'
                                ? 'bg-rose-500 text-white shadow-md font-black ring-2 ring-rose-300'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            <span>UNDER {Number(lineItem.line).toFixed(1)}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Season Awards Ballot */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center space-x-2 text-amber-400">
              <Award className="w-5 h-5" />
              <h2 className="text-xl font-bold font-display tracking-wide uppercase text-white">
                2026 Season Superlative Ballot
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Champion Pick */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  🏆 Champion Prediction
                </label>
                <select
                  value={awards.champion}
                  onChange={(e) => setAwards({ ...awards, champion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="">Select Champion...</option>
                  {Object.entries(franchises).map(([k, f]) => (
                    <option key={k} value={k}>{f.name} ({f.teamName})</option>
                  ))}
                </select>
              </div>

              {/* Runner-Up */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  🥈 Runner-Up Pick
                </label>
                <select
                  value={awards.runnerUp}
                  onChange={(e) => setAwards({ ...awards, runnerUp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="">Select Runner-Up...</option>
                  {Object.entries(franchises).map(([k, f]) => (
                    <option key={k} value={k}>{f.name} ({f.teamName})</option>
                  ))}
                </select>
              </div>

              {/* Toilet Bowl / Sacko */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  🚽 Toilet Bowl / Sacko
                </label>
                <select
                  value={awards.toiletBowl}
                  onChange={(e) => setAwards({ ...awards, toiletBowl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="">Select Last Place...</option>
                  {Object.entries(franchises).map(([k, f]) => (
                    <option key={k} value={k}>{f.name} ({f.teamName})</option>
                  ))}
                </select>
              </div>

              {/* Regular Season Points Leader */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ⚡ Points Leader (PF)
                </label>
                <select
                  value={awards.pointsChamp}
                  onChange={(e) => setAwards({ ...awards, pointsChamp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="">Select Scoring Champ...</option>
                  {Object.entries(franchises).map(([k, f]) => (
                    <option key={k} value={k}>{f.name} ({f.teamName})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bold Prediction Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                🔥 Your Bold Season Prophecy
              </label>
              <input
                type="text"
                value={awards.boldPrediction}
                onChange={(e) => setAwards({ ...awards, boldPrediction: e.target.value })}
                placeholder="e.g., Tony trades his entire bench by Week 6 or DukeofWales makes playoffs from Manila"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Picks are saved to your franchise account and displayed on the league consensus board.
              </span>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold px-6 py-3 rounded-xl shadow-lg transition transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save All Predictions</span>
              </button>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Predictions saved successfully! Your picks are now recorded in the league consensus.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEAGUE CONSENSUS GRID */}
      {activeSubTab === 'consensus' && (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold font-display tracking-wide uppercase text-white">
                LEAGUE-WIDE CONSENSUS BOARD
              </h2>
              <p className="text-xs text-slate-400">Compare every manager's win-total picks side-by-side</p>
            </div>

            {/* Mobile View Switcher */}
            <div className="flex md:hidden items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold self-start">
              <button
                type="button"
                onClick={() => setMobileConsensusMode('cards')}
                className={`px-3 py-1 rounded-lg transition ${
                  mobileConsensusMode === 'cards' ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Summary Cards
              </button>
              <button
                type="button"
                onClick={() => setMobileConsensusMode('grid')}
                className={`px-3 py-1 rounded-lg transition ${
                  mobileConsensusMode === 'grid' ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                10-Manager Grid
              </button>
            </div>
          </div>

          {/* Mobile Consensus Cards (< md screens and mode === 'cards') */}
          {mobileConsensusMode === 'cards' && (
            <div className="block md:hidden space-y-3">
              {lines.map(lineItem => {
                const overManagers = [];
                const underManagers = [];

                Object.keys(franchises).forEach(fKey => {
                  const p = predictions[fKey]?.picks?.[lineItem.teamKey];
                  const m = franchises[fKey];
                  if (p === 'OVER') overManagers.push(m);
                  else if (p === 'UNDER') underManagers.push(m);
                });

                const totalDecided = overManagers.length + underManagers.length;
                const overPct = totalDecided > 0 ? Math.round((overManagers.length / totalDecided) * 100) : 50;
                const underPct = 100 - overPct;
                const isExpanded = expandedConsensusTeam === lineItem.teamKey;

                return (
                  <div
                    key={lineItem.teamKey}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-white block">{lineItem.teamName}</span>
                        <span className="text-[10px] text-slate-400">{lineItem.manager}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-amber-400">
                          {Number(lineItem.line).toFixed(1)} Wins
                        </span>
                      </div>
                    </div>

                    {/* Consensus Split Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold">
                        <span className="text-emerald-400">{overManagers.length} OVER ({totalDecided > 0 ? overPct : 0}%)</span>
                        <span className="text-rose-400">{underManagers.length} UNDER ({totalDecided > 0 ? underPct : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${totalDecided > 0 ? overPct : 50}%` }} />
                        <div className="bg-rose-500 h-full transition-all" style={{ width: `${totalDecided > 0 ? underPct : 50}%` }} />
                      </div>
                    </div>

                    {/* Expand/Collapse Breakdown */}
                    <button
                      type="button"
                      onClick={() => setExpandedConsensusTeam(isExpanded ? null : lineItem.teamKey)}
                      className="w-full pt-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-between border-t border-slate-800/80"
                    >
                      <span>{isExpanded ? 'Hide Manager Picks' : 'View Who Picked What'}</span>
                      <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-800 space-y-2 text-[11px] animate-fadeIn">
                        {overManagers.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                              Picked OVER ({overManagers.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {overManagers.map(m => (
                                <span key={m.franchiseKey || m.name} className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {underManagers.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                              Picked UNDER ({underManagers.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {underManagers.map(m => (
                                <span key={m.franchiseKey || m.name} className="px-2 py-0.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid Table: on desktop ALWAYS visible, on mobile only if mode === 'grid' */}
          <div className={`${mobileConsensusMode === 'grid' ? 'block' : 'hidden md:block'} overflow-x-auto`}>
            <div className="min-w-[800px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Team & Line</th>
                    {Object.keys(franchises).map(fKey => (
                      <th key={fKey} className="py-3 px-2 text-center truncate max-w-[80px]">
                        {franchises[fKey].name.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono font-bold">
                  {lines.map(lineItem => {
                    return (
                      <tr key={lineItem.teamKey} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 flex items-center space-x-2">
                          <span className="text-white font-bold">{lineItem.teamName}</span>
                          <span className="text-amber-400 text-[10px] font-black">({lineItem.line})</span>
                        </td>
                        {Object.keys(franchises).map(fKey => {
                          const userPick = predictions[fKey]?.picks?.[lineItem.teamKey];
                          return (
                            <td key={fKey} className="py-3 px-2 text-center">
                              {userPick === 'OVER' ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px]">
                                  OVER
                                </span>
                              ) : userPick === 'UNDER' ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px]">
                                  UNDER
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Award Picks Summary */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase text-slate-300">DFL Award & Trophy Forecasts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(predictions).map(([fKey, pred]) => {
                if (!pred.awards?.champion && !pred.awards?.runnerUp && !pred.awards?.toiletBowl && !pred.awards?.pointsChamp && !pred.awards?.boldPrediction) return null;
                const m = franchises[fKey];
                return (
                  <div key={fKey} className="forecast-card p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition shadow-sm">
                    <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-800/80">
                      <img
                        src={m?.customLogoUrl || m?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover border border-slate-700"
                      />
                      <span className="font-bold text-white truncate forecast-title">{m?.name || fKey} predicts:</span>
                    </div>

                    {pred.awards.champion && (
                      <p className="text-amber-300 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">🏆 Champion:</span>
                        <strong className="truncate max-w-[170px] text-right font-black">
                          {franchises[pred.awards.champion]?.teamName || franchises[pred.awards.champion]?.name || pred.awards.champion}
                        </strong>
                      </p>
                    )}

                    {pred.awards.runnerUp && (
                      <p className="text-slate-200 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">🥈 Runner-Up:</span>
                        <strong className="truncate max-w-[170px] text-right font-bold text-slate-200">
                          {franchises[pred.awards.runnerUp]?.teamName || franchises[pred.awards.runnerUp]?.name || pred.awards.runnerUp}
                        </strong>
                      </p>
                    )}

                    {pred.awards.pointsChamp && (
                      <p className="text-cyan-300 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">⚡ Scoring Champ:</span>
                        <strong className="truncate max-w-[170px] text-right font-bold text-cyan-300">
                          {franchises[pred.awards.pointsChamp]?.teamName || franchises[pred.awards.pointsChamp]?.name || pred.awards.pointsChamp}
                        </strong>
                      </p>
                    )}

                    {pred.awards.toiletBowl && (
                      <p className="text-rose-400 text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">🚽 Sacko (Last):</span>
                        <strong className="truncate max-w-[170px] text-right font-bold text-rose-300">
                          {franchises[pred.awards.toiletBowl]?.teamName || franchises[pred.awards.toiletBowl]?.name || pred.awards.toiletBowl}
                        </strong>
                      </p>
                    )}

                    {pred.awards.boldPrediction && (
                      <p className="text-teal-300 text-[11px] italic pt-1 border-t border-slate-800/60">
                        "{pred.awards.boldPrediction}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Roster & Draft Capital Modal */}
      {selectedRosterKey && (
        <RosterModal
          franchiseKey={selectedRosterKey}
          franchiseInfo={franchises[selectedRosterKey]}
          onClose={() => setSelectedRosterKey(null)}
        />
      )}
    </div>
  );
}
