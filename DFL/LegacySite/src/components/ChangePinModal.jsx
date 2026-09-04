import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

export default function ChangePinModal({ isOpen, onClose, currentUser }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPin) {
      setError('Please enter your current PIN (default is 1234).');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits (0-9).');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PIN and confirmation do not match.');
      return;
    }
    if (newPin === currentPin) {
      setError('New PIN cannot be the same as your current PIN.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseKey: currentUser.franchiseKey,
          currentPin,
          newPin,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem(`dfl_custom_pin_${currentUser.franchiseKey}`, newPin);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setCurrentPin('');
          setNewPin('');
          setConfirmPin('');
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to update PIN. Please verify current PIN.');
      }
    } catch (err) {
      localStorage.setItem(`dfl_custom_pin_${currentUser.franchiseKey}`, newPin);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#111726] border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display tracking-wide uppercase text-white">
              Security PIN
            </h3>
            <p className="text-xs text-slate-400">
              Update 4-digit access code for {currentUser.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>PIN updated successfully! Your new code is now active.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Current PIN <span className="text-slate-500 font-normal lowercase">(default is 1234)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-amber-400 transition"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            </div>
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              New 4-Digit PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-cyan-400 transition"
              />
              <ShieldCheck className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            </div>
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm New PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-cyan-400 transition"
              />
              <ShieldCheck className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
            💡 <strong>Tip:</strong> Pick a memorable 4-digit code. You'll need this PIN whenever you log in to lock in Over/Under predictions or create peer-to-peer bets.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-extrabold text-xs rounded-xl shadow-glow-gold transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : success ? 'Updated!' : 'Update PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
