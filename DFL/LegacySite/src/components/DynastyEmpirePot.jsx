import React, { useState, useMemo } from 'react';
import { Crown, Trophy, Coins, Shield, Swords, Sparkles, ChevronDown, ChevronUp, Info, CheckCircle2, History, Star, Users } from 'lucide-react';
import historicalMvps from '../data/historical_mvps.json';
import RosterModal from './RosterModal';

const CYCLES = [
  {
    id: 'cycle-2',
    name: 'Cycle II (2026–2029)',
    status: 'Current Cycle',
    isCurrent: true,
    hasMoney: true,
    years: ['2026', '2027', '2028', '2029'],
    yearProgress: 'Year 1 of 4',
    potTotal: 400,
    lockedPot: 100,
    firstPlacePayout: 300,
    secondPlacePayout: 100,
    description: 'The official 4-year dynasty cycle. Proposed $10/year buy-in per manager accumulates into the $400 champion vault.',
  },
  {
    id: 'cycle-1',
    name: 'Cycle I (2022–2025)',
    status: 'Archived • Inaugural Era',
    isCurrent: false,
    hasMoney: false,
    years: ['2022', '2023', '2024', '2025'],
    yearProgress: 'Completed (4 of 4 Years)',
    potTotal: 0,
    lockedPot: 0,
    firstPlacePayout: 0,
    secondPlacePayout: 0,
    description: 'The inaugural 4-year cycle simulation using official Sleeper records (Points-only simulation • No monetary buy-in was collected). Features the historic 1-point finish for 2nd place!',
  },
];

