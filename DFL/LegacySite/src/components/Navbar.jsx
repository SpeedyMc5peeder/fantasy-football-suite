import React from 'react';
import { Trophy, BarChart3, Swords, TrendingUp, DollarSign, Users, ShieldCheck, LogIn, LogOut, Palette } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenLogin, onLogout, onOpenBranding }) {
  const navItems = [
    { id: 'champions', label: 'Hall of Champions', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard & Records', icon: BarChart3 },
    { id: 'rivalry', label: 'Rivalry Matrix', icon: Swords },
    { id: 'predictions', label: 'Over/Under & Picks', icon: TrendingUp },
    { id: 'betting', label: 'DFL Sportsbook', icon: DollarSign },
    { id: 'managers', label: 'Franchise Profiles', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c101a]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('champions')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-glow-gold">
              <span className="text-black font-black text-xl font-display tracking-wider">DFL</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                  DYNASTY FOOTBALL LEAGUE
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  EST. 2022
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                5 Seasons • 10 Franchises • Unfiltered Glory
              </p>
            </div>
          </div>

          {/* User Auth Profile Badge */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-900/90 border border-slate-700/80 rounded-full py-1.5 px-3 sm:px-4 shadow-sm">
                <img
                  src={currentUser.customLogoUrl || currentUser.avatar || 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-amber-400 object-cover"
                />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
                    {currentUser.isCommissioner && (
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded border border-amber-500/40">
                        COMMISH
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate max-w-[120px]">{currentUser.teamName}</span>
                </div>
                <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
                  <button
                    onClick={onOpenBranding}
                    title="Customize Logo & Theme"
                    className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onLogout}
                    title="Log Out"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-full hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm px-4 py-2 rounded-xl shadow-glow-gold transition transform active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Manager Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2.5 border-t border-slate-800/80">
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
    </header>
  );
}
