import React, { useState } from 'react';
import { Swords, X, Flame, Shield, ArrowRight } from 'lucide-react';

// Formats team names into two clean, balanced lines so names never get clipped or word-chopped
const formatHeaderTeamName = (teamName, franchiseKey) => {
  if (franchiseKey === 'PoppinChunkies' || teamName?.toLowerCase().includes('poppin')) {
    return { line1: "Poppin'", line2: "Chunkies" };
  }
  if (franchiseKey === 'SamBaugh' || teamName?.toLowerCase().includes('lamar')) {
    return { line1: "Dude, Where's", line2: "Lamar?" };
  }
  if (franchiseKey === 'MaffuJames' || teamName?.toLowerCase().includes('gibbs')) {
    return { line1: "I Don't Gibbs", line2: "a Shough" };
  }
  if (franchiseKey === 'MattyiceR' || teamName?.toLowerCase().includes('heisenberg')) {
    return { line1: "Heisenberg's", line2: "Hitmen" };
  }
  if (franchiseKey === 'LMcVicker' || teamName?.toLowerCase().includes('laces')) {
    return { line1: "Laces Out,", line2: "Ladies" };
  }
  if (franchiseKey === 'DukeofWales' || teamName?.toLowerCase().includes('hands')) {
    return { line1: "Hands for", line2: "Jobs" };
  }
  if (franchiseKey === 'Rhymenoceros' || teamName?.toLowerCase().includes('totts')) {
    return { line1: "Scott's", line2: "Totts" };
  }
  if (franchiseKey === 'Tklumb86' || teamName?.toLowerCase().includes('who dey')) {
    return { line1: "Who", line2: "Dey" };
  }
  if (franchiseKey === 'doesntfleeze' || teamName?.toLowerCase().includes('washed')) {
    return { line1: "Washed🫩", line2: "" };
  }
  if (franchiseKey === 'JayZone13' || teamName?.toLowerCase().includes('ronin')) {
    return { line1: "Ronin", line2: "" };
  }

  const words = (teamName || '').trim().split(/\s+/);
  if (words.length <= 1) return { line1: words[0] || '', line2: '' };
  if (words.length === 2) return { line1: words[0], line2: words[1] };
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' '),
    line2: words.slice(mid).join(' '),
  };
};

