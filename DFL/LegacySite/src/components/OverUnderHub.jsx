import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Save, Award, Users, AlertCircle, Sparkles } from 'lucide-react';

export default function OverUnderHub({ franchises, lines, predictions, currentUser, onOpenLogin, onSavePredictions }) {
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
          {/* Win Totals Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lines.map((lineItem) => {
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
                        className="w-11 h-11 rounded-xl border border-slate-700 object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-bold text-sm text-white">{lineItem.teamName}</h3>
                          <span className="text-[11px] text-slate-400">({lineItem.manager})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{lineItem.rationale}</p>
                      </div>
                    </div>

                    {/* Win total line badge */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-black block">Line</span>
                      <span className="font-mono font-black text-xl text-amber-400">{lineItem.line} Wins</span>
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
                      <span>OVER {lineItem.line}</span>
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
                      <span>UNDER {lineItem.line}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 overflow-x-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold font-display tracking-wide uppercase text-white">
              LEAGUE-WIDE CONSENSUS BOARD
            </h2>
            <p className="text-xs text-slate-400">Compare every manager's win-total picks side-by-side</p>
          </div>

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

          {/* Award Picks Summary */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase text-slate-300">Championship & Sacko Forecasts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(predictions).map(([fKey, pred]) => {
                if (!pred.awards?.champion && !pred.awards?.toiletBowl) return null;
                const m = franchises[fKey];
                return (
                  <div key={fKey} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-white block">{m?.name} predicts:</span>
                    {pred.awards.champion && (
                      <p className="text-amber-300 text-[11px]">
                        🏆 Champ: <strong>{franchises[pred.awards.champion]?.name || pred.awards.champion}</strong>
                      </p>
                    )}
                    {pred.awards.toiletBowl && (
                      <p className="text-slate-400 text-[11px]">
                        🚽 Sacko: <strong>{franchises[pred.awards.toiletBowl]?.name || pred.awards.toiletBowl}</strong>
                      </p>
                    )}
                    {pred.awards.boldPrediction && (
                      <p className="text-cyan-300 text-[11px] italic">"{pred.awards.boldPrediction}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
