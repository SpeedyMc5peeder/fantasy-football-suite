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

                const getSeed = (franchiseKey) => {
                  if (!activeSeasonData?.standings) return '';
                  const item = activeSeasonData.standings.find(s => s.franchiseKey === franchiseKey);
                  return item?.rank ? String(item.rank) : '';
                };

                const seed1Num = getSeed(seed1?.franchiseKey) || '1';
                const seed2Num = getSeed(seed2?.franchiseKey) || '2';

                // Sleeper-accurate Compact Match Card
                const renderSleeperMatchCard = (match, label, isChamp = false) => {
                  if (!match) return null;
                  const t1Won = match.winner?.franchiseKey === match.team1?.franchiseKey || match.w === match.t1;
                  const t2Won = match.winner?.franchiseKey === match.team2?.franchiseKey || match.w === match.t2;
                  const s1 = getSeed(match.team1?.franchiseKey);
                  const s2 = getSeed(match.team2?.franchiseKey);

                  return (
                    <div
                      className={`rounded-xl border transition overflow-hidden shadow-sm ${
                        isChamp
                          ? 'bg-[#152033] border-amber-500/60 shadow-glow-gold'
                          : 'bg-[#131b2a] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isChamp && (
                        <div className="bg-amber-500/20 border-b border-amber-500/40 px-1 py-0.5 text-[8.5px] sm:text-[10px] font-black text-amber-300 text-center flex items-center justify-center space-x-1">
                          <span>🏆 Championship</span>
                        </div>
                      )}

                      {/* Team 1 Row */}
                      <div
                        className={`px-1.5 py-1.5 sm:px-2.5 sm:py-2 flex items-center justify-between border-b border-slate-800/60 ${
                          t1Won ? 'bg-amber-500/15 text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <img
                              src={match.team1?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                              alt=""
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-slate-700"
                            />
                            {s1 && (
                              <span className="absolute -bottom-1 -right-1 bg-black text-[7px] sm:text-[8px] font-mono font-bold text-slate-300 w-3 h-3 rounded-full flex items-center justify-center border border-slate-700">
                                {s1}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-bold truncate block leading-tight">
                            {match.team1?.name || match.team1?.teamName || `Seed ${match.t1}`}
                          </span>
                        </div>
                        {t1Won && (
                          <span className="text-[8px] sm:text-[9px] font-black text-amber-400 flex-shrink-0 ml-1">
                            {isChamp ? 'CHAMP' : 'ADV'}
                          </span>
                        )}
                      </div>

                      {/* Team 2 Row */}
                      <div
                        className={`px-1.5 py-1.5 sm:px-2.5 sm:py-2 flex items-center justify-between ${
                          t2Won ? 'bg-amber-500/15 text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <img
                              src={match.team2?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                              alt=""
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-slate-700"
                            />
                            {s2 && (
                              <span className="absolute -bottom-1 -right-1 bg-black text-[7px] sm:text-[8px] font-mono font-bold text-slate-300 w-3 h-3 rounded-full flex items-center justify-center border border-slate-700">
                                {s2}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] sm:text-[11px] font-bold truncate block leading-tight">
                            {match.team2?.name || match.team2?.teamName || `Seed ${match.t2}`}
                          </span>
                        </div>
                        {t2Won && (
                          <span className="text-[8px] sm:text-[9px] font-black text-amber-400 flex-shrink-0 ml-1">
                            {isChamp ? 'CHAMP' : 'ADV'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                };

                // Sleeper-accurate Bye Card
                const renderByeCard = (team, seedNum) => {
                  return (
                    <div className="rounded-xl border border-slate-800/90 bg-[#131b2a] overflow-hidden shadow-sm">
                      <div className="px-1.5 py-1.5 sm:px-2.5 sm:py-2 flex items-center space-x-1 sm:space-x-1.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={team?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                            alt=""
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-slate-700"
                          />
                          <span className="absolute -bottom-1 -right-1 bg-black text-[7px] sm:text-[8px] font-mono font-bold text-slate-300 w-3 h-3 rounded-full flex items-center justify-center border border-slate-700">
                            {seedNum}
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[11px] font-bold text-white truncate block leading-tight">
                          {team?.name || team?.teamName || `Seed ${seedNum}`}
                        </span>
                      </div>
                      <div className="bg-cyan-500/10 border-t border-slate-800/60 py-0.5 text-center">
                        <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-cyan-400 uppercase">
                          BYE
                        </span>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-4">
                    {/* Sleeper Mobile & Responsive Playoff Tree (Fits on Screen) */}
                    <div className="w-full relative py-2">
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-stretch">
                        {/* COLUMN 1: ROUND 1 (Week 15) */}
                        <div className="flex flex-col justify-between space-y-2 sm:space-y-3">
                          <div className="text-center py-1 sm:py-1.5 px-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                            <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-slate-300 block">
                              Round 1
                            </span>
                            <span className="text-[7.5px] sm:text-[9px] text-slate-500 font-mono block">
                              (Week 15)
                            </span>
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            {renderByeCard(seed1, seed1Num)}
                            {renderSleeperMatchCard(qf1, 'QF 1')}
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            {renderByeCard(seed2, seed2Num)}
                            {renderSleeperMatchCard(qf2, 'QF 2')}
                          </div>
                        </div>

                        {/* COLUMN 2: ROUND 2 (Week 16) */}
                        <div className="flex flex-col justify-between">
                          <div className="text-center py-1 sm:py-1.5 px-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm mb-2">
                            <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-slate-300 block">
                              Round 2
                            </span>
                            <span className="text-[7.5px] sm:text-[9px] text-slate-500 font-mono block">
                              (Week 16)
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col justify-around py-3 sm:py-6 space-y-3">
                            {renderSleeperMatchCard(sf1, 'Semi 1')}
                            {renderSleeperMatchCard(sf2, 'Semi 2')}
                          </div>
                        </div>

                        {/* COLUMN 3: FINALS (Week 17) */}
                        <div className="flex flex-col justify-between">
                          <div className="text-center py-1 sm:py-1.5 px-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 border border-amber-500/50 shadow-glow-gold mb-2">
                            <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-amber-300 block">
                              Finals
                            </span>
                            <span className="text-[7.5px] sm:text-[9px] text-amber-400/70 font-mono block">
                              (Week 17)
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col justify-center space-y-2.5 sm:space-y-3">
                            {renderSleeperMatchCard(champMatch, '🏆 Championship Match', true)}

                            {/* Crowned League Champion Podium Banner */}
                            {champMatch?.winner && (
                              <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-black shadow-glow-gold flex items-center space-x-1.5 sm:space-x-3 border sm:border-2 border-amber-300">
                                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/20 flex items-center justify-center text-sm sm:text-xl flex-shrink-0 shadow-inner">
                                  🏆
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider text-black/75 block">
                                    {activeSeasonData.year} Champion
                                  </span>
                                  <h4 className="text-xs sm:text-lg font-black leading-tight font-display truncate">
                                    {podiumTeamName}
                                  </h4>
                                </div>
                              </div>
                            )}
                          </div>
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