export default function RivalryMatrix({ franchises, rivalries }) {
  const [selectedMatchup, setSelectedMatchup] = useState(null);
  const franchiseKeys = Object.keys(franchises);

  const [mobileTeamA, setMobileTeamA] = useState(franchiseKeys[0] || 'Rhymenoceros');
  const [mobileTeamB, setMobileTeamB] = useState(franchiseKeys[1] || 'PoppinChunkies');
  const [mobileMatrixMode, setMobileMatrixMode] = useState('inspector'); // 'inspector' | 'grid'

  const handleCellClick = (f1, f2) => {
    if (f1 === f2) return;
    const data = rivalries[f1]?.[f2];
    if (data) {
      setSelectedMatchup({
        team1: f1,
        team2: f2,
        info1: franchises[f1],
        info2: franchises[f2],
        ...data,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Swords className="w-4 h-4" />
            <span>Head-to-Head Historical Matrix</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            THE DFL RIVALRY MATRIX
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Click any cell to inspect the lifetime head-to-head grudge matches between any two managers
          </p>
        </div>

        {/* Mobile Mode Toggle */}
        <div className="flex md:hidden items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold self-start">
          <button
            onClick={() => setMobileMatrixMode('inspector')}
            className={`px-3 py-1 rounded-lg transition ${
              mobileMatrixMode === 'inspector' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Matchup Finder
          </button>
          <button
            onClick={() => setMobileMatrixMode('grid')}
            className={`px-3 py-1 rounded-lg transition ${
              mobileMatrixMode === 'grid' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            10x10 Matrix
          </button>
        </div>
      </div>

      {/* Mobile Matchup Finder (< md screens) */}
      {mobileMatrixMode === 'inspector' && (
        <div className="block md:hidden space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Select Two Franchises to Compare:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">Team 1</label>
                <select
                  value={mobileTeamA}
                  onChange={(e) => setMobileTeamA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-400 font-bold"
                >
                  {franchiseKeys.map(k => (
                    <option key={`a-${k}`} value={k}>{franchises[k]?.teamName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-rose-400 font-bold uppercase block mb-1">Team 2</label>
                <select
                  value={mobileTeamB}
                  onChange={(e) => setMobileTeamB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-400 font-bold"
                >
                  {franchiseKeys.map(k => (
                    <option key={`b-${k}`} value={k} disabled={k === mobileTeamA}>{franchises[k]?.teamName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Render the Head to Head Card */}
          {mobileTeamA === mobileTeamB ? (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              Please select two different franchises.
            </div>
          ) : (
            (() => {
              const data = rivalries[mobileTeamA]?.[mobileTeamB];
              const t1 = franchises[mobileTeamA];
              const t2 = franchises[mobileTeamB];
              if (!data || !t1 || !t2) return null;

              const totalGames = data.wins + data.losses + data.ties;

              return (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5">
                  {/* Duel Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={t1.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={t1.name}
                        className="w-11 h-11 rounded-xl border-2 border-emerald-400 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{t1.teamName}</h4>
                        <span className="text-[10px] text-slate-400 block truncate">{t1.name}</span>
                        <span className="font-mono font-black text-sm text-emerald-400">{data.wins}W</span>
                      </div>
                    </div>

                    <div className="text-center px-2 flex-shrink-0">
                      <span className="font-display font-black text-lg text-rose-500">VS</span>
                      <span className="text-[9px] text-slate-500 font-mono block">{totalGames} Games</span>
                    </div>

                    <div className="flex items-center space-x-2.5 text-right min-w-0 flex-row-reverse">
                      <img
                        src={t2.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={t2.name}
                        className="w-11 h-11 rounded-xl border-2 border-rose-400 object-cover flex-shrink-0 ml-2.5"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{t2.teamName}</h4>
                        <span className="text-[10px] text-slate-400 block truncate">{t2.name}</span>
                        <span className="font-mono font-black text-sm text-rose-400">{data.losses}W</span>
                      </div>
                    </div>
                  </div>

                  {/* Points Bar */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-emerald-400">{data.pointsFor.toLocaleString()} PF</span>
                      <span className="text-slate-500 uppercase text-[9px]">Lifetime Points</span>
                      <span className="text-rose-400">{data.pointsAgainst.toLocaleString()} PF</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(data.pointsFor / (data.pointsFor + data.pointsAgainst || 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${(data.pointsAgainst / (data.pointsFor + data.pointsAgainst || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Matchup History */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Past Matchups ({data.matchups.length}):
                    </span>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {data.matchups.map((game, idx) => {
                        const won = game.winner === mobileTeamA;
                        const isTie = game.winner === 'TIE';
                        const stage = game.stage || (game.week >= 15 ? 'Playoffs' : `Week ${game.week}`);

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              won
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : isTie
                                ? 'bg-slate-900 border-slate-800'
                                : 'bg-rose-950/20 border-rose-500/30'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`font-black font-mono text-xs ${won ? 'text-emerald-400' : isTie ? 'text-slate-400' : 'text-rose-400'}`}>
                                {won ? 'W' : isTie ? 'T' : 'L'}
                              </span>
                              <span className="text-slate-400 text-[11px] font-mono">{game.year} {stage}</span>
                            </div>
                            <div className="font-mono font-bold text-slate-200 text-xs">
                              <span className={won ? 'text-emerald-300' : 'text-slate-400'}>{game.score1}</span>
                              <span className="text-slate-600 mx-1">-</span>
                              <span className={!won && !isTie ? 'text-rose-300' : 'text-slate-400'}>{game.score2}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 10x10 Matrix Grid Container (always on desktop; toggleable on mobile) */}
      <div className={`glass-panel rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl overflow-x-auto ${mobileMatrixMode === 'inspector' ? 'hidden md:block' : 'block'}`}>
        <div className="min-w-[1060px] pr-2 sm:pr-4">
          {/* Column Headers */}
          <div className="flex items-center space-x-2 mb-2 text-center text-xs text-slate-400">
            {/* Top Left Label */}
            <div className="w-40 sm:w-44 flex-shrink-0 p-2 text-left text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center">
              <span>Franchise</span>
            </div>

            {/* 10 Opponent Column Headers */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2 flex-1 min-w-[920px]">
              {franchiseKeys.map(k => {
                const formatted = formatHeaderTeamName(franchises[k]?.teamName, k);
                return (
                  <div
                    key={k}
                    className="h-[88px] sm:h-[92px] p-1 sm:p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center shadow-sm hover:border-slate-700 transition group rivalry-header-card"
                    title={`${franchises[k].teamName} — Manager: ${franchises[k].name}`}
                  >
                    <img
                      src={franchises[k].customLogoUrl || franchises[k].avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                      alt={franchises[k].teamName}
                      className="w-7 h-7 rounded-xl object-cover border border-slate-700 mb-1 shadow flex-shrink-0"
                    />
                    <div className="w-full flex flex-col items-center justify-center leading-tight px-0.5">
                      <span className="text-[9.5px] sm:text-[10px] md:text-[10.5px] font-black text-slate-200 block text-center leading-tight whitespace-nowrap tracking-tight group-hover:text-cyan-400 transition">
                        {formatted.line1}
                      </span>
                      {formatted.line2 && (
                        <span className="text-[9.5px] sm:text-[10px] md:text-[10.5px] font-black text-slate-200 block text-center leading-tight whitespace-nowrap tracking-tight group-hover:text-cyan-400 transition">
                          {formatted.line2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {franchiseKeys.map(rowKey => (
            <div key={rowKey} className="flex items-center space-x-2 mb-2">
              {/* Row Header (Full Team Name + Manager Name) */}
              <div
                className="w-40 sm:w-44 flex-shrink-0 p-2 sm:p-2.5 bg-slate-900/90 rounded-2xl text-xs font-bold text-white flex items-center space-x-2 border border-slate-800 shadow-sm rivalry-row-header"
                title={`${franchises[rowKey].teamName} (Manager: ${franchises[rowKey].name})`}
              >
                <img
                  src={franchises[rowKey].customLogoUrl || franchises[rowKey].avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                  alt={franchises[rowKey].teamName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-slate-700 flex-shrink-0 shadow-sm"
                />
                <div className="min-w-0 flex-1 text-left">
                  <span className="block font-black font-display text-white text-[11px] sm:text-xs leading-tight line-clamp-2">
                    {franchises[rowKey].teamName}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                    {franchises[rowKey].name}
                  </span>
                </div>
              </div>

              {/* Grid Cells (10 Columns) */}
              <div className="grid grid-cols-10 gap-1.5 sm:gap-2 flex-1 min-w-[920px]">
                {franchiseKeys.map(colKey => {
                  if (rowKey === colKey) {
                    return (
                      <div
                        key={colKey}
                        className="h-10 sm:h-11 px-1 bg-slate-950/60 rounded-xl text-slate-700 text-center text-xs font-mono font-bold select-none border border-slate-900 flex items-center justify-center"
                      >
                        —
                      </div>
                    );
                  }

                  const r = rivalries[rowKey]?.[colKey];
                  const total = (r?.wins || 0) + (r?.losses || 0) + (r?.ties || 0);
                  const hasWinning = (r?.wins || 0) > (r?.losses || 0);
                  const hasLosing = (r?.wins || 0) < (r?.losses || 0);

                  return (
                    <button
                      key={colKey}
                      onClick={() => handleCellClick(rowKey, colKey)}
                      className={`h-10 sm:h-11 px-1 rounded-xl text-center transition font-mono text-xs font-bold border shadow-sm flex items-center justify-center ${
                        total === 0
                          ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 rivalry-cell-empty'
                          : hasWinning
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50 rivalry-cell-win'
                          : hasLosing
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/50 rivalry-cell-loss'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/60 rivalry-cell-tie'
                      }`}
                    >
                      {r ? `${r.wins}-${r.losses}` : '0-0'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matchup Breakdown Modal */}
      {selectedMatchup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#111726] border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMatchup(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Duel Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              {/* Team 1 */}
              <div className="flex items-center space-x-3 text-left">
                <img
                  src={selectedMatchup.info1.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                  alt={selectedMatchup.info1.name}
                  className="w-12 h-12 rounded-2xl border-2 border-emerald-400 object-cover"
                />
                <div>
                  <h3 className="font-black text-base text-white font-display tracking-wide">{selectedMatchup.info1.teamName}</h3>
                  <p className="text-xs text-slate-400">Mgr: {selectedMatchup.info1.name}</p>
                  <p className="text-sm font-black font-mono text-emerald-400 mt-0.5">
                    {selectedMatchup.wins} WINS
                  </p>
                </div>
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center px-4">
                <span className="font-display font-black text-2xl text-rose-500">VS</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">
                  {selectedMatchup.wins + selectedMatchup.losses + selectedMatchup.ties} Games
                </span>
              </div>

              {/* Team 2 */}
              <div className="flex items-center space-x-3 text-right">
                <div>
                  <h3 className="font-black text-base text-white font-display tracking-wide">{selectedMatchup.info2.teamName}</h3>
                  <p className="text-xs text-slate-400">Mgr: {selectedMatchup.info2.name}</p>
                  <p className="text-sm font-black font-mono text-rose-400 mt-0.5">
                    {selectedMatchup.losses} WINS
                  </p>
                </div>
                <img
                  src={selectedMatchup.info2.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                  alt={selectedMatchup.info2.name}
                  className="w-12 h-12 rounded-2xl border-2 border-rose-400 object-cover"
                />
              </div>
            </div>

            {/* Points Differential Bar */}
            <div className="my-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-400">{selectedMatchup.pointsFor.toLocaleString()} PF</span>
                <span className="text-slate-400 uppercase text-[10px]">Lifetime Points Scored</span>
                <span className="text-rose-400">{selectedMatchup.pointsAgainst.toLocaleString()} PF</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${(selectedMatchup.pointsFor / (selectedMatchup.pointsFor + selectedMatchup.pointsAgainst || 1)) * 100}%`,
                  }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${(selectedMatchup.pointsAgainst / (selectedMatchup.pointsFor + selectedMatchup.pointsAgainst || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Matchup History List */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Historical Box Scores
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedMatchup.matchups.map((game, idx) => {
                  const won = game.winner === selectedMatchup.team1;
                  const isTie = game.winner === 'TIE';

                  // Determine playoff stage badges
                  const stage = game.stage || (
                    game.week === 17 ? '🏆 Championship Week' :
                    game.week === 16 ? '⚔️ Semifinal Week' :
                    game.week === 15 ? '🎯 Quarterfinal Week' : null
                  );
                  const isChamp = stage?.includes('Championship');
                  const isSemi = stage?.includes('Semifinal');
                  const isQF = stage?.includes('Quarterfinal');
                  const isThird = stage?.includes('3rd Place');

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 transition ${
                        isChamp
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                          : won
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isTie
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-slate-400 font-bold font-mono">
                          {game.year} Wk {game.week}
                        </span>
                        <span
                          className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                            won
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isTie
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {won ? 'WIN' : isTie ? 'TIE' : 'LOSS'}
                        </span>
                        {stage && (
                          <span
                            className={`font-black px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center space-x-1 ${
                              isChamp
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-glow-gold'
                                : isSemi
                                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                                : isQF
                                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                                : isThird
                                ? 'bg-amber-700/30 text-amber-200 border border-amber-600/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            <span>{stage}</span>
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold flex items-center space-x-2 flex-shrink-0 self-end sm:self-auto">
                        <span className={won ? 'text-white' : 'text-slate-400'}>
                          {game.pts1}
                        </span>
                        <span className="text-slate-600">—</span>
                        <span className={!won && !isTie ? 'text-white' : 'text-slate-400'}>
                          {game.pts2}
                        </span>
                        <span className="text-slate-500 text-[10px] ml-1">
                          (Δ {game.margin})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
