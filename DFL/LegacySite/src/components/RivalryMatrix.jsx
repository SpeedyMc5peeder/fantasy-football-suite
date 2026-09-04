import React, { useState } from 'react';
import { Swords, X, Flame, Shield, ArrowRight } from 'lucide-react';

export default function RivalryMatrix({ franchises, rivalries }) {
  const [selectedMatchup, setSelectedMatchup] = useState(null);

  const franchiseKeys = Object.keys(franchises);

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

      {/* 10x10 Matrix Grid Container */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Column Headers */}
          <div className="grid grid-cols-11 gap-1.5 mb-1.5 text-center text-[10px] font-black uppercase text-slate-400">
            <div className="p-2 text-left text-slate-500">VS</div>
            {franchiseKeys.map(k => (
              <div key={k} className="p-1.5 bg-slate-900/80 rounded-lg truncate border border-slate-800" title={franchises[k].name}>
                {franchises[k].name.split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Rows */}
          {franchiseKeys.map(rowKey => (
            <div key={rowKey} className="grid grid-cols-11 gap-1.5 mb-1.5 items-center">
              {/* Row Header */}
              <div className="p-2 bg-slate-900/90 rounded-lg text-xs font-bold text-white flex items-center space-x-2 border border-slate-800 truncate" title={franchises[rowKey].name}>
                <img
                  src={franchises[rowKey].avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                  alt={franchises[rowKey].name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                />
                <span className="truncate">{franchises[rowKey].name.split(' ')[0]}</span>
              </div>

              {/* Grid Cells */}
              {franchiseKeys.map(colKey => {
                if (rowKey === colKey) {
                  return (
                    <div
                      key={colKey}
                      className="p-3 bg-slate-950/60 rounded-lg text-slate-700 text-center text-xs font-mono font-bold select-none"
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
                    className={`p-2 rounded-lg text-center transition font-mono text-xs font-bold border ${
                      total === 0
                        ? 'bg-slate-900/40 text-slate-600 border-slate-800/40'
                        : hasWinning
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50 shadow-sm'
                        : hasLosing
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/50'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    {r ? `${r.wins}-${r.losses}` : '0-0'}
                  </button>
                );
              })}
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
                  <h3 className="font-bold text-base text-white">{selectedMatchup.info1.name}</h3>
                  <p className="text-xs text-slate-400">{selectedMatchup.info1.teamName}</p>
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
                  <h3 className="font-bold text-base text-white">{selectedMatchup.info2.name}</h3>
                  <p className="text-xs text-slate-400">{selectedMatchup.info2.teamName}</p>
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
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedMatchup.matchups.map((game, idx) => {
                  const won = game.winner === selectedMatchup.team1;
                  const isTie = game.winner === 'TIE';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        won
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isTie
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-bold font-mono">
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
                      </div>
                      <div className="font-mono font-bold flex items-center space-x-2">
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
