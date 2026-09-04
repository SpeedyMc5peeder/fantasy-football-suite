import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, BarChart3, Swords, TrendingUp, DollarSign, Users, ShieldCheck, LogIn, LogOut, Palette, KeyRound, Sun, Moon, RefreshCw, Coins, Menu, X } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenBranding,
  onOpenChangePin,
  theme,
  onToggleTheme,
  onSyncSleeper,
  isSyncing,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'champions', label: 'Hall of Champions', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard & Records', icon: BarChart3 },
    { id: 'rivalry', label: 'Rivalry Matrix', icon: Swords },
    { id: 'dynastypot', label: 'Dynasty Cup', icon: Coins },
    { id: 'predictions', label: 'Over/Under & Picks', icon: TrendingUp },
    { id: 'betting', label: 'DFL Sportsbook', icon: DollarSign },
    { id: 'managers', label: 'Franchise Profiles', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c101a]/95 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile Hamburger Button + Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex-shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0" onClick={() => setActiveTab('champions')}>
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/league-logo.png"
                  alt="DFL"
                  className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 items-center justify-center shadow-glow-gold hidden">
                  <span className="text-black font-black text-base sm:text-xl font-display tracking-wider">DFL</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm sm:text-2xl font-black tracking-tight text-white font-display">
                    DYNASTY FOOTBALL LEAGUE
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex-shrink-0">
                    EST. 2022
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop-Only User Auth Profile Badge, Sync & Theme Toggle (< md screens access all of this via the hamburger drawer) */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
            {/* Sleeper Auto-Sync Manual Trigger (Exclusively for Commissioner Dom) */}
            {currentUser && (currentUser.isCommissioner || currentUser.franchiseKey === 'Rhymenoceros') && (
              <button
                onClick={onSyncSleeper}
                disabled={isSyncing}
                title="Commissioner Tool: Sync latest rosters, scores, and standings from Sleeper now."
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition flex items-center space-x-1.5 text-xs font-bold shadow-sm ${
                  isSyncing
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                    : 'text-amber-400 hover:text-amber-300 bg-amber-950/30 border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline text-[11px] font-black tracking-wide">
                  {isSyncing ? 'Syncing...' : '⚡ Sync Sleeper'}
                </span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border transition flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline text-slate-300 text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-500" />
                  <span className="hidden md:inline text-slate-700 text-[11px]">Dark</span>
                </>
              )}
            </button>

            {/* User Auth Profile Badge & Login Button */}
            {currentUser ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2.5 bg-slate-900/90 border border-slate-700/80 rounded-full py-1 px-2 sm:py-1.5 sm:px-3.5 shadow-sm flex-shrink-0">
                <button
                  type="button"
                  onClick={onOpenBranding}
                  title="Customize Logo & Colors"
                  className="relative group flex-shrink-0"
                >
                  <img
                    src={currentUser.customLogoUrl || currentUser.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-400 object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-white leading-tight font-display tracking-wide truncate max-w-[110px]">
                      {currentUser.teamName}
                    </span>
                    {currentUser.isCommissioner && (
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/40 flex-shrink-0">
                        COMMISH
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">{currentUser.name}</span>
                </div>
                <div className="flex items-center space-x-0.5 border-l border-slate-700/80 pl-1.5 sm:pl-2">
                  <button
                    type="button"
                    onClick={onOpenChangePin}
                    title="Change 4-Digit Security PIN"
                    className="p-1 sm:p-1.5 text-slate-400 hover:text-amber-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenBranding}
                    title="Customize Logo & Theme"
                    className="p-1 sm:p-1.5 text-slate-400 hover:text-cyan-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  {/* Sign Out button: cleanly hidden on mobile so nothing spills outside the oval, visible on desktop */}
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign Out"
                    className="hidden md:flex p-1.5 text-slate-400 hover:text-rose-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs sm:text-sm px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-glow-gold transition transform active:scale-95 flex-shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar */}
        <nav className="hidden md:flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2.5 border-t border-slate-800/80">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Slide-Over Mobile Navigation Drawer (< md screens) */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] md:hidden flex" style={{ height: '100dvh', maxHeight: '100dvh' }}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className={`relative w-4/5 max-w-xs ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0c101a] border-slate-800 text-slate-100'} border-r h-full p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto`}>
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className={`flex items-center justify-between border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} pb-4`}>
                <div className="flex items-center space-x-2.5">
                  <img src="/images/league-logo.png" alt="DFL" className="w-8 h-8 object-contain" />
                  <div>
                    <span className={`font-display font-black text-base ${theme === 'light' ? 'text-slate-900' : 'text-white'} tracking-wide block`}>DFL LEGACY</span>
                    <span className="text-[10px] text-amber-500 font-mono font-bold">EST. 2022</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'} border`}
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition ${
                        isActive
                          ? theme === 'light'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-400/50 shadow-sm'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : theme === 'light'
                            ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? (theme === 'light' ? 'text-cyan-600' : 'text-cyan-400') : 'text-slate-400'}`} />
                      <span className="text-left font-display text-sm tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Controls */}
            <div className={`pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} space-y-3`}>
              {currentUser ? (
                <div className={`p-3.5 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'} rounded-2xl border space-y-3`}>
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={currentUser.customLogoUrl || currentUser.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full border border-amber-400 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} block truncate`}>{currentUser.teamName}</span>
                        {currentUser.isCommissioner && (
                          <span className="bg-amber-500/20 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/40 flex-shrink-0">
                            COMMISH
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{currentUser.name}</span>
                    </div>
                  </div>
                  <div className={`grid grid-cols-3 gap-1.5 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <button
                      type="button"
                      onClick={() => { onOpenChangePin(); setMobileMenuOpen(false); }}
                      className={`py-1.5 text-center text-[11px] font-bold ${theme === 'light' ? 'text-slate-700 bg-white border border-slate-200' : 'text-slate-300 bg-slate-800 hover:text-white'} rounded-lg transition`}
                    >
                      PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => { onOpenBranding(); setMobileMenuOpen(false); }}
                      className={`py-1.5 text-center text-[11px] font-bold ${theme === 'light' ? 'text-cyan-700 bg-cyan-50 border border-cyan-200' : 'text-cyan-300 bg-slate-800 hover:text-white'} rounded-lg transition`}
                    >
                      Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                      className="py-1.5 text-center text-[11px] font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Manager Login</span>
                </button>
              )}

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>Theme Mode</span>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`px-2.5 py-1 rounded-lg ${theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'} border flex items-center space-x-1.5 font-bold`}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-500" />}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
