import React, { useState, useEffect } from 'react';
import { X, Users, Sparkles, Shield, Award, Calendar, ChevronRight, Hash, Activity } from 'lucide-react';
import rostersData from '../data/league_rosters_and_picks.json';

const POS_COLORS = {
  QB: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  RB: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  WR: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  TE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  K: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  DL: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  LB: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  DB: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  FLEX: 'bg-slate-700/60 text-slate-300 border-slate-600',
  SUPER_FLEX: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  IDP_FLEX: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

export default function RosterModal({ franchiseKey, franchiseInfo, onClose }) {
  const [activeTab, setActiveTab] = useState('starters'); // 'starters' | 'bench' | 'picks'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!franchiseKey) return null;

  const roster = rostersData?.franchises?.[franchiseKey];
  const starters = roster?.starters || [];
  const bench = roster?.bench || [];
  const taxi = roster?.taxi || [];
  const draftPicks = roster?.draftPicks || [];

  const round1Picks = draftPicks.filter(p => p.round === 1);

  // Group draft picks by season
  const picksBySeason = draftPicks.reduce((acc, p) => {
    if (!acc[p.season]) acc[p.season] = [];
    acc[p.season].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={franchiseInfo?.customLogoUrl || franchiseInfo?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
              alt={franchiseInfo?.teamName || roster?.teamName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-slate-700 object-cover shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide">
                  {franchiseInfo?.teamName || roster?.teamName}
                </h2>
                {franchiseInfo?.role === 'Commissioner' && (
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 font-extrabold px-2 py-0.5 rounded-full border border-cyan-800">
                    COMMISH
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Manager: <span className="text-slate-200 font-semibold">{franchiseInfo?.name || franchiseKey}</span> (@{franchiseInfo?.username || franchiseKey})
              </p>
              
              {/* Quick stats badges */}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                  {roster?.totalPlayers || starters.length + bench.length} Players
                </span>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md font-mono font-bold">
                  {draftPicks.length} Future Picks
                </span>
                {round1Picks.length > 0 && (
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md font-mono font-bold">
                    {round1Picks.length}x 1st Rounders
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-start sm:self-center p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('starters')}
            className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'starters'
                ? 'border-amber-400 text-amber-400 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Starting Lineup ({starters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bench')}
            className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'bench'
                ? 'border-amber-400 text-amber-400 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bench & Taxi ({bench.length + taxi.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('picks')}
            className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'picks'
                ? 'border-amber-400 text-amber-400 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Draft Capital ({draftPicks.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* TAB 1: Starting Lineup */}
          {activeTab === 'starters' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {starters.map((p, idx) => (
                  <div
                    key={`${p.playerId}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase font-mono border min-w-[42px] text-center ${POS_COLORS[p.slot] || POS_COLORS.FLEX}`}>
                        {p.slot}
                      </span>
                      <img
                        src={p.headshotUrl}
                        onError={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'; }}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center space-x-1.5">
                          <span>{p.name}</span>
                          {p.number && <span className="text-[10px] text-slate-500 font-mono">#{p.number}</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span className="font-semibold text-slate-300">{p.nflTeam || 'FA'}</span>
                          <span>•</span>
                          <span>{p.position}</span>
                          {p.age && <span>• Age {p.age}</span>}
                        </div>
                      </div>
                    </div>

                    {p.status && p.status !== 'Active' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                        {p.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Bench & Taxi Squad */}
          {activeTab === 'bench' && (
            <div className="space-y-6">
              {/* Bench */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Active Bench ({bench.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {bench.map((p, idx) => (
                    <div
                      key={`${p.playerId}-${idx}`}
                      className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                    >
                      <img
                        src={p.headshotUrl}
                        onError={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'; }}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="text-xs font-bold text-white truncate">{p.name}</span>
                            {p.isIR && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase font-mono">
                                IR
                              </span>
                            )}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black font-mono border ${POS_COLORS[p.position] || POS_COLORS.FLEX}`}>
                            {p.position}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <span className="text-slate-300 font-semibold">{p.nflTeam || 'FA'}</span>
                          {p.age && <span>• Age {p.age}</span>}
                          {p.yearsExp > 0 ? <span>• {p.yearsExp}y exp</span> : <span>• R</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxi Squad (if any) */}
              {taxi.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Taxi Squad ({taxi.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {taxi.map((p, idx) => (
                      <div
                        key={`${p.playerId}-taxi-${idx}`}
                        className="flex items-center space-x-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/30"
                      >
                        <img
                          src={p.headshotUrl}
                          onError={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'; }}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg bg-slate-800 border border-amber-500/40 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">{p.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black font-mono border ${POS_COLORS[p.position] || POS_COLORS.FLEX}`}>
                              {p.position}
                            </span>
                          </div>
                          <div className="text-[10px] text-amber-300/80 mt-0.5">
                            {p.nflTeam} • Rookie / Devy
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Draft Capital (Future Picks) */}
          {activeTab === 'picks' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold text-amber-300">Draft Asset Overview: </span>
                  <span>{franchiseInfo?.teamName} holds {draftPicks.length} future draft picks across the next 3 rookie drafts (2027–2029).</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-mono font-black text-xs">
                    {round1Picks.length} First-Rounders
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {['2027', '2028', '2029'].map(season => {
                  const sPicks = picksBySeason[season] || [];
                  return (
                    <div key={season} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <h4 className="font-display font-black text-sm text-white">{season} Rookie Draft Picks</h4>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{sPicks.length} Picks</span>
                      </div>

                      {sPicks.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">No picks held in {season} rookie draft.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {sPicks.map((p, idx) => {
                            const isOwnPick = p.originalFranchiseKey === franchiseKey;
                            const isRound1 = p.round === 1;

                            return (
                              <div
                                key={`${season}-${p.round}-${idx}`}
                                className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                                  isRound1
                                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                                    : 'bg-slate-950/80 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-black font-mono uppercase ${isRound1 ? 'text-amber-400' : 'text-slate-200'}`}>
                                    Round {p.round}
                                  </span>
                                  {isRound1 && <span className="text-xs">⭐</span>}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {isOwnPick ? (
                                    <span className="text-emerald-400 font-semibold">Original Own Pick</span>
                                  ) : (
                                    <span>via <strong className="text-slate-300">{p.originalTeamName}</strong></span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Synced with Sleeper Dynasty API</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition border border-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
