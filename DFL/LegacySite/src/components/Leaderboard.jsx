import React, { useState } from 'react';
import { BarChart3, Zap, Flame, ShieldAlert, Award, ArrowUpDown, ChevronDown } from 'lucide-react';

export default function Leaderboard({ franchises, records }) {
  const [sortField, setSortField] = useState('wins');
  const [sortAsc, setSortAsc] = useState(false);

  // Convert franchises into an array for sorting
  const franchiseList = Object.entries(franchises).map(([key, f]) => ({
    key,
    ...f,
    allTime: f.allTime,
  }));

  const sortedList = [...franchiseList].sort((a, b) => {
    let valA = a.allTime[sortField];
    let valB = b.allTime[sortField];
    if (sortField === 'winPct') {
      valA = a.allTime.winPct;
      valB = b.allTime.winPct;
    }
    if (sortAsc) return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>5-Year Cumulative Ledger (2022–2026)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            ALL-TIME DFL STANDINGS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Unbroken records compiled across all regular season matchups in DFL history
          </p>
        </div>
      </div>

      {/* Standings Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4 sm:px-6">Rank & Manager</th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('wins')}>
                  <div className="flex items-center space-x-1">
                    <span>Record (W-L-T)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('winPct')}>
                  <div className="flex items-center space-x-1">
                    <span>Win %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('pointsFor')}>
                  <div className="flex items-center space-x-1">
                    <span>All-Time PF</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('pointsAgainst')}>
                  <div className="flex items-center space-x-1">
                    <span>All-Time PA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('highScore')}>
                  <div className="flex items-center space-x-1">
                    <span>High Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 text-center">Titles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-200">
              {sortedList.map((f, idx) => {
                const isPowerhouse = f.allTime.winPct >= 0.65;
                const isReigning = f.key === 'MattyiceR';

                return (
                  <tr
                    key={f.key}
                    className="hover:bg-slate-800/40 transition duration-150 group"
                  >
                    {/* Rank & Manager */}
                    <td className="py-4 px-4 sm:px-6 flex items-center space-x-3">
                      <span className="font-display font-black text-base text-slate-500 w-5">
                        #{idx + 1}
                      </span>
                      <img
                        src={f.customLogoUrl || f.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={f.name}
                        className="w-10 h-10 rounded-xl border border-slate-700 object-cover flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition">
                            {f.name}
                          </span>
                          {f.role === 'Commissioner' && (
                            <span className="text-[9px] bg-cyan-950 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-800">
                              COMMISH
                            </span>
                          )}
                          {isReigning && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40">
                              CHAMP
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{f.teamName}</span>
                      </div>
                    </td>

                    {/* Record */}
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {f.allTime.wins}-{f.allTime.losses}
                      {f.allTime.ties > 0 ? `-${f.allTime.ties}` : ''}
                    </td>

                    {/* Win % */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-bold ${isPowerhouse ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {(f.allTime.winPct * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              isPowerhouse ? 'bg-emerald-400' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, f.allTime.winPct * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Points For */}
                    <td className="py-4 px-4 font-mono text-cyan-300 font-semibold">
                      {f.allTime.pointsFor.toLocaleString()}
                    </td>

                    {/* Points Against */}
                    <td className="py-4 px-4 font-mono text-slate-400">
                      {f.allTime.pointsAgainst.toLocaleString()}
                    </td>

                    {/* High Score */}
                    <td className="py-4 px-4 font-mono text-amber-300 font-semibold">
                      {f.allTime.highScore}
                    </td>

                    {/* Titles */}
                    <td className="py-4 px-4 text-center">
                      {f.allTime.championships > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-xs space-x-1">
                          <span>🏆</span>
                          <span>{f.allTime.championships}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Superlatives & Record Book */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highest Single Game Scores */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <Flame className="w-5 h-5" />
            <h3 className="font-bold font-display text-lg tracking-wide uppercase text-white">
              All-Time Single-Game Scoring Records
            </h3>
          </div>
          <div className="space-y-2">
            {records.highestScores.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-black text-amber-400">#{i + 1}</span>
                  <div>
                    <span className="font-bold text-white">{franchises[rec.team]?.name || rec.team}</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">vs {franchises[rec.vs]?.name || rec.vs} ({rec.year} Wk {rec.week})</span>
                  </div>
                </div>
                <span className="font-mono font-black text-amber-300 text-sm">{rec.pts} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biggest Blowouts */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-rose-400">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold font-display text-lg tracking-wide uppercase text-white">
              Biggest Historical Beatdowns (Margin)
            </h3>
          </div>
          <div className="space-y-2">
            {records.biggestBlowouts.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-black text-rose-400">#{i + 1}</span>
                  <div>
                    <span className="font-bold text-white">{franchises[rec.team1]?.name || rec.team1}</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">beat {franchises[rec.team2]?.name || rec.team2} ({rec.year} Wk {rec.week})</span>
                  </div>
                </div>
                <span className="font-mono font-black text-rose-300 text-sm">+{rec.margin} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closest Nailbiters */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Award className="w-5 h-5" />
            <h3 className="font-bold font-display text-lg tracking-wide uppercase text-white">
              Closest Heartbreakers (Smallest Margin)
            </h3>
          </div>
          <div className="space-y-2">
            {records.closestNailbiters.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-black text-cyan-400">#{i + 1}</span>
                  <div>
                    <span className="font-bold text-white">{franchises[rec.winner]?.name || rec.winner} won</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">({rec.pts1} to {rec.pts2}, {rec.year} Wk {rec.week})</span>
                  </div>
                </div>
                <span className="font-mono font-black text-cyan-300 text-sm">{rec.margin} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Single Game Scores */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldAlert className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold font-display text-lg tracking-wide uppercase text-slate-300">
              The Graveyard: Lowest Scoring Weeks
            </h3>
          </div>
          <div className="space-y-2">
            {records.lowestScores.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-black text-slate-500">#{i + 1}</span>
                  <div>
                    <span className="font-bold text-white">{franchises[rec.team]?.name || rec.team}</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">({rec.year} Wk {rec.week})</span>
                  </div>
                </div>
                <span className="font-mono font-black text-slate-400 text-sm">{rec.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
