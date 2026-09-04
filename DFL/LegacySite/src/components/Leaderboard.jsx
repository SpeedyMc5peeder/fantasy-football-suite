import React, { useState } from 'react';
import { BarChart3, Zap, Flame, ShieldAlert, Award, ArrowUpDown, ChevronDown } from 'lucide-react';

function getHistoricalOwnerName(franchiseKey, year, franchises) {
  const yr = Number(year);
  if (franchiseKey === 'Tklumb86' && yr <= 2025) return 'Jake';
  if (franchiseKey === 'LMcVicker' && yr === 2022) return 'Tre';
  return franchises?.[franchiseKey]?.name || franchiseKey;
}

function getHistoricalTeamName(franchiseKey, year, franchises) {
  const yr = Number(year);
  if (franchiseKey === 'Tklumb86' && yr <= 2025) return 'Abusement Park';
  if (franchiseKey === 'LMcVicker' && yr === 2022) return 'Team Pupinsuds';
  return franchises?.[franchiseKey]?.teamName || franchises?.[franchiseKey]?.name || franchiseKey;
}

export default function Leaderboard({ franchises, records }) {
  const [sortField, setSortField] = useState('wins');
  const [sortAsc, setSortAsc] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState('cards'); // 'cards' or 'table'

  // Convert franchises into an array for sorting
  const franchiseList = Object.entries(franchises).map(([key, f]) => ({
    key,
    ...f,
  }));

  const sortedList = [...franchiseList].sort((a, b) => {
    let aVal = a.allTime[sortField];
    let bVal = b.allTime[sortField];

    if (sortField === 'name') {
      aVal = a.teamName;
      bVal = b.teamName;
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (aVal === bVal) {
      return b.allTime.pointsFor - a.allTime.pointsFor;
    }

    return sortAsc ? aVal - bVal : bVal - aVal;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Historical Standings & Superlatives</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            LEAGUE ALL-TIME LEADERBOARD
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Regular season performance aggregated across 5 complete Sleeper seasons (2022–2026)
          </p>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold self-start">
          <button
            onClick={() => setMobileViewMode('cards')}
            className={`px-3 py-1 rounded-lg transition ${
              mobileViewMode === 'cards' ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cards View
          </button>
          <button
            onClick={() => setMobileViewMode('table')}
            className={`px-3 py-1 rounded-lg transition ${
              mobileViewMode === 'table' ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Mobile Card Stack (< md screens) */}
      {mobileViewMode === 'cards' && (
        <div className="block md:hidden space-y-3">
          {sortedList.map((f, idx) => {
            const isPowerhouse = f.allTime.winPct >= 0.65;
            const isReigning = f.key === 'MattyiceR';

            return (
              <div
                key={f.key}
                className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-display font-black text-lg text-slate-500 w-6 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <img
                      src={f.customLogoUrl || f.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                      alt={f.teamName}
                      className="w-11 h-11 rounded-xl border border-slate-700 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-bold text-sm text-white font-display truncate">
                          {f.teamName}
                        </span>
                        {f.role === 'Commissioner' && (
                          <span className="text-[9px] bg-cyan-950 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-800 flex-shrink-0">
                            COMMISH
                          </span>
                        )}
                        {isReigning && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40 flex-shrink-0">
                            CHAMP
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">Mgr: {f.name}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-black text-sm text-white block">
                      {f.allTime.wins}-{f.allTime.losses}
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${isPowerhouse ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {(f.allTime.winPct * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 3-Column Mobile Stat Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Points For</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">{f.allTime.pointsFor.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">High Score</span>
                    <span className="font-mono font-bold text-amber-300 text-xs">{f.allTime.highScore}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Titles</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">{f.allTime.championships} 🏆</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Standings Table (always on desktop; toggleable on mobile) */}
      <div className={`glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl ${mobileViewMode === 'cards' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Franchise</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('wins')}>
                  <div className="flex items-center space-x-1">
                    <span>Record</span>
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
                    <span>Points For</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('pointsAgainst')}>
                  <div className="flex items-center space-x-1">
                    <span>Points Against</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('highScore')}>
                  <div className="flex items-center space-x-1">
                    <span>High Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('championships')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Titles</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedList.map((f, idx) => {
                const isPowerhouse = f.allTime.winPct >= 0.65;
                const isReigning = f.key === 'MattyiceR';

                return (
                  <tr
                    key={f.key}
                    className="hover:bg-slate-800/40 transition duration-150 group"
                  >
                    {/* Rank & Franchise */}
                    <td className="py-4 px-4 sm:px-6 min-w-[220px]">
                      <div className="flex items-center space-x-3">
                        <span className="font-display font-black text-base text-slate-500 w-5 flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <img
                          src={f.customLogoUrl || f.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                          alt={f.teamName}
                          className="w-10 h-10 rounded-xl border border-slate-700 object-cover flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition font-display tracking-wide">
                              {f.teamName}
                            </span>
                            {f.role === 'Commissioner' && (
                              <span className="text-[9px] bg-cyan-950 text-cyan-300 font-extrabold px-1.5 py-0.5 rounded border border-cyan-800 flex-shrink-0">
                                COMMISH
                              </span>
                            )}
                            {isReigning && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40 flex-shrink-0">
                                CHAMP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">Mgr: {f.name}</span>
                        </div>
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
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="font-mono font-black text-amber-400 flex-shrink-0">#{i + 1}</span>
                  <div className="truncate">
                    <span className="font-bold text-white">{getHistoricalTeamName(rec.team, rec.year, franchises)}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({getHistoricalOwnerName(rec.team, rec.year, franchises)})</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">vs {getHistoricalTeamName(rec.vs, rec.year, franchises)} ({getHistoricalOwnerName(rec.vs, rec.year, franchises)}) • {rec.year} Wk {rec.week}</span>
                  </div>
                </div>
                <span className="font-mono font-black text-amber-300 text-sm flex-shrink-0 ml-2">{rec.pts} pts</span>
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
            {records.biggestBlowouts.slice(0, 5).map((rec, i) => {
              const winner = rec.pts1 >= rec.pts2 ? rec.team1 : rec.team2;
              const loser = rec.pts1 >= rec.pts2 ? rec.team2 : rec.team1;
              return (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono font-black text-rose-400 flex-shrink-0">#{i + 1}</span>
                    <div className="truncate">
                      <span className="font-bold text-white">{getHistoricalTeamName(winner, rec.year, franchises)}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({getHistoricalOwnerName(winner, rec.year, franchises)})</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">beat {getHistoricalTeamName(loser, rec.year, franchises)} ({getHistoricalOwnerName(loser, rec.year, franchises)}) • {rec.year} Wk {rec.week}</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-rose-300 text-sm flex-shrink-0 ml-2">+{rec.margin} pts</span>
                </div>
              );
            })}
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
            {records.closestNailbiters.slice(0, 5).map((rec, i) => {
              const isTeam1Winner = rec.pts1 >= rec.pts2;
              const winner = isTeam1Winner ? rec.team1 : rec.team2;
              const loser = isTeam1Winner ? rec.team2 : rec.team1;
              const winPts = Math.max(rec.pts1, rec.pts2);
              const losePts = Math.min(rec.pts1, rec.pts2);
              return (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono font-black text-cyan-400 flex-shrink-0">#{i + 1}</span>
                    <div className="truncate">
                      <span className="font-bold text-white">{getHistoricalTeamName(winner, rec.year, franchises)}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({getHistoricalOwnerName(winner, rec.year, franchises)}) won</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">vs {getHistoricalTeamName(loser, rec.year, franchises)} ({getHistoricalOwnerName(loser, rec.year, franchises)}) • {winPts} to {losePts} ({rec.year} Wk {rec.week})</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-cyan-300 text-sm flex-shrink-0 ml-2">{rec.margin} pts</span>
                </div>
              );
            })}
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
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="font-mono font-black text-slate-500 flex-shrink-0">#{i + 1}</span>
                  <div className="truncate">
                    <span className="font-bold text-white">{getHistoricalTeamName(rec.team, rec.year, franchises)}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({getHistoricalOwnerName(rec.team, rec.year, franchises)})</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">{rec.vs ? `vs ${getHistoricalTeamName(rec.vs, rec.year, franchises)} (${getHistoricalOwnerName(rec.vs, rec.year, franchises)}) • ` : ''}({rec.year} Wk {rec.week})</span>
                  </div>
                </div>
                <span className="font-mono font-black text-slate-400 text-sm flex-shrink-0 ml-2">{rec.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
