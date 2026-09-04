import React, { useState } from 'react';
import { Trophy, Medal, Crown, Star, Sparkles, Heart, GitBranch, ChevronRight, Award } from 'lucide-react';

export default function HallOfChampions({ champions, seasons, franchises }) {
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [showMickeyBanter, setShowMickeyBanter] = useState(false);

  const activeSeasonData = seasons.find(s => s.year === selectedSeason);

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-amber-400">
          <Trophy className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Crown className="w-3.5 h-3.5" />
            <span>Pantheon of Greatness</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white mb-3">
            DFL HALL OF CHAMPIONS
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Four legendary championship banners hang in the DFL rafters. Explore the immortals, their paths to title glory, and the playoff brackets that crowned them.
          </p>
        </div>
      </div>

      {/* Championship Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {champions.map((champ) => {
          const f = franchises[champ.franchise];
          const isReigning = champ.year === '2025';
          const isTre = champ.year === '2022';
          const isUndefeated = champ.year === '2023';

          return (
            <div
              key={champ.year}
              className={`relative rounded-2xl border p-6 flex flex-col justify-between transition duration-300 ${
                isReigning
                  ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/60 shadow-glow-gold'
                  : isTre
                  ? 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500/40 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Year & Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-display tracking-wider text-amber-400">
                  {champ.year} CHAMPION
                </span>
                {isReigning && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500 text-black font-extrabold text-[10px] uppercase shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    <span>Reigning</span>
                  </span>
                )}
                {isTre && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[10px] uppercase">
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>In Memoriam</span>
                  </span>
                )}
                {isUndefeated && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] uppercase">
                    <span>14-0 Undefeated</span>
                  </span>
                )}
              </div>

              {/* Owner Avatar & Team */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <img
                    src={f?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                    alt={champ.owner}
                    className="w-16 h-16 rounded-2xl border-2 border-amber-400/80 object-cover shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs shadow-md">
                    🏆
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">{champ.owner}</h3>
                  <p className="text-xs text-amber-400 font-semibold">{champ.team}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{champ.record}</p>
                </div>
              </div>

              {/* Tagline / Lore Note */}
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
                <p className="italic">"{champ.tagline}"</p>

                {/* Special Interactive Ribbons/Toggles */}
                {isReigning && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold">
                      Matt's Official DFL Gold Ribbon Awarded!
                    </span>
                  </div>
                )}

                {isUndefeated && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowMickeyBanter(!showMickeyBanter)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1 font-medium"
                    >
                      <span>{showMickeyBanter ? 'Hide' : 'View'} Rival Chat Banter (Mickey Mouse Ring?)</span>
                      <ChevronRight className={`w-3 h-3 transform transition ${showMickeyBanter ? 'rotate-90' : ''}`} />
                    </button>
                    {showMickeyBanter && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] space-y-1">
                        <p><strong className="text-cyan-400">doesntfleeze:</strong> "Mickey Mouse chip. The NBA bubble year equivalent."</p>
                        <p><strong className="text-amber-400">PoppinChunkies:</strong> "44-12 all time. Stay mad."</p>
                      </div>
                    )}
                  </div>
                )}

                {isTre && (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-[11px]">
                    Tre (AsaltySwordsman) claimed our very first title in 2022 before tragically passing away. His banner hangs forever, roster preserved by Lauren.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Playoff Bracket & Postseason Vault */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <GitBranch className="w-4 h-4" />
              <span>Historical Brackets</span>
            </div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-white">
              DFL PLAYOFF ARCHIVES
            </h2>
            <p className="text-xs text-slate-400">Review the official Sleeper brackets and results for any season</p>
          </div>

          {/* Season Switcher Tabs */}
          <div className="flex items-center space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {['2025', '2024', '2023', '2022'].map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedSeason(yr)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedSeason === yr
                    ? 'bg-amber-500 text-black shadow-glow-gold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Season Recap & Bracket */}
        {activeSeasonData && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                Champion: <span className="text-amber-400 font-bold">{activeSeasonData.champion}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                Status: <span className="text-emerald-400 font-bold uppercase">{activeSeasonData.status}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                Playoff Matches: <span className="text-cyan-400 font-bold">{activeSeasonData.winnersBracket?.length || 0} Games</span>
              </div>
            </div>

            {/* Bracket Render */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {activeSeasonData.winnersBracket && activeSeasonData.winnersBracket.length > 0 ? (
                activeSeasonData.winnersBracket.map((match, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
                      <span>Round {match.r} • Match {match.m}</span>
                      {match.w && (
                        <span className="text-amber-400 font-extrabold flex items-center space-x-1">
                          <Crown className="w-3 h-3" />
                          <span>Winner: Team #{match.w}</span>
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className={`p-2 rounded-lg border flex justify-between items-center ${
                        match.w === match.t1 ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 font-bold' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}>
                        <span>Roster #{match.t1 || 'TBD'}</span>
                        {match.w === match.t1 && <span className="text-[10px] text-amber-400">ADVANCED</span>}
                      </div>
                      <div className={`p-2 rounded-lg border flex justify-between items-center ${
                        match.w === match.t2 ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 font-bold' : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}>
                        <span>Roster #{match.t2 || 'TBD'}</span>
                        {match.w === match.t2 && <span className="text-[10px] text-amber-400">ADVANCED</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10 text-slate-500 text-sm">
                  Playoff bracket data loading or active season in progress.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
