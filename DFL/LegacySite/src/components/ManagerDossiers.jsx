import React, { useState } from 'react';
import { Users, Palette, Trophy, Shield, Sparkles, Check, TrendingUp, KeyRound, Calendar, ChevronRight } from 'lucide-react';
import RosterModal from './RosterModal';
import rostersData from '../data/league_rosters_and_picks.json';

const FRANCHISE_ACCOLADES = {
  Rhymenoceros: [
    { icon: '👑', label: 'DFL Commissioner', desc: 'League Architect & Chief Trade Officer', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
    { icon: '📈', label: 'Steady Climb', desc: 'Rose from #10 in 2022 to #5 in 2025', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
    { icon: '🤝', label: 'Market Maker', desc: '"Don\'t smoke and trade, kids"', color: 'border-slate-700 bg-slate-800/60 text-slate-300' },
  ],
  PoppinChunkies: [
    { icon: '🏆', label: '2023 DFL Champion', desc: 'Undefeated Powerhouse Title', color: 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-glow-gold' },
    { icon: '🐐', label: '14-0 Undefeated Reg Season', desc: 'Historic 2023 zero-loss regular season', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { icon: '⚡', label: 'All-Time Win King', desc: '44-12 career record (.786)', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
    { icon: '💥', label: 'Single-Game Scoring Record', desc: '257.21 pts in Week 16, 2022', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
  ],
  MattyiceR: [
    { icon: '🏆', label: '2025 Reigning Champion', desc: 'Defending DFL Title Holder', color: 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-glow-gold' },
    { icon: '⚔️', label: 'Heavyweight Anchor', desc: '33-23 All-Time (.589)', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
    { icon: '🔥', label: 'Century Explosion', desc: '239.26 pt nuclear game (2024)', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
  ],
  JayZone13: [
    { icon: '🏆', label: '2024 DFL Champion', desc: 'Legendary Cinderella Underdog Run', color: 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-glow-gold' },
    { icon: '🎯', label: 'Clutch Elimination King', desc: 'Ran the playoff gauntlet to glory', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
  ],
  LMcVicker: [
    { icon: '🏆', label: '2022 Inaugural Champion', desc: 'Team Pupinsuds • In Loving Memory of Tre', color: 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-glow-gold' },
    { icon: '🥈', label: 'All-Time #2 Score', desc: '256.73 pts in Week 8, 2022', color: 'border-pink-500/40 bg-pink-500/10 text-pink-300' },
    { icon: '🧀', label: 'Pupinsuds Legacy', desc: 'Inherited franchise standard of excellence', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
  ],
  doesntfleeze: [
    { icon: '🥊', label: 'Tier 1 Contender', desc: 'Consensus 9.5 Win Line Pace Setter', color: 'border-red-500/40 bg-red-500/10 text-red-300' },
    { icon: '🛡️', label: 'Postseason Fixture', desc: 'Perennial playoff contender', color: 'border-slate-700 bg-slate-800/60 text-slate-300' },
  ],
  MaffuJames: [
    { icon: '🔄', label: 'Trade Machine Maestro', desc: 'Most active negotiator in DFL history', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { icon: '🚀', label: 'High-Upside Roster', desc: 'Tier 1 Challenger at 8.5 Win Line', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
  ],
  DukeofWales: [
    { icon: '💎', label: 'Youth Stockpile', desc: 'Loaded with top-tier young dynamos', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
    { icon: '🎯', label: 'Dangerous Underdog', desc: 'Capable of taking down any heavyweight', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  ],
  SamBaugh: [
    { icon: '⚡', label: 'Dual-MVP Arsenal', desc: 'Mahomes, Hurts & Amon-Ra core', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' },
    { icon: '💣', label: 'Explosive Ceiling', desc: 'Highest single-game ceiling in Tier 3', color: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
  ],
  Tklumb86: [
    { icon: '👑', label: 'New Era Architect', desc: 'Tony taking the reins for 2026', color: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
    { icon: '📦', label: 'Draft Capital Vault', desc: 'Stockpile of future picks for dynasty build', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  ],
};

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

                {/* Career Accolades & Badges Cabinet */}
                {FRANCHISE_ACCOLADES[key] && (
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Career Accolades & Badges
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {FRANCHISE_ACCOLADES[key].map((badge, bIdx) => (
                        <div
                          key={bIdx}
                          title={badge.desc}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${badge.color} transition hover:scale-105 cursor-default`}
                        >
                          <span className="text-xs flex-shrink-0">{badge.icon}</span>
                          <span className="leading-tight">{badge.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
