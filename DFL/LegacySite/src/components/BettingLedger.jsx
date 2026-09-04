import React, { useState } from 'react';
import { DollarSign, PlusCircle, CheckCircle2, Clock, XCircle, AlertCircle, Users, ArrowRight, Check, Trophy } from 'lucide-react';

export default function BettingLedger({ bets, franchises, currentUser, onOpenLogin, onCreateBet, onAcceptBet, onSettleBet }) {
  const [filter, setFilter] = useState('active'); // 'active', 'settled', 'debts'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Bet Form State
  const [targetUser, setTargetUser] = useState('ALL');
  const [title, setTitle] = useState('');
  const [terms, setTerms] = useState('');
  const [stakes, setStakes] = useState('$10');
  const [creatorPick, setCreatorPick] = useState('');
  const [targetPick, setTargetPick] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(false);
    setIsModalOpen(false);
  };

  const handleConfirmSettle = async () => {
    if (!settlingBet || !selectedWinner) return;
    await onSettleBet(settlingBet.id, selectedWinner, currentUser?.franchiseKey);
    setSettlingBet(null);
    setSelectedWinner('');
  };

  // Filtered bets
  const activeBets = bets.filter(b => b.status === 'OPEN' || b.status === 'ACCEPTED' || b.status === 'PENDING_ACCEPTANCE');
  const settledBets = bets.filter(b => b.status === 'SETTLED');

  // Compute Debt / Settlement Balance Sheet
  const balanceSheet = {};
  for (const fKey of Object.keys(franchises)) {
    balanceSheet[fKey] = { wins: 0, losses: 0, pending: 0 };
  }

  settledBets.forEach(b => {
    if (b.winner) {
      if (balanceSheet[b.winner]) balanceSheet[b.winner].wins++;
      const loser = b.winner === b.createdBy ? b.acceptedBy : b.createdBy;
      if (loser && balanceSheet[loser]) balanceSheet[loser].losses++;
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
                 bet.targetUser === 'ALL');

              const canAccept =
                currentUser &&
                currentUser.franchiseKey !== bet.createdBy &&
                bet.status !== 'ACCEPTED' &&
                (bet.targetUser === 'ALL' || bet.targetUser === currentUser.franchiseKey);

              const canSettle =
                currentUser &&
                bet.status === 'ACCEPTED' &&
                (currentUser.franchiseKey === bet.createdBy ||
                 currentUser.franchiseKey === bet.acceptedBy ||
                 currentUser.isCommissioner);

              return (
                <div
                  key={bet.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    {/* Status and Stakes Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          bet.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {bet.status === 'ACCEPTED' ? 'IN ACTION' : 'OPEN / PENDING'}
                      </span>
                      <span className="font-mono font-black text-emerald-400 text-sm bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        {bet.stakes}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white">{bet.title}</h3>
                    {bet.terms && <p className="text-xs text-slate-400">{bet.terms}</p>}
                  </div>

                  {/* Bettors matchup preview */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
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
                          {acceptor ? acceptor.name : target ? target.name : 'Open to Any'}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">{bet.targetPick}</span>
                      </div>
                      <img
                        src={(acceptor || target)?.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                        alt="Taker"
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    {canAccept && (
                      <button
                        onClick={() => onAcceptBet(bet.id, currentUser.franchiseKey)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black font-bold text-xs rounded-xl shadow transition"
                      >
                        Accept Bet
                      </button>
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
              const winnerFranchise = franchises[bet.winner];
              const creator = franchises[bet.createdBy];
              const other = bet.winner === bet.createdBy ? franchises[bet.acceptedBy || bet.targetUser] : creator;

              return (
                <div key={bet.id} className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{bet.title}</h4>
                      <p className="text-slate-400 text-[11px]">{bet.terms}</p>
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        Winner: <strong className="text-white">{winnerFranchise?.name}</strong> • Stakes: {bet.stakes}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[10px] uppercase font-bold">
                    Settled
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DEBT & LEADERBOARD TAB */}
      {filter === 'debts' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
            P2P Betting Win/Loss Ledger
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(balanceSheet).map(([fKey, stats]) => {
              const f = franchises[fKey];
              return (
                <div key={fKey} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={f.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                      alt={f.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">{f.name}</span>
                      <span className="text-[10px] text-slate-400">{f.teamName}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-emerald-400 font-bold">{stats.wins} W</span>
                    <span className="text-slate-600 mx-1">—</span>
                    <span className="text-rose-400 font-bold">{stats.losses} L</span>
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
                  <option value="ALL">Open to Anyone in League (First to Accept)</option>
                  {Object.entries(franchises)
                    .filter(([k]) => k !== currentUser?.franchiseKey)
                    .map(([k, f]) => (
                      <option key={k} value={k}>{f.name} ({f.teamName})</option>
                    ))}
                </select>
              </div>

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
    </div>
  );
}
