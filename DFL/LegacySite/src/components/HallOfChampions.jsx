import React, { useState } from 'react';
import { Trophy, Medal, Crown, Star, Sparkles, Heart, GitBranch, ChevronRight, Award, Flame } from 'lucide-react';

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
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-4 h-4" />
            <span>DFL Pantheon of Legends</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white mb-3">
            HALL OF CHAMPIONS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Honoring the league champions who conquered the 10-team gauntlet. From Cinderella underdog runs to historic undefeated regular seasons, their greatness is etched in DFL history.
          </p>
        </div>
      </div>

      {/* Champions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {champions.map((champ) => {
          const f = franchises[champ.franchise];
          const isReigning = champ.year === '2025';
          const is2024 = champ.year === '2024';
          const is2023 = champ.year === '2023';
          const isTre = champ.year === '2022';
          const isUndefeated = champ.year === '2023';

          let cardStyle = 'bg-slate-900/80 border-slate-800 hover:border-slate-700';
          let avatarBorder = 'border-amber-400/80';
          let yearColor = 'text-amber-400';

          if (isReigning) {
            cardStyle = 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/60 shadow-glow-gold hover:border-amber-400';
            avatarBorder = 'border-amber-400';
            yearColor = 'text-amber-400';
          } else if (is2024) {
            cardStyle = 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/60 shadow-lg shadow-rose-950/40 hover:border-rose-400';
            avatarBorder = 'border-rose-400';
            yearColor = 'text-rose-400';
          } else if (is2023) {
            cardStyle = 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40 hover:border-emerald-400';
            avatarBorder = 'border-emerald-400';
            yearColor = 'text-emerald-400';
          } else if (isTre) {
            cardStyle = 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-950/40 hover:border-purple-400';
            avatarBorder = 'border-purple-400';
            yearColor = 'text-purple-300';
          }

          return (
            <div
              key={champ.year}
              className={`relative rounded-2xl border p-6 flex flex-col transition duration-300 ${cardStyle}`}
            >
              {/* Year & Badge */}
              <div className="flex items-start justify-between gap-2 min-h-[52px] mb-4">
                <div>
                  <div className={`text-2xl font-black font-display tracking-wider leading-none ${yearColor}`}>
                    {champ.year}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                    CHAMPION
                  </div>
                </div>
                {isReigning && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500 text-black font-extrabold text-[10px] uppercase shadow-sm flex-shrink-0">
                    <Sparkles className="w-3 h-3" />
                    <span>Reigning</span>
                  </span>
                )}
                {is2024 && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] uppercase flex-shrink-0">
                    <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>Cinderella Run</span>
                  </span>
                )}
                {is2023 && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] uppercase flex-shrink-0">
                    <Trophy className="w-3 h-3 text-emerald-400" />
                    <span>14-0 Undefeated</span>
                  </span>
                )}
                {isTre && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[10px] uppercase flex-shrink-0">
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>In Memoriam</span>
                  </span>
                )}
              </div>

              {/* Owner Avatar & Team */}
              <div className="flex items-center space-x-4 mb-4 min-h-[64px]">
                <div className="relative flex-shrink-0">
                  <img
                    src={champ.photoUrl || f?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                    onError={(e) => {
                      if (f?.avatar && e.target.src !== f.avatar) {
                        e.target.src = f.avatar;
                      }
                    }}
                    alt={champ.owner}
                    className={`w-16 h-16 rounded-2xl border-2 ${avatarBorder} object-cover shadow-md`}
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs shadow-md">
                    🏆
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-white leading-snug tracking-wide">{champ.team}</h3>
                  <p className="text-xs text-slate-300 font-semibold">{champ.owner}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{champ.record}</p>
                </div>
              </div>

              {/* Tagline / Lore Note */}
              <div className="mt-auto pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
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
                    Tre (AsaltySwordsman) claimed our inaugural 2022 title before passing away from cancer. His championship banner and memory hang forever in the DFL Hall of Champions.
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
              <span>Historical Playoff Brackets</span>
            </div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-white">
              DFL POSTSEASON ARCHIVES
            </h2>
            <p className="text-xs text-slate-400">Review the official Sleeper brackets, matchup results, and crowned champions</p>
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
        {activeSeasonData && (() => {
          const is2022Season = activeSeasonData.year === '2022';
          const champFranchiseKey = activeSeasonData.champion;
          const champFranchise = franchises[champFranchiseKey] || {};
          const champTeamName = is2022Season ? 'Team Pupinsuds' : (champFranchise.teamName || champFranchiseKey);
          const champManagerName = is2022Season ? 'Tre (AsaltySwordsman)' : (champFranchise.name || champFranchiseKey);

          return (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>
                    Champion: <strong className="text-amber-400 font-black">{champTeamName}</strong> <span className="text-slate-400">({champManagerName})</span>
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                  Status: <span className="text-emerald-400 font-bold uppercase">{activeSeasonData.status}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
                  Playoff Games: <span className="text-cyan-400 font-bold">{activeSeasonData.winnersBracket?.length || 0} Matches</span>
                </div>
              </div>

              {/* Tournament Bracket Tree View */}
              {activeSeasonData.winnersBracket && activeSeasonData.winnersBracket.length > 0 ? (
                (() => {
                  const qfMatches = activeSeasonData.winnersBracket.filter(m => m.r === 1);
                  const sfMatches = activeSeasonData.winnersBracket.filter(m => m.r === 2 && !m.p);
                  const champMatch = activeSeasonData.winnersBracket.find(m => m.p === 1);

                  // Resolve podium team name & manager name
                  const champWinnerKey = champMatch?.winner?.franchiseKey || champFranchiseKey;
                  const champPodiumFranchise = franchises[champWinnerKey] || champFranchise;
                  const podiumTeamName = is2022Season
                    ? 'Team Pupinsuds'
                    : (champMatch?.winner?.teamName || champPodiumFranchise.teamName || champTeamName);
                  const podiumManagerName = is2022Season
                    ? 'Tre (AsaltySwordsman)'
                    : (champMatch?.winner?.name || champPodiumFranchise.name || champManagerName);

                  // Identify QF1, QF2, SF1, SF2, and Byes
                  const sf1 = sfMatches.find(m => m.m === 3) || sfMatches[0];
                  const sf2 = sfMatches.find(m => m.m === 4) || sfMatches[1];
                  const qf1 = qfMatches.find(m => m.m === 1) || qfMatches[0];
                  const qf2 = qfMatches.find(m => m.m === 2) || qfMatches[1];

                const seed1 = sf1?.team1;
                const seed2 = sf2?.team1;

                const renderByeCard = (team, seedNum) => {
                  return (
                    <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md transition hover:border-slate-700">
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={team?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0 shadow"
                        />
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                              #{seedNum} SEED
                            </span>
                            <span className="text-xs font-black text-white truncate leading-tight">
                              {team?.teamName || team?.name || `Seed ${seedNum}`}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">{team?.name}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-black text-xs uppercase tracking-wider flex-shrink-0">
                        BYE
                      </span>
                    </div>
                  );
                };

                const renderSleeperMatchCard = (match, label, isChamp = false) => {
                  if (!match) return null;
                  const t1Won = match.winner?.franchiseKey === match.team1?.franchiseKey || match.w === match.t1;
                  const t2Won = match.winner?.franchiseKey === match.team2?.franchiseKey || match.w === match.t2;

                  return (
                    <div
                      className={`glass-panel p-3.5 rounded-2xl border transition space-y-2.5 shadow-md ${
                        isChamp
                          ? 'border-amber-500/70 shadow-glow-gold'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Match Header */}
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 pb-1.5 border-b border-slate-800">
                        <span className={isChamp ? 'text-amber-400 font-extrabold flex items-center space-x-1' : 'text-slate-400'}>
                          {isChamp ? <span>🏆 Championship Match</span> : <span>{label || `Match ${match.m}`}</span>}
                        </span>
                        {match.winner && (
                          <span className="text-amber-400 font-bold flex items-center space-x-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span className="truncate max-w-[130px]">{match.winner.teamName || match.winner.name}</span>
                          </span>
                        )}
                      </div>

                      {/* Team 1 */}
                      <div
                        className={`p-2 rounded-xl border flex items-center justify-between transition ${
                          t1Won
                            ? 'bg-amber-500/15 border-amber-500/60 font-bold text-white shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <img
                            src={match.team1?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-slate-700 shadow"
                          />
                          <div className="truncate">
                            <span className="block font-bold text-xs truncate leading-tight text-white">
                              {match.team1?.teamName || match.team1?.name || `Roster #${match.t1 || 'TBD'}`}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              {match.team1?.name}
                            </span>
                          </div>
                        </div>
                        {t1Won && (
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500 text-black flex-shrink-0 ml-1.5 shadow-sm">
                            {isChamp ? 'CHAMP 🏆' : 'ADV'}
                          </span>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div
                        className={`p-2 rounded-xl border flex items-center justify-between transition ${
                          t2Won
                            ? 'bg-amber-500/15 border-amber-500/60 font-bold text-white shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <img
                            src={match.team2?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-slate-700 shadow"
                          />
                          <div className="truncate">
                            <span className="block font-bold text-xs truncate leading-tight text-white">
                              {match.team2?.teamName || match.team2?.name || `Roster #${match.t2 || 'TBD'}`}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate">
                              {match.team2?.name}
                            </span>
                          </div>
                        </div>
                        {t2Won && (
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500 text-black flex-shrink-0 ml-1.5 shadow-sm">
                            {isChamp ? 'CHAMP 🏆' : 'ADV'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-6">
                    {/* Horizontal Tournament Bracket Tree */}
                    <div className="overflow-x-auto pb-4">
                      <div className="min-w-[1020px] flex items-stretch justify-between relative py-2">
                        {/* COLUMN 1: WEEK 15 (Quarterfinals & Byes) */}
                        <div className="w-[300px] flex flex-col justify-between space-y-3">
                          <div className="text-center py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-black uppercase tracking-wider text-slate-300 shadow-sm">
                            Round 1 • (Week 15)
                          </div>

                          {/* Top Half: Seed 1 Bye + QF 1 */}
                          <div className="space-y-4">
                            {renderByeCard(seed1, 1)}
                            {renderSleeperMatchCard(qf1, 'Quarterfinal 1')}
                          </div>

                          {/* Bottom Half: Seed 2 Bye + QF 2 */}
                          <div className="space-y-4">
                            {renderByeCard(seed2, 2)}
                            {renderSleeperMatchCard(qf2, 'Quarterfinal 2')}
                          </div>
                        </div>

                        {/* CONNECTOR 1: Branch from Round 1 into Round 2 */}
                        <div className="w-12 flex flex-col justify-between py-10">
                          {/* Upper fork for Semi 1 */}
                          <div className="h-44 flex items-center">
                            <svg className="w-12 h-full text-slate-600" viewBox="0 0 48 160" fill="none" preserveAspectRatio="none">
                              <path d="M 0 20 H 24 V 140 H 0 M 24 80 H 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>

                          {/* Lower fork for Semi 2 */}
                          <div className="h-44 flex items-center">
                            <svg className="w-12 h-full text-slate-600" viewBox="0 0 48 160" fill="none" preserveAspectRatio="none">
                              <path d="M 0 20 H 24 V 140 H 0 M 24 80 H 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>

                        {/* COLUMN 2: WEEK 16 (Semifinals) */}
                        <div className="w-[300px] flex flex-col justify-between">
                          <div className="text-center py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-black uppercase tracking-wider text-slate-300 shadow-sm mb-3">
                            Round 2 • (Week 16)
                          </div>

                          <div className="flex-1 flex flex-col justify-around py-4">
                            {renderSleeperMatchCard(sf1, 'Semifinal 1')}
                            {renderSleeperMatchCard(sf2, 'Semifinal 2')}
                          </div>
                        </div>

                        {/* CONNECTOR 2: Branch from Semifinals into Finals */}
                        <div className="w-12 flex items-center justify-center">
                          <svg className="w-12 h-72 text-amber-500/70" viewBox="0 0 48 260" fill="none" preserveAspectRatio="none">
                            <path d="M 0 35 H 24 V 225 H 0 M 24 130 H 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </div>

                        {/* COLUMN 3: WEEK 17 (Championship) */}
                        <div className="w-[320px] flex flex-col justify-center space-y-4">
                          <div className="text-center py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 border border-amber-500/50 text-xs font-black uppercase tracking-wider text-amber-300 shadow-glow-gold">
                            Round 3 • 🏆 The Championship (Week 17)
                          </div>

                          {renderSleeperMatchCard(champMatch, '🏆 Championship Match', true)}

                          {/* Crowned League Champion Podium Banner */}
                          {champMatch?.winner && (
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-black shadow-glow-gold flex items-center space-x-3.5 border-2 border-amber-300 transform hover:scale-[1.02] transition">
                              <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                                🏆
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/75 block">
                                  {activeSeasonData.year} DFL League Champion
                                </span>
                                <h4 className="text-xl font-black leading-tight font-display truncate">
                                  {podiumTeamName}
                                </h4>
                                <p className="text-xs font-bold text-black/85 mt-0.5">
                                  Manager: {podiumManagerName}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="col-span-3 text-center py-10 text-slate-500 text-sm">
                Playoff bracket data loading or active season in progress.
              </div>
            )}
          </div>
        );
      })()}
      </div>
    </div>
  );
}
