import React, { useState } from 'react';
import { Users, Palette, Trophy, Shield, Sparkles, Check, TrendingUp, KeyRound, Calendar, ChevronRight } from 'lucide-react';
import RosterModal from './RosterModal';
import rostersData from '../data/league_rosters_and_picks.json';

export default function ManagerDossiers({ franchises, currentUser, onOpenBranding, onOpenLogin, onOpenChangePin }) {
  const [selectedRosterKey, setSelectedRosterKey] = useState(null);
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>The 10 Franchises</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            FRANCHISE DOSSIERS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manager histories, custom team branding, career accolades, and yearly records
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenChangePin}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs px-3 py-2.5 rounded-xl transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change PIN</span>
            </button>
            <button
              onClick={onOpenBranding}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Customize My Team Logo</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of Manager Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(franchises).map(([key, f]) => {
          const isCurrentUser = currentUser?.franchiseKey === key;
          const isCommish = f.role === 'Commissioner';
          const isChamp = f.allTime.championships > 0;

          return (
            <div
              key={key}
              className={`glass-panel p-6 rounded-3xl border transition duration-200 flex flex-col justify-between ${
                isCurrentUser
                  ? 'border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-glow-cyan'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Avatar & Name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="relative">
                      <img
                        src={f.customLogoUrl || f.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={f.name}
                        className="w-16 h-16 rounded-2xl border-2 border-slate-700 object-cover shadow-md"
                      />
                      {isChamp && (
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-[11px] shadow-sm">
                          🏆
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-black font-display text-white leading-tight tracking-wide">{f.teamName}</h3>
                        {isCommish && (
                          <span className="text-[9px] bg-cyan-950 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-800">
                            COMMISH
                          </span>
                        )}
                        {key === 'MattyiceR' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40">
                            2025 CHAMP
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-cyan-400 mt-0.5">
                        Manager: {f.name} <span className="text-slate-500 font-normal">(@{f.username})</span>
                      </p>
                    </div>
                  </div>

                  {/* Edit Logo & Change PIN buttons */}
                  {isCurrentUser ? (
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={onOpenChangePin}
                        title="Change Security PIN"
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition flex items-center space-x-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>PIN</span>
                      </button>
                      <button
                        onClick={onOpenBranding}
                        className="px-2.5 py-1 text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition flex items-center space-x-1"
                      >
                        <Palette className="w-3 h-3" />
                        <span>Edit Logo</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-400 leading-relaxed">{f.bio}</p>

                {/* Franchise Lineage Note for Succession Teams */}
                {key === 'Tklumb86' && (
                  <div className="p-3 rounded-2xl bg-orange-950/25 border border-orange-500/40 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-orange-400 font-bold text-[11px]">
                      <span>👑 Franchise Lineage & Transition</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      <strong className="text-white">Jake (Abusement Park):</strong> 2022–2025 (Waiver wizard, stepped down)
                    </p>
                    <p className="text-slate-300 text-[11px]">
                      <strong className="text-orange-400">Tony (Who Dey):</strong> 2026–Present (Took over franchise in 2026)
                    </p>
                  </div>
                )}

                {key === 'LMcVicker' && (
                  <div className="p-3 rounded-2xl bg-purple-950/25 border border-purple-500/40 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-purple-300 font-bold text-[11px]">
                      <span>👑 Franchise Lineage & Transition</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      <strong className="text-white">Tre (Team Pupinsuds):</strong> 2022 Inaugural Champion (In Loving Memory)
                    </p>
                    <p className="text-slate-300 text-[11px]">
                      <strong className="text-pink-400">Lauren (Laces Out, Ladies):</strong> 2023–Present (Took over franchise in 2023)
                    </p>
                  </div>
                )}

                {/* All-Time Stat Chips */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Record</span>
                    <span className="font-mono font-bold text-white">{f.allTime.wins}-{f.allTime.losses}</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Win %</span>
                    <span className="font-mono font-bold text-emerald-400">{(f.allTime.winPct * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Total PF</span>
                    <span className="font-mono font-bold text-cyan-400">{Math.round(f.allTime.pointsFor).toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Titles</span>
                    <span className="font-mono font-bold text-amber-400">{f.allTime.championships}</span>
                  </div>
                </div>

                {/* Yearly Finish History */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
                    Yearly Regular Season Finishes
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {Object.entries(f.yearlyFinishes || {}).map(([yr, stat]) => (
                      <span
                        key={yr}
                        className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-[11px]"
                      >
                        <strong>{yr}:</strong> #{stat.rank} ({stat.wins}-{stat.losses})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Roster & Draft Capital Action Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Draft Capital:</span>
                    <span className="text-xs font-mono text-amber-400 font-black">
                      {rostersData?.franchises?.[key]?.draftPicks?.length || 0} Picks
                    </span>
                    {(rostersData?.franchises?.[key]?.draftPicks?.filter(p => p.round === 1).length || 0) > 0 && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                        {rostersData?.franchises?.[key]?.draftPicks?.filter(p => p.round === 1).length}x 1st Rd
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedRosterKey(key)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700/80 hover:border-cyan-400/60 transition flex items-center space-x-1.5 shadow-sm group"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-400 group-hover:text-amber-400 transition" />
                    <span>View Roster & Picks</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
