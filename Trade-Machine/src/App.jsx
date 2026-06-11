import { useState, useEffect } from 'react'
import RankingsExplorer from './components/RankingsExplorer'
import TradeMachine from './components/TradeMachine'

const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE || 'http://localhost:5000');

const TABS = [
  { id: 'rankings', label: 'Rankings', icon: '📊' },
  { id: 'trade', label: 'Trade Machine', icon: '🔄' },
]

export { API_BASE }

export default function App() {
  const [activeTab, setActiveTab] = useState('rankings')
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  // Apply theme class to body on mount and change
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <img className="app-logo-icon" src="/apple-touch-icon.png" alt="Football Trade Jackpot logo" />
          <div>
            <div className="app-logo-text">Dynasty Trade Machine</div>
            <div className="app-logo-sub">Fantasy Football Analytics</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <nav className="tab-nav" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ marginRight: 6 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          
          <button 
            onClick={() => setIsLightMode(!isLightMode)}
            className="theme-toggle"
            title="Toggle Light/Dark Mode"
          >
            {isLightMode ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="app-main app-container">
        {activeTab === 'rankings' && <RankingsExplorer />}
        {activeTab === 'trade' && <TradeMachine />}
      </main>
    </>
  )
}
