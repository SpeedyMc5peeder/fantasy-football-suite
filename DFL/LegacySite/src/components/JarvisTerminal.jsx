import React, { useState, useEffect } from 'react';
import jarvisData from '../data/jarvis_intel.json';

export default function JarvisTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('roaster'); // 'roaster' | 'picks' | 'wisdom'
  const [selectedManagerId, setSelectedManagerId] = useState(jarvisData.managers[0].id);
  const [wisdomIndex, setWisdomIndex] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const selectedManager = jarvisData.managers.find(m => m.id === selectedManagerId) || jarvisData.managers[0];

  const handleNextWisdom = () => {
    setWisdomIndex((prev) => (prev + 1) % jarvisData.soundbites.length);
  };

  return (
    <>
      {/* Floating HUD Launcher */}
      <div className="fixed bottom-5 right-5 z-40 md:bottom-7 md:right-7 select-none">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-md"
          aria-label="Open JARVIS Terminal"
        >
          {/* Avatar with scanline pulse */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-cyan-400/60 shadow-inner flex-shrink-0 bg-slate-900">
            <img
              src="/jarvis-avatar.webp"
              alt="JARVIS"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Live Indicator Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse"></span>
          </div>

          {/* Text labels */}
          <div className="text-left pr-1 hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest text-cyan-400 font-mono">J.A.R.V.I.S.</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">League Intel</p>
          </div>
        </button>
      </div>

      {/* Terminal Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          {/* Backdrop click area */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

          {/* Terminal Window */}
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden text-slate-100 z-10">
            
            {/* Top Bar / HUD Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-cyan-500/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400 shadow-sm bg-slate-950 flex-shrink-0">
                  <img src="/jarvis-avatar.webp" alt="JARVIS" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-black text-sm tracking-wider text-cyan-300">J.A.R.V.I.S. TERMINAL</h3>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">ONLINE</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">Autonomous League Intelligence & Tactical Scouting</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors font-mono text-sm"
                aria-label="Close Terminal"
              >
                ✕ ESC
              </button>
            </div>

            {/* Sub-Nav Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/80 px-2 pt-2 gap-1 overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setActiveSubTab('roaster')}
                className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
                  activeSubTab === 'roaster'
                    ? 'bg-slate-900 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <span>🔥</span>
                <span>Manager Scouting</span>
              </button>

              <button
                onClick={() => setActiveSubTab('picks')}
                className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
                  activeSubTab === 'picks'
                    ? 'bg-slate-900 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <span>🎲</span>
                <span>2026 Sharp Picks</span>
              </button>

              <button
                onClick={() => setActiveSubTab('wisdom')}
                className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x ${
                  activeSubTab === 'wisdom'
                    ? 'bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <span>🎙️</span>
                <span>JARVIS Wisdom</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60">
              
              {/* TAB 1: MANAGER ROASTER & SCOUTING */}
              {activeSubTab === 'roaster' && (
                <div className="space-y-4">
                  {/* Manager Quick-Selector Pills */}
                  <div>
                    <label className="text-[11px] font-mono tracking-wider uppercase text-cyan-400 block mb-2">
                      Select Franchise Dossier:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {jarvisData.managers.map((m) => {
                        const isSelected = m.id === selectedManagerId;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelectedManagerId(m.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Manager Dossier Card */}
                  <div className="rounded-xl bg-slate-900/70 border border-cyan-500/30 p-4 sm:p-5 relative overflow-hidden shadow-lg">
                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Dossier Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-white tracking-wide">{selectedManager.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">({selectedManager.team})</span>
                        </div>
                        <p className="text-xs text-cyan-400 font-mono font-medium mt-0.5">{selectedManager.title}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950/80 border border-red-500/40 text-red-300">
                          Threat: {selectedManager.threatLevel}
                        </span>
                      </div>
                    </div>

                    {/* Tactical Tendency */}
                    <div className="mb-3 px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2">
                      <span className="text-xs font-mono text-amber-400 flex-shrink-0">⚠️ TENDENCY:</span>
                      <span className="text-xs text-slate-300 font-mono">{selectedManager.tendency}</span>
                    </div>

                    {/* Scouting Report / Roast */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">JARVIS Assessment:</span>
                        <div className="flex-1 h-px bg-cyan-500/20"></div>
                      </div>
                      <p className="text-sm sm:text-base leading-relaxed text-slate-200 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/60 font-sans">
                        "{selectedManager.scoutingReport}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 2026 SHARP PICKS */}
              {activeSubTab === 'picks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <div>
                      <h4 className="text-sm font-mono font-bold text-amber-300">JARVIS 2026 OVER/UNDER SHARP REPORT</h4>
                      <p className="text-xs text-slate-400">Locked projections & tactical breakdowns for all 10 franchises</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      10 Teams Analyzed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {jarvisData.sharpPicks2026.map((p) => {
                      const isOver = p.pick === 'OVER';
                      return (
                        <div
                          key={p.teamKey}
                          className="rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-3.5 transition-all shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div>
                                <span className="text-xs font-bold text-white">{p.teamName}</span>
                                <span className="text-[11px] text-slate-400 ml-1.5 font-mono">({p.manager})</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-mono font-black tracking-wider ${
                                  isOver
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                }`}
                              >
                                {p.pick} {p.line}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                              "{p.breakdown}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: JARVIS WISDOM / ONE-LINERS */}
              {activeSubTab === 'wisdom' && (
                <div className="flex flex-col items-center justify-center py-6 text-center max-w-xl mx-auto space-y-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-slate-950 mx-auto">
                      <img src="/jarvis-avatar.webp" alt="JARVIS" className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping"></span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-mono font-bold tracking-wider text-emerald-400 uppercase">
                      J.A.R.V.I.S. Philosophy Engine
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Observation #{wisdomIndex + 1} of {jarvisData.soundbites.length}
                    </p>
                  </div>

                  {/* Quote Display Box */}
                  <div className="w-full rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-5 sm:p-6 shadow-xl relative">
                    <span className="text-3xl text-emerald-500/40 absolute top-2 left-4 font-serif">“</span>
                    <p className="text-base sm:text-lg text-slate-100 font-medium italic leading-relaxed pt-2">
                      {jarvisData.soundbites[wisdomIndex]}
                    </p>
                    <span className="text-3xl text-emerald-500/40 absolute bottom-1 right-4 font-serif">”</span>
                  </div>

                  {/* Dispense Button */}
                  <button
                    onClick={handleNextWisdom}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-mono text-xs tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md"
                  >
                    <span>🎲</span>
                    <span>Dispense Next Thought</span>
                  </button>
                </div>
              )}

            </div>

            {/* Footer Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>SYSTEM STATUS: OPTIMAL</span>
              </div>
              <div>CLIENT-SIDE EXECUTION // 0 TOKENS</div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