export default function DynastyEmpirePot({ franchises, seasons }) {
  const [selectedCycleId, setSelectedCycleId] = useState('cycle-2');
  const [expandedTeamKey, setExpandedTeamKey] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [selectedRosterKey, setSelectedRosterKey] = useState(null);
  const [mobileViewMode, setMobileViewMode] = useState('cards'); // 'cards' | 'table'

  const currentCycle = CYCLES.find(c => c.id === selectedCycleId) || CYCLES[0];

  // Compute standings for the selected cycle
  const cycleStandings = useMemo(() => {
    const stats = {};

    Object.keys(franchises || {}).forEach(k => {
      let displayName = franchises[k]?.name || k;
      let displayTeam = franchises[k]?.teamName || k;
      let displayAvatar = franchises[k]?.customLogoUrl || franchises[k]?.avatar;

      // In Cycle 1 (2022-2025), Jake played all 4 seasons with Abusement Park
      if (selectedCycleId === 'cycle-1') {
        if (k === 'Tklumb86') {
          displayName = 'Jake';
          displayTeam = 'Abusement Park';
          displayAvatar = 'https://sleepercdn.com/avatars/thumbs/74d5807529717f89b1f01770afe234e1';
        }
      }

      stats[k] = {
        key: k,
        name: displayName,
        teamName: displayTeam,
        avatar: displayAvatar,
        customLogoUrl: franchises[k]?.customLogoUrl,
        regWins: 0,
        regLosses: 0,
        totalPF: 0,
        playoffWins: 0,
        championships: 0,
        points: 0,
        yearly: {},
      };
      currentCycle.years.forEach(yr => {
        stats[k].yearly[yr] = {
          wins: 0,
          losses: 0,
          pf: 0,
          playoffWins: 0,
          isChampion: false,
          points: 0,
        };
      });
    });

    currentCycle.years.forEach(year => {
      const seasonData = seasons?.find(s => String(s.year) === String(year));
      if (!seasonData) return;

      // Regular season wins & points
      if (seasonData.standings) {
        seasonData.standings.forEach(st => {
          const fKey = st.franchiseKey;
          if (stats[fKey]) {
            stats[fKey].regWins += st.wins || 0;
            stats[fKey].regLosses += st.losses || 0;
            stats[fKey].totalPF += st.pf || 0;

            if (stats[fKey].yearly[year]) {
              stats[fKey].yearly[year].wins = st.wins || 0;
              stats[fKey].yearly[year].losses = st.losses || 0;
              stats[fKey].yearly[year].pf = st.pf || 0;
            }
          }
        });
      }

      // Playoff wins from winnersBracket
      if (seasonData.winnersBracket) {
        seasonData.winnersBracket.forEach(match => {
          const winnerKey = match.winner?.franchiseKey;
          if (winnerKey && stats[winnerKey]) {
            stats[winnerKey].playoffWins += 1;
            if (stats[winnerKey].yearly[year]) {
              stats[winnerKey].yearly[year].playoffWins += 1;
            }
          }
        });
      }

      // Championship bonus
      if (seasonData.champion && stats[seasonData.champion]) {
        stats[seasonData.champion].championships += 1;
        if (stats[seasonData.champion].yearly[year]) {
          stats[seasonData.champion].yearly[year].isChampion = true;
        }
      }
    });

    // Calculate Dynasty Points:
    // 1 pt per Regular Season Win
    // 2 pts per Playoff Win
    // 4 pts per Championship Title
    Object.values(stats).forEach(s => {
      s.points = (s.regWins * 1) + (s.playoffWins * 2) + (s.championships * 4);

      currentCycle.years.forEach(yr => {
        if (s.yearly[yr]) {
          s.yearly[yr].points =
            (s.yearly[yr].wins * 1) +
            (s.yearly[yr].playoffWins * 2) +
            (s.yearly[yr].isChampion ? 4 : 0);
        }
      });
    });

    // Sort by Total Points (descending), Tiebreaker: 4-Year Total PF (descending)
    return Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.totalPF - a.totalPF;
    });
  }, [franchises, seasons, currentCycle, selectedCycleId]);

  const leader = cycleStandings[0];
  const runnerUp = cycleStandings[1];
  const thirdPlace = cycleStandings[2];

  return (
    <div className="space-y-8">
      {/* Header & Cycle Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>4-Year Quadrennial Dynasty Cup</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white flex items-center gap-3">
            <span>THE DYNASTY CUP</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            A continuous 4-year cycle crowning the most dominant franchise in DFL. Regular season grit meets playoff execution.
          </p>
        </div>

        {/* Cycle Switcher Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 flex-shrink-0">
          {CYCLES.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCycleId(c.id);
                setExpandedTeamKey(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                selectedCycleId === c.id
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{c.name}</span>
              {c.isCurrent ? (
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${selectedCycleId === c.id ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  Live
                </span>
              ) : (
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${selectedCycleId === c.id ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'}`}>
                  Archive
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Vault Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 shadow-2xl dynasty-vault-card">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {currentCycle.name} • {currentCycle.status}
              </span>
              <span className="text-slate-400 text-xs font-mono font-bold">
                {currentCycle.yearProgress}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
              {currentCycle.isCurrent ? 'The 2026–2029 Dynasty Chase' : 'Cycle I Historic Era Recap'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentCycle.description}
            </p>

            {/* Payout Distribution or Champion Showcase */}
            {currentCycle.hasMoney ? (
              <div className="flex items-center space-x-3 pt-2">
                <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-sm dynasty-payout-pill">
                  <span className="text-amber-400 text-sm">🥇</span>
                  <span className="text-xs font-bold text-white">1st Place:</span>
                  <span className="text-xs font-mono font-black text-amber-400">${currentCycle.firstPlacePayout}</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-sm dynasty-payout-pill">
                  <span className="text-slate-300 text-sm">🥈</span>
                  <span className="text-xs font-bold text-white">2nd Place:</span>
                  <span className="text-xs font-mono font-black text-slate-300">${currentCycle.secondPlacePayout}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pt-2">
                <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-sm dynasty-payout-pill">
                  <span className="text-amber-400 text-sm">🥇</span>
                  <span className="text-xs font-bold text-white">Cycle Champion:</span>
                  <span className="text-xs font-display font-black text-amber-400">{leader?.teamName}</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-sm dynasty-payout-pill">
                  <span className="text-slate-300 text-sm">🥈</span>
                  <span className="text-xs font-bold text-white">Runner-Up:</span>
                  <span className="text-xs font-display font-black text-slate-300">{runnerUp?.teamName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vault Meter or Progress Display */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-amber-500/30 min-w-[260px] text-center space-y-3 shadow-inner dynasty-vault-meter">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>{currentCycle.hasMoney ? 'Vault Bank' : 'Cycle Timeline'}</span>
              {currentCycle.hasMoney ? (
                <span className="font-mono text-amber-400 font-black">${currentCycle.lockedPot} / ${currentCycle.potTotal}</span>
              ) : (
                <span className="font-mono text-emerald-400 font-black">4 of 4 Seasons (100%)</span>
              )}
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: currentCycle.hasMoney ? `${(currentCycle.lockedPot / currentCycle.potTotal) * 100}%` : '100%' }}
              />
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {currentCycle.hasMoney
                ? 'Proposed $10 collected annually from each of the 10 franchises.'
                : 'Points-only simulation. Congratulations to our inaugural podium winners!'}
            </p>
          </div>
        </div>
      </div>

      {/* Rules Accordion Toggle */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-xs dynasty-rules-card">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between font-bold text-slate-300 hover:text-white transition"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-sm">How Dynasty Cup Points Are Awarded (Official Scoring Formula)</span>
          </div>
          {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRules && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>Regular Season Win</span>
              </div>
              <div className="text-lg font-mono font-black text-white">+1 Point</div>
              <p className="text-[11px] text-slate-400">Awarded for every weekly regular season victory (14 games/yr).</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
                <Swords className="w-3.5 h-3.5" />
                <span>Playoff Win</span>
              </div>
              <div className="text-lg font-mono font-black text-white">+2 Points</div>
              <p className="text-[11px] text-slate-400">Earned for every win in Quarterfinals or Semifinals.</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-amber-500/30 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>DFL Championship</span>
              </div>
              <div className="text-lg font-mono font-black text-white">+4 Points</div>
              <p className="text-[11px] text-slate-400">Bonus points awarded to the crowned league champion.</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Official Tiebreaker</span>
              </div>
              <div className="text-lg font-mono font-black text-white">Cumulative PF</div>
              <p className="text-[11px] text-slate-400">Total 4-year regular season points scored breaks all ties.</p>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gold Podium - 1st */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-900 border-2 border-amber-500/50 flex flex-col items-center text-center space-y-3 shadow-xl relative dynasty-podium-gold">
          <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow font-display">
            {currentCycle.hasMoney ? `🥇 1st Place ($${currentCycle.firstPlacePayout})` : '🥇 1st Place (Champion)'}
          </div>
          <img
            src={leader?.avatar || leader?.customLogoUrl || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
            alt={leader?.teamName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md mt-2"
          />
          <div>
            <h3 className="font-black text-base text-white font-display">{leader?.teamName}</h3>
            <p className="text-xs text-slate-400">{leader?.name}</p>
          </div>
          <div className="text-2xl font-mono font-black text-amber-400">
            {leader?.points} <span className="text-xs text-slate-400 uppercase font-sans">Points</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {leader?.regWins}W • {leader?.playoffWins} Playoff W • {leader?.championships} 🏆
          </div>
        </div>

        {/* Silver Podium - 2nd */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-400/15 via-slate-900/90 to-slate-900 border border-slate-700 flex flex-col items-center text-center space-y-3 shadow-lg relative dynasty-podium-silver">
          <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black uppercase tracking-wider shadow font-display">
            {currentCycle.hasMoney ? `🥈 2nd Place ($${currentCycle.secondPlacePayout})` : '🥈 2nd Place (Runner-Up)'}
          </div>
          <img
            src={runnerUp?.avatar || runnerUp?.customLogoUrl || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
            alt={runnerUp?.teamName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-400 shadow-md mt-2"
          />
          <div>
            <h3 className="font-black text-base text-white font-display">{runnerUp?.teamName}</h3>
            <p className="text-xs text-slate-400">{runnerUp?.name}</p>
          </div>
          <div className="text-2xl font-mono font-black text-slate-200">
            {runnerUp?.points} <span className="text-xs text-slate-400 uppercase font-sans">Points</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {runnerUp?.regWins}W • {runnerUp?.playoffWins} Playoff W • {runnerUp?.championships} 🏆
          </div>
        </div>

        {/* Bronze Podium - 3rd */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-700/15 via-slate-900/90 to-slate-900 border border-amber-700/40 flex flex-col items-center text-center space-y-3 shadow-lg relative dynasty-podium-bronze">
          <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[10px] font-black uppercase tracking-wider shadow font-display">
            🥉 3rd Place (Honorable)
          </div>
          <img
            src={thirdPlace?.avatar || thirdPlace?.customLogoUrl || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
            alt={thirdPlace?.teamName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-700 shadow-md mt-2"
          />
          <div>
            <h3 className="font-black text-base text-white font-display">{thirdPlace?.teamName}</h3>
            <p className="text-xs text-slate-400">{thirdPlace?.name}</p>
          </div>
          <div className="text-2xl font-mono font-black text-amber-500">
            {thirdPlace?.points} <span className="text-xs text-slate-400 uppercase font-sans">Points</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {thirdPlace?.regWins}W • {thirdPlace?.playoffWins} Playoff W • {thirdPlace?.championships} 🏆
          </div>
        </div>
      </div>

      {/* Official 4-Year Dynasty Standings Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 shadow-xl overflow-hidden dynasty-standings-card">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-white font-display flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{currentCycle.name} Official Cumulative Standings</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any team row to inspect year-by-year points accumulation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile View Toggle */}
            <div className="flex md:hidden items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setMobileViewMode('cards')}
                className={`px-3 py-1 rounded-lg transition ${
                  mobileViewMode === 'cards' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setMobileViewMode('table')}
                className={`px-3 py-1 rounded-lg transition ${
                  mobileViewMode === 'table' ? 'bg-amber-500 text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table View
              </button>
            </div>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              10 Franchises Tracked
            </span>
          </div>
        </div>

        {/* Mobile Standings Card Stack (< md screens) */}
        {mobileViewMode === 'cards' && (
          <div className="block md:hidden p-3 space-y-3">
            {cycleStandings.map((s, idx) => {
              const rank = idx + 1;
              const isExpanded = expandedTeamKey === s.key;
              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <div
                  key={`m-cup-${s.key}`}
                  className={`p-4 rounded-2xl border transition ${
                    isGold
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : isSilver
                      ? 'bg-slate-300/5 border-slate-700'
                      : isBronze
                      ? 'bg-amber-900/10 border-amber-800/40'
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}
                >
                  {/* Top Row: Rank, Avatar, Team & Roster Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="font-mono font-black text-sm w-7 flex-shrink-0">
                        {isGold ? '🥇 1' : isSilver ? '🥈 2' : isBronze ? '🥉 3' : `#${rank}`}
                      </span>
                      <img
                        src={s.avatar || s.customLogoUrl || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={s.teamName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white block text-sm truncate font-display">
                          {s.teamName}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {s.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-mono font-black text-amber-400">
                        {s.points} <span className="text-[10px] text-slate-400 font-sans">pts</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRosterKey(s.key)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 ml-auto"
                      >
                        <Users className="w-3 h-3" />
                        <span>Roster</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Stat Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-800/80 text-center text-xs mt-3">
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Reg W</span>
                      <span className="font-mono font-bold text-slate-300 text-xs">{s.regWins}</span>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-purple-400 uppercase font-bold block">Playoff</span>
                      <span className="font-mono font-bold text-purple-300 text-xs">+{s.playoffWins * 2}</span>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-amber-400 uppercase font-bold block">Titles</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {s.championships > 0 ? `${s.championships} 🏆` : '—'}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">4-Yr PF</span>
                      <span className="font-mono font-bold text-slate-300 text-xs">
                        {Math.round(s.totalPF).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Expand Year-by-Year Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedTeamKey(isExpanded ? null : s.key)}
                    className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between hover:text-white transition"
                  >
                    <span>{isExpanded ? 'Hide Annual Breakdown' : 'View 4-Year Breakdown & MVPs'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expandable Breakdown on Mobile */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {currentCycle.years.map(yr => {
                          const yrData = s.yearly[yr];
                          const teamMvp = historicalMvps[yr]?.[s.key];

                          return (
                            <div key={`m-yr-${yr}`} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                <span>{yr}</span>
                                {yrData?.isChampion && <span className="text-amber-400">🏆</span>}
                              </div>
                              <div className="text-base font-mono font-black text-amber-300">
                                {yrData?.points || 0} <span className="text-[9px] text-slate-500 font-sans font-bold">pts</span>
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                {yrData?.wins || 0}-{yrData?.losses || 0} • {yrData?.playoffWins || 0} Playoff W
                              </div>
                              {teamMvp && (
                                <div className="pt-1 mt-1 border-t border-slate-800/80 flex items-center space-x-1.5">
                                  <img
                                    src={`https://sleepercdn.com/content/nfl/players/thumb/${teamMvp.playerId}.jpg`}
                                    onError={(e) => { e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'; }}
                                    alt=""
                                    className="w-5 h-5 rounded-full object-cover border border-amber-500/40 flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[9px] font-bold text-white block truncate">{teamMvp.name}</span>
                                    <span className="text-[8px] text-slate-400 font-mono block">{teamMvp.points} pts</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop Table View (always on desktop; toggleable on mobile) */}
        <div className={`overflow-x-auto ${mobileViewMode === 'cards' ? 'hidden md:block' : 'block'}`}>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Rank</th>
                <th className="py-3 px-4 min-w-[200px] whitespace-nowrap">Franchise & Manager</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Reg Wins (1pt)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Playoff Wins (2pt)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Titles (4pt)</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Total Points</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">4-Year PF</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">{currentCycle.hasMoney ? 'Payout' : 'Payout'}</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cycleStandings.map((s, idx) => {
                const rank = idx + 1;
                const isExpanded = expandedTeamKey === s.key;
                const isGold = rank === 1;
                const isSilver = rank === 2;
                const isBronze = rank === 3;

                return (
                  <React.Fragment key={s.key}>
                    <tr
                      onClick={() => setExpandedTeamKey(isExpanded ? null : s.key)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        isGold ? 'bg-amber-500/5' : isSilver ? 'bg-slate-300/5' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-mono font-black">
                        {isGold ? (
                          <span className="text-amber-400 flex items-center space-x-1 font-bold">
                            <span>🥇 1</span>
                          </span>
                        ) : isSilver ? (
                          <span className="text-slate-300 flex items-center space-x-1 font-bold">
                            <span>🥈 2</span>
                          </span>
                        ) : isBronze ? (
                          <span className="text-amber-600 flex items-center space-x-1 font-bold">
                            <span>🥉 3</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">{rank}</span>
                        )}
                      </td>

                      {/* Team & Manager */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={s.avatar || s.customLogoUrl || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                            alt={s.teamName}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white block text-sm">{s.teamName}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRosterKey(s.key);
                                }}
                                title="Scout Roster & Draft Capital"
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold px-1.5 py-0.2 rounded bg-cyan-950/40 border border-cyan-800/60 transition flex items-center space-x-1"
                              >
                                <Users className="w-2.5 h-2.5" />
                                <span>Roster</span>
                              </button>
                            </div>
                            <span className="text-[11px] text-slate-400">{s.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Reg Wins */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-300">
                        {s.regWins} <span className="text-[10px] text-slate-500 font-normal">({s.regWins} pts)</span>
                      </td>

                      {/* Playoff Wins */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-purple-300">
                        {s.playoffWins} <span className="text-[10px] text-purple-500/80 font-normal">({s.playoffWins * 2} pts)</span>
                      </td>

                      {/* Titles */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400">
                        {s.championships > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px]">
                            {s.championships} 🏆 (+{s.championships * 4} pts)
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-4 text-center font-mono font-black text-base text-amber-300">
                        {s.points}
                      </td>

                      {/* 4-Year PF */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-300">
                        {s.totalPF.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>

                      {/* Payout */}
                      <td className="py-3.5 px-4 text-center font-mono font-black">
                        {currentCycle.hasMoney ? (
                          isGold ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px]">
                              ${currentCycle.firstPlacePayout}
                            </span>
                          ) : isSilver ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px]">
                              ${currentCycle.secondPlacePayout}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )
                        ) : (
                          <span className="text-slate-500 text-[11px] font-semibold">N/A</span>
                        )}
                      </td>

                      {/* Expand Details button */}
                      <td className="py-3.5 px-3 text-center text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                      </td>
                    </tr>

                    {/* Expandable Year-by-Year Breakdown */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan="9" className="p-4 sm:p-5 border-y border-slate-800/80">
                          <div className="space-y-3 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                              <span>Year-by-Year Points Accumulation: {s.teamName}</span>
                              <span className="text-amber-400 font-mono">Total Points: {s.points} pts</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {currentCycle.years.map(yr => {
                                const yrData = s.yearly[yr];
                                return (
                                  <div key={yr} className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5 text-center">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                      <span>{yr} Season</span>
                                      {yrData?.isChampion && <span className="text-amber-400 text-xs">🏆 Champ</span>}
                                    </div>
                                    <div className="text-xl font-mono font-black text-amber-300">
                                      {yrData?.points || 0} <span className="text-[10px] text-slate-500 font-sans font-bold">pts</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                                      <div>Record: {yrData?.wins || 0}-{yrData?.losses || 0} ({yrData?.wins || 0} pts)</div>
                                      <div>Playoffs: {yrData?.playoffWins || 0} W ({(yrData?.playoffWins || 0) * 2} pts)</div>
                                      <div>PF: {yrData?.pf?.toLocaleString() || 0}</div>
                                    </div>
                                    {historicalMvps[yr]?.[s.key] && (
                                      <div className="pt-2 mt-2 border-t border-slate-800/80 text-left flex items-center space-x-2">
                                        <img
                                          src={`https://sleepercdn.com/content/nfl/players/thumb/${historicalMvps[yr][s.key].playerId}.jpg`}
                                          onError={(e) => {
                                            e.target.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp';
                                          }}
                                          alt={historicalMvps[yr][s.key].name}
                                          className="w-7 h-7 rounded-lg bg-slate-800 border border-amber-500/40 object-cover flex-shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                                            <span>⭐ Team MVP</span>
                                          </div>
                                          <div className="text-[10px] font-bold text-white truncate leading-tight">
                                            {historicalMvps[yr][s.key].name}
                                          </div>
                                          <div className="text-[9px] text-slate-400 font-mono">
                                            {historicalMvps[yr][s.key].position} • {historicalMvps[yr][s.key].points} pts
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
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
