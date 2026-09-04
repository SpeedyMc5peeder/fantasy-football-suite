import React, { useState } from 'react';
import { DollarSign, PlusCircle, CheckCircle2, Clock, XCircle, AlertCircle, Users, ArrowRight, Check, Trophy, Edit3, Trash2 } from 'lucide-react';

export const parseStakeAmount = (stakeStr) => {
  if (!stakeStr) return 10;
  const match = String(stakeStr).match(/\$?(\d+(?:\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : 10;
};

export const computePoolStats = (bet) => {
  const stakeAmount = parseStakeAmount(bet.stakes);
  const rawTakers = bet.takers || [];
  const normalizedTakers = rawTakers.map(t => (typeof t === 'string' ? { franchiseKey: t, side: 'TARGET' } : t));
  
  const sideAKeys = Array.from(new Set([bet.createdBy, ...normalizedTakers.filter(t => t.side === 'CREATOR').map(t => t.franchiseKey)]));
  const sideBKeys = Array.from(new Set(normalizedTakers.filter(t => t.side === 'TARGET').map(t => t.franchiseKey)));

  const countA = sideAKeys.length;
  const countB = sideBKeys.length;
  const totalCount = countA + countB;
  const totalPot = totalCount * stakeAmount;

  // Potential payout if Side A wins
  const sideAPayout = countA > 0 ? (totalPot / countA) : 0;
  const sideAProfit = sideAPayout - stakeAmount;

  // Potential payout if Side B wins
  const sideBPayout = countB > 0 ? (totalPot / countB) : 0;
  const sideBProfit = sideBPayout - stakeAmount;

  return {
    stakeAmount,
    sideAKeys,
    sideBKeys,
    countA,
    countB,
    totalCount,
    totalPot,
    sideAPayout,
    sideAProfit,
    sideBPayout,
    sideBProfit,
  };
};

export default function BettingLedger({
  bets,
  franchises,
  currentUser,
  onOpenLogin,
  onCreateBet,
  onAcceptBet,
  onSettleBet,
  onUpdateBet,
  onDeleteBet,
}) {
  const [filter, setFilter] = useState('active'); // 'active', 'settled', 'debts'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Bet Form State
  const [targetUser, setTargetUser] = useState('ALL');
  const [openType, setOpenType] = useState('FIRST_TO_TAKE'); // 'FIRST_TO_TAKE' | 'GROUP_POOL'
  const [title, setTitle] = useState('');
  const [terms, setTerms] = useState('');
  const [stakes, setStakes] = useState('$10');
  const [creatorPick, setCreatorPick] = useState('');
  const [targetPick, setTargetPick] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editingBet, setEditingBet] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [editStakes, setEditStakes] = useState('');
  const [editCreatorPick, setEditCreatorPick] = useState('');
  const [editTargetPick, setEditTargetPick] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Settle modal state
  const [settlingBet, setSettlingBet] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState('');

  const handleOpenCreate = () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setIsModalOpen(true);
  };

  const handleSubmitBet = async (e) => {
    e.preventDefault();
    if (!title || !stakes) return;

    setSubmitting(true);
    await onCreateBet({
      createdBy: currentUser.franchiseKey,
      targetUser,
      openType: targetUser === 'ALL' ? openType : 'DIRECT',
      title,
      terms,
      stakes,
      creatorPick: creatorPick || currentUser.name,
      targetPick: targetPick || (targetUser === 'ALL' ? 'Taker' : franchises[targetUser]?.name),
    });

    setTitle('');
    setTerms('');
    setStakes('$10');
    setCreatorPick('');
    setTargetPick('');
    setOpenType('FIRST_TO_TAKE');
    setSubmitting(false);
    setIsModalOpen(false);
  };

  const handleConfirmSettle = async () => {
    if (!settlingBet || !selectedWinner) return;
    await onSettleBet(settlingBet.id, selectedWinner, currentUser?.franchiseKey);
    setSettlingBet(null);
    setSelectedWinner('');
  };

  const handleOpenEdit = (bet) => {
    setEditingBet(bet);
    setEditTitle(bet.title || '');
    setEditTerms(bet.terms || '');
    setEditStakes(bet.stakes || '');
    setEditCreatorPick(bet.creatorPick || '');
    setEditTargetPick(bet.targetPick || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBet || !editTitle || !editStakes) return;
    setSavingEdit(true);
    await onUpdateBet({
      betId: editingBet.id,
      requesterFranchise: currentUser?.franchiseKey,
      title: editTitle,
      terms: editTerms,
      stakes: editStakes,
      creatorPick: editCreatorPick,
      targetPick: editTargetPick,
    });
    setSavingEdit(false);
    setEditingBet(null);
  };

  const handleDeleteClick = async (betId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this bet? This action cannot be undone.')) {
      return;
    }
    await onDeleteBet(betId, currentUser?.franchiseKey);
  };

  // Filtered bets
  const activeBets = bets.filter(b => b.status === 'OPEN' || b.status === 'ACCEPTED' || b.status === 'PENDING_ACCEPTANCE');
  const settledBets = bets.filter(b => b.status === 'SETTLED');

  // Compute Debt / Settlement Balance Sheet with Pari-Mutuel P&L
  const balanceSheet = {};
  for (const fKey of Object.keys(franchises)) {
    balanceSheet[fKey] = { wins: 0, losses: 0, netCash: 0, totalWagered: 0 };
  }

  settledBets.forEach(b => {
    const stake = parseStakeAmount(b.stakes);
    if (b.winner) {
      if (b.openType === 'GROUP_POOL') {
        const pool = computePoolStats(b);
        const creatorWon = b.winner === b.createdBy || b.winner === 'CREATOR' || b.payoutSummary?.winningSide === 'CREATOR';
        
        if (creatorWon) {
          const profitPerWinner = b.payoutSummary?.profitPerWinner ?? pool.sideAProfit;

          pool.sideAKeys.forEach(key => {
            if (balanceSheet[key]) {
              balanceSheet[key].wins++;
              balanceSheet[key].netCash += profitPerWinner;
              balanceSheet[key].totalWagered += stake;
            }
          });
          pool.sideBKeys.forEach(key => {
            if (balanceSheet[key]) {
              balanceSheet[key].losses++;
              balanceSheet[key].netCash -= stake;
              balanceSheet[key].totalWagered += stake;
            }
          });
        } else {
          // TARGET / POOL side won
          const profitPerWinner = b.payoutSummary?.profitPerWinner ?? pool.sideBProfit;

          pool.sideBKeys.forEach(key => {
            if (balanceSheet[key]) {
              balanceSheet[key].wins++;
              balanceSheet[key].netCash += profitPerWinner;
              balanceSheet[key].totalWagered += stake;
            }
          });
          pool.sideAKeys.forEach(key => {
            if (balanceSheet[key]) {
              balanceSheet[key].losses++;
              balanceSheet[key].netCash -= stake;
              balanceSheet[key].totalWagered += stake;
            }
          });
        }
      } else {
        // Direct 1-on-1 bet
        const winner = b.winner;
        const loser = b.winner === b.createdBy ? (b.acceptedBy || b.targetUser) : b.createdBy;
        if (balanceSheet[winner]) {
          balanceSheet[winner].wins++;
          balanceSheet[winner].netCash += stake;
          balanceSheet[winner].totalWagered += stake;
        }
        if (loser && balanceSheet[loser]) {
          balanceSheet[loser].losses++;
          balanceSheet[loser].netCash -= stake;
          balanceSheet[loser].totalWagered += stake;
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Peer-to-Peer Wager Ledger</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            THE DFL SPORTSBOOK
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Propose side bets on matchups, player props, or punishments and track settlements in real-time
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm px-5 py-3 rounded-2xl shadow-lg transition transform active:scale-95 flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Propose New Bet</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            filter === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active & Pending Bets ({activeBets.length})</span>
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            filter === 'settled'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Settled History ({settledBets.length})</span>
        </button>
        <button
          onClick={() => setFilter('debts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            filter === 'debts'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Degenerate Leaderboard</span>
        </button>
      </div>

      {/* LIST OF ACTIVE/PENDING BETS */}
      {filter === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeBets.length === 0 ? (
            <div className="col-span-2 glass-panel p-10 rounded-2xl text-center text-slate-500 text-sm">
              No active bets right now. Click "Propose New Bet" to challenge a league mate!
            </div>
          ) : (
            activeBets.map((bet) => {
              const creator = franchises[bet.createdBy];
              const target = bet.targetUser === 'ALL' ? null : franchises[bet.targetUser];
              const acceptor = bet.acceptedBy ? franchises[bet.acceptedBy] : null;

              const isParticipant =
                currentUser &&
                (currentUser.franchiseKey === bet.createdBy ||
                 currentUser.franchiseKey === bet.targetUser ||
                 currentUser.franchiseKey === bet.acceptedBy ||
                 (bet.takers && bet.takers.includes(currentUser.franchiseKey)) ||
                 bet.targetUser === 'ALL');

              const isGroupPool = bet.openType === 'GROUP_POOL';
              const rawTakers = bet.takers || [];
              const normalizedTakers = rawTakers.map(t => (typeof t === 'string' ? { franchiseKey: t, side: 'TARGET' } : t));
              const creatorBackers = normalizedTakers.filter(t => t.side === 'CREATOR');
              const targetBackers = normalizedTakers.filter(t => t.side === 'TARGET');
              const userTaker = currentUser && normalizedTakers.find(t => t.franchiseKey === currentUser.franchiseKey);
              const hasJoinedPool = !!userTaker;
              const isCreator = currentUser && currentUser.franchiseKey === bet.createdBy;

              const canAccept =
                currentUser &&
                !isCreator &&
                (
                  isGroupPool
                    ? true
                    : (bet.status !== 'ACCEPTED' && (bet.targetUser === 'ALL' || bet.targetUser === currentUser.franchiseKey))
                );

              const canSettle =
                currentUser &&
                (bet.status === 'ACCEPTED' || (isGroupPool && (normalizedTakers.length > 0 || isCreator))) &&
                (currentUser.franchiseKey === bet.createdBy ||
                 currentUser.franchiseKey === bet.acceptedBy ||
                 hasJoinedPool ||
                 currentUser.isCommissioner ||
                 currentUser.franchiseKey === 'Rhymenoceros');

              const canEditOrDelete =
                currentUser &&
                (currentUser.franchiseKey === bet.createdBy ||
                 currentUser.isCommissioner ||
                 currentUser.franchiseKey === 'Rhymenoceros');

              return (
                <div
                  key={bet.id}
                  className="glass-panel sportsbook-card p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    {/* Status and Stakes Badge */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            bet.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isGroupPool
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {bet.status === 'ACCEPTED'
                            ? 'IN ACTION'
                            : isGroupPool
                            ? `GROUP POOL (${normalizedTakers.length + 1} SQUAD)`
                            : 'OPEN / 1-ON-1 DUEL'}
                        </span>
                        {isGroupPool && userTaker && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            ✓ BACKING: {userTaker.side === 'CREATOR' ? bet.creatorPick : bet.targetPick}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {canEditOrDelete && (
                          <div className="flex items-center space-x-1 bg-slate-900/90 px-1 py-0.5 rounded-lg border border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(bet)}
                              title="Edit Bet Details"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(bet.id)}
                              title="Delete / Cancel Bet"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <span className="font-mono font-black text-emerald-400 text-sm bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 sportsbook-stake-badge">
                          {bet.stakes}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-white">{bet.title}</h3>
                    {bet.terms && <p className="text-xs text-slate-400">{bet.terms}</p>}
                  </div>

                  {/* Bettors matchup preview */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs sportsbook-matchup-box">
                    <div className="flex items-center space-x-2">
                      <img
                        src={creator?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={creator?.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-white block">{creator?.name}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">{bet.creatorPick}</span>
                      </div>
                    </div>

                    <span className="text-slate-600 font-bold text-xs">VS</span>

                    <div className="flex items-center space-x-2 text-right">
                      <div>
                        <span className="font-bold text-white block">
                          {isGroupPool
                            ? `Syndicate (${normalizedTakers.length})`
                            : acceptor ? acceptor.name : target ? target.name : 'Open to Any'}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">{bet.targetPick}</span>
                      </div>
                      {isGroupPool ? (
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                          👥
                        </div>
                      ) : (
                        <img
                          src={(acceptor || target)?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                          alt="Taker"
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        />
                      )}
                    </div>
                  </div>

                  {/* Two-Sided Group Pool Roster & Live Pari-Mutuel Pot */}
                  {isGroupPool && (() => {
                    const pool = computePoolStats(bet);
                    return (
                      <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 text-[11px] space-y-3 shadow-inner sportsbook-pool-box">
                        {/* Pot Breakdown Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider shadow-sm sportsbook-pot-pill">
                              💰 Total Pot: ${pool.totalPot.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold sportsbook-entry-info">
                              (${pool.stakeAmount} Entry • {pool.totalCount} Bettors)
                            </span>
                          </div>
                          <span className="text-cyan-400 font-bold text-[10px] sportsbook-odds-title">
                            ⚡ Live Pari-Mutuel Odds
                          </span>
                        </div>

                        {/* Two Sides with Live Payout Odds */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Side A: Backing Creator */}
                          <div className="bg-emerald-950/25 border border-emerald-500/35 rounded-xl p-2.5 space-y-2 sportsbook-side-a">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-black text-[11px] uppercase tracking-wide truncate">
                                Backing {bet.creatorPick} ({pool.countA})
                              </span>
                              <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-600 shadow-sm sportsbook-pays-a">
                                {pool.countA > 0 ? `Pays $${pool.sideAPayout.toFixed(2)}` : '—'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 sportsbook-profit-text-a">
                              {pool.countA > 0 ? (
                                <span>Est. Profit: <strong className="text-emerald-400 font-mono font-bold">+${pool.sideAProfit.toFixed(2)}</strong> / winner</span>
                              ) : (
                                <span>No backers yet</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center space-x-1 bg-emerald-900/60 border border-emerald-700 px-1.5 py-0.5 rounded text-[10px] text-white font-semibold sportsbook-creator-tag">
                                <span>👑 {creator?.name} (Creator)</span>
                              </span>
                              {creatorBackers.map(t => {
                                const tFranchise = franchises[t.franchiseKey];
                                return (
                                  <span key={t.franchiseKey} className="inline-flex items-center space-x-1 bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white sportsbook-manager-tag">
                                    <span>{tFranchise?.name || t.franchiseKey}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Side B: Backing Target */}
                          <div className="bg-amber-950/25 border border-amber-500/35 rounded-xl p-2.5 space-y-2 sportsbook-side-b">
                            <div className="flex items-center justify-between">
                              <span className="text-amber-400 font-black text-[11px] uppercase tracking-wide truncate">
                                Backing {bet.targetPick} ({pool.countB})
                              </span>
                              <span className="text-[10px] font-mono font-black text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600 shadow-sm sportsbook-pays-b">
                                {pool.countB > 0 ? `Pays $${pool.sideBPayout.toFixed(2)}` : '—'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 sportsbook-profit-text-b">
                              {pool.countB > 0 ? (
                                <span>Est. Profit: <strong className="text-amber-400 font-mono font-bold">+${pool.sideBProfit.toFixed(2)}</strong> / winner</span>
                              ) : (
                                <span className="text-amber-300/90 italic font-semibold">⚡ Take this side to win the pot!</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {targetBackers.length === 0 ? (
                                <span className="text-slate-500 text-[10px] italic">No backers yet — back below!</span>
                              ) : (
                                targetBackers.map(t => {
                                  const tFranchise = franchises[t.franchiseKey];
                                  return (
                                    <span key={t.franchiseKey} className="inline-flex items-center space-x-1 bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white sportsbook-manager-tag">
                                      <span>{tFranchise?.name || t.franchiseKey}</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end flex-wrap gap-2">
                    {canAccept && (
                      isGroupPool ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onAcceptBet(bet.id, currentUser.franchiseKey, 'CREATOR')}
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow transition flex items-center space-x-1 ${
                              userTaker?.side === 'CREATOR'
                                ? 'bg-emerald-400 text-black ring-2 ring-emerald-300 font-black'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50'
                            }`}
                          >
                            <span>{userTaker?.side === 'CREATOR' ? '✓ Backing' : 'Back'} {bet.creatorPick}</span>
                          </button>

                          <button
                            onClick={() => onAcceptBet(bet.id, currentUser.franchiseKey, 'TARGET')}
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow transition flex items-center space-x-1 ${
                              userTaker?.side === 'TARGET'
                                ? 'bg-amber-400 text-black ring-2 ring-amber-300 font-black'
                                : 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50'
                            }`}
                          >
                            <span>{userTaker?.side === 'TARGET' ? '✓ Backing' : 'Back'} {bet.targetPick}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAcceptBet(bet.id, currentUser.franchiseKey)}
                          className="px-4 py-2 font-bold text-xs rounded-xl shadow transition bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black"
                        >
                          Accept Bet ({bet.stakes})
                        </button>
                      )
                    )}
                    {canSettle && (
                      <button
                        onClick={() => {
                          setSettlingBet(bet);
                          setSelectedWinner(bet.createdBy);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition"
                      >
                        Settle Result
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* LIST OF SETTLED BETS */}
      {filter === 'settled' && (
        <div className="space-y-3">
          {settledBets.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center text-slate-500 text-sm">
              No settled bets yet.
            </div>
          ) : (
            settledBets.map((bet) => {
              const isGroupPool = bet.openType === 'GROUP_POOL';
              const pool = isGroupPool ? computePoolStats(bet) : null;
              const creatorWon = bet.winner === bet.createdBy || bet.winner === 'CREATOR' || bet.payoutSummary?.winningSide === 'CREATOR';
              
              const winningSide = bet.payoutSummary?.winningSide || (creatorWon ? 'CREATOR' : 'TARGET');
              const winningPick = bet.payoutSummary?.winningPick || (winningSide === 'CREATOR' ? bet.creatorPick : bet.targetPick);
              const winnerKeys = bet.payoutSummary?.winnerKeys || (winningSide === 'CREATOR' ? pool?.sideAKeys : pool?.sideBKeys) || [];
              const loserKeys = bet.payoutSummary?.loserKeys || (winningSide === 'CREATOR' ? pool?.sideBKeys : pool?.sideAKeys) || [];
              const totalPot = bet.payoutSummary?.totalPot ?? pool?.totalPot ?? 0;
              const stakeAmount = bet.payoutSummary?.stakePerPerson ?? pool?.stakeAmount ?? parseStakeAmount(bet.stakes);
              const payoutPerWinner = bet.payoutSummary?.payoutPerWinner ?? (winningSide === 'CREATOR' ? pool?.sideAPayout : pool?.sideBPayout) ?? 0;
              const profitPerWinner = bet.payoutSummary?.profitPerWinner ?? (winningSide === 'CREATOR' ? pool?.sideAProfit : pool?.sideBProfit) ?? 0;

              const winnerName = isGroupPool
                ? `Squad Backing "${winningPick}"`
                : franchises[bet.winner]?.name;

              return (
                <div key={bet.id} className="glass-panel sportsbook-settled-card p-4 rounded-2xl border border-slate-800 text-xs space-y-3 hover:border-slate-700 transition shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{bet.title}</h4>
                        {bet.terms && <p className="text-slate-400 text-[11px]">{bet.terms}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {currentUser && (currentUser.isCommissioner || currentUser.franchiseKey === 'Rhymenoceros' || currentUser.franchiseKey === bet.createdBy) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(bet.id)}
                          title="Delete Settled Bet Record"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-black tracking-wide">
                        {isGroupPool ? 'GROUP POOL SETTLED' : '1-ON-1 SETTLED'}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Details */}
                  {isGroupPool ? (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-[11px] sportsbook-receipt-box">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 pb-1.5 border-b border-slate-800/80">
                        <span className="font-black text-amber-300 flex items-center space-x-1.5">
                          <span>🏆 Winning Pick:</span>
                          <span className="text-white font-display">"{winningPick}"</span>
                        </span>
                        <span className="font-mono font-black text-emerald-400 text-[11px]">
                          💰 Total Pot: ${totalPot.toFixed(2)} (${stakeAmount}/person • {winnerKeys.length + loserKeys.length} Bettors)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Winners */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2 space-y-1 sportsbook-winner-box">
                          <span className="text-emerald-400 font-bold text-[10px] uppercase block">
                            ✓ Winners ({winnerKeys.length}) — Each won ${payoutPerWinner.toFixed(2)} (+${profitPerWinner.toFixed(2)} net profit):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {winnerKeys.map(k => (
                              <span key={k} className="px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-600 text-[10px] text-white font-semibold flex items-center space-x-1 sportsbook-settled-winner-tag">
                                <span>{franchises[k]?.name || k}</span>
                                <span className="text-emerald-300 font-mono font-bold">(+${profitPerWinner.toFixed(2)})</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Losers */}
                        <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-2 space-y-1 sportsbook-loser-box">
                          <span className="text-rose-400 font-bold text-[10px] uppercase block">
                            ✗ Opposing Backers ({loserKeys.length}) — Lost ${stakeAmount.toFixed(2)} each:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {loserKeys.length === 0 ? (
                              <span className="text-slate-500 text-[10px] italic">No opposing backers took this wager</span>
                            ) : (
                              loserKeys.map(k => (
                                <span key={k} className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-700 text-[10px] text-rose-300 font-semibold flex items-center space-x-1">
                                  <span>{franchises[k]?.name || k}</span>
                                  <span className="text-rose-400 font-mono font-bold">(-${stakeAmount.toFixed(2)})</span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between sportsbook-single-receipt">
                      <p className="text-slate-300">
                        Winner: <strong className="text-emerald-400 font-bold">{winnerName}</strong> ({bet.winner === bet.createdBy ? bet.creatorPick : bet.targetPick})
                      </p>
                      <span className="font-mono font-black text-emerald-400">
                        {bet.stakes} Payout
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DEBT & LEADERBOARD TAB */}
      {filter === 'debts' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                P2P Betting & Syndicate Leaderboard
              </h3>
              <p className="text-xs text-slate-400">
                Live rankings calculated from 1-on-1 head-to-heads and group pari-mutuel pot splits
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              Total Action: ${Object.values(balanceSheet).reduce((acc, v) => acc + (v.totalWagered || 0), 0) / 2} wagered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(balanceSheet)
              .sort(([, a], [, b]) => (b.netCash || 0) - (a.netCash || 0))
              .map(([fKey, stats], rankIdx) => {
                const f = franchises[fKey];
                const isPositive = stats.netCash > 0;
                const isNegative = stats.netCash < 0;

                return (
                  <div key={fKey} className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition shadow-sm sportsbook-leaderboard-card">
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="font-mono text-xs font-bold text-slate-500 w-4">
                        #{rankIdx + 1}
                      </span>
                      <img
                        src={f?.customLogoUrl || f?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt={f?.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                      />
                      <div className="truncate">
                        <span className="font-bold text-xs text-white block truncate">{f?.name || fKey}</span>
                        <span className="text-[10px] text-slate-400 truncate">{f?.teamName}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono flex-shrink-0 pl-2">
                      <div className="text-xs">
                        <span className="text-emerald-400 font-bold">{stats.wins} W</span>
                        <span className="text-slate-600 mx-1">—</span>
                        <span className="text-rose-400 font-bold">{stats.losses} L</span>
                      </div>
                      <div className={`text-xs font-black mt-0.5 ${
                        isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {isPositive ? `+$${stats.netCash.toFixed(2)}` : isNegative ? `-$${Math.abs(stats.netCash).toFixed(2)}` : '$0.00'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* CREATE BET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111726] border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-display tracking-wide uppercase text-white mb-4">
              Propose a DFL Side Bet
            </h3>

            <form onSubmit={handleSubmitBet} className="space-y-4">
              {/* Opponent Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Opponent
                </label>
                <select
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                >
                  <option value="ALL">🌐 Open to Anyone in League</option>
                  {Object.entries(franchises)
                    .filter(([k]) => k !== currentUser?.franchiseKey)
                    .map(([k, f]) => (
                      <option key={k} value={k}>{f.name} ({f.teamName})</option>
                    ))}
                </select>
              </div>

              {/* Open Bet Format (Only if targetUser === 'ALL') */}
              {targetUser === 'ALL' && (
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Open Bet Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenType('FIRST_TO_TAKE')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        openType === 'FIRST_TO_TAKE'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-0.5">⚡ First to Accept</div>
                      <div className="text-[10px] text-slate-400">1-on-1 duel. First manager to accept takes the bet exclusively.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenType('GROUP_POOL')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        openType === 'GROUP_POOL'
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="text-xs font-bold text-amber-300 mb-0.5">👥 Group Syndicate</div>
                      <div className="text-[10px] text-slate-400">Multi-taker pool. Anyone in the league can join and fade your pick.</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Bet Title / Matchup
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Week 3 Head-to-Head Straight Up, or Puka vs Wilson"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Terms / Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g., Higher fantasy score in Week 3, no garbage time asterisks"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Stakes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Stakes / Wager
                </label>
                <input
                  type="text"
                  required
                  value={stakes}
                  onChange={(e) => setStakes(e.target.value)}
                  placeholder="e.g., $20, 6-Pack of Beer, Winner picks loser avatar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Picks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Your Pick / Side
                  </label>
                  <input
                    type="text"
                    value={creatorPick}
                    onChange={(e) => setCreatorPick(e.target.value)}
                    placeholder={currentUser?.name}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Their Pick / Side
                  </label>
                  <input
                    type="text"
                    value={targetPick}
                    onChange={(e) => setTargetPick(e.target.value)}
                    placeholder="Opponent / Taker"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs rounded-xl shadow hover:from-emerald-400"
                >
                  {submitting ? 'Posting...' : 'Post Bet to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE BET MODAL */}
      {settlingBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#111726] border border-slate-700 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
              Settle Bet: {settlingBet.title}
            </h3>
            <p className="text-xs text-slate-400">
              Select who won this wager ({settlingBet.stakes}):
            </p>

            <div className="space-y-2">
              {settlingBet.openType === 'GROUP_POOL' ? (() => {
                const pool = computePoolStats(settlingBet);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedWinner('CREATOR')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between text-xs font-bold transition ${
                        selectedWinner === settlingBet.createdBy || selectedWinner === 'CREATOR'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-black text-white text-sm">
                          👑 Side A: Backing "{settlingBet.creatorPick}" Won!
                        </div>
                        <div className="text-[11px] text-emerald-300 font-mono font-bold sportsbook-modal-pays-a">
                          💰 Pot: ${pool.totalPot.toFixed(2)} • {pool.countA} Winners get ${pool.sideAPayout.toFixed(2)} each (+${pool.sideAProfit.toFixed(2)} profit)
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Winning squad: {pool.sideAKeys.map(k => franchises[k]?.name || k).join(', ')}
                        </div>
                      </div>
                      {(selectedWinner === settlingBet.createdBy || selectedWinner === 'CREATOR') && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWinner('TARGET')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between text-xs font-bold transition ${
                        selectedWinner === 'TARGET' || selectedWinner === 'POOL'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-black text-white text-sm">
                          👥 Side B: Backing "{settlingBet.targetPick}" Won!
                        </div>
                        <div className="text-[11px] text-amber-300 font-mono font-bold sportsbook-modal-pays-b">
                          💰 Pot: ${pool.totalPot.toFixed(2)} • {pool.countB} Winners get ${pool.sideBPayout.toFixed(2)} each (+${pool.sideBProfit.toFixed(2)} profit)
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Winning squad: {pool.sideBKeys.length > 0 ? pool.sideBKeys.map(k => franchises[k]?.name || k).join(', ') : 'None'}
                        </div>
                      </div>
                      {(selectedWinner === 'TARGET' || selectedWinner === 'POOL') && <Check className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                    </button>
                  </>
                );
              })() : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedWinner(settlingBet.createdBy)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition ${
                      selectedWinner === settlingBet.createdBy
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{franchises[settlingBet.createdBy]?.name} ({settlingBet.creatorPick})</span>
                    {selectedWinner === settlingBet.createdBy && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWinner(settlingBet.acceptedBy || settlingBet.targetUser)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition ${
                      selectedWinner === (settlingBet.acceptedBy || settlingBet.targetUser)
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>
                      {franchises[settlingBet.acceptedBy || settlingBet.targetUser]?.name || 'Taker'} ({settlingBet.targetPick})
                    </span>
                    {selectedWinner === (settlingBet.acceptedBy || settlingBet.targetUser) && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSettlingBet(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettle}
                className="px-5 py-2 bg-emerald-500 text-black font-black text-xs rounded-xl hover:bg-emerald-400 transition"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BET MODAL */}
      {editingBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111726] border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-display tracking-wide uppercase text-white">
                Edit Bet Details
              </h3>
              <button
                type="button"
                onClick={() => {
                  const id = editingBet.id;
                  setEditingBet(null);
                  handleDeleteClick(id);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Bet</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Bet Title / Matchup
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Week 3 Head-to-Head Straight Up"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Terms / Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  placeholder="e.g., Higher fantasy score in Week 3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Stakes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Stakes / Wager
                </label>
                <input
                  type="text"
                  required
                  value={editStakes}
                  onChange={(e) => setEditStakes(e.target.value)}
                  placeholder="e.g., $20, 6-Pack of Beer"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Picks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Creator Pick
                  </label>
                  <input
                    type="text"
                    value={editCreatorPick}
                    onChange={(e) => setEditCreatorPick(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Opponent / Syndicate Pick
                  </label>
                  <input
                    type="text"
                    value={editTargetPick}
                    onChange={(e) => setEditTargetPick(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBet(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs rounded-xl shadow hover:from-emerald-400"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
