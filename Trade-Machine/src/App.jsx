import { useState } from 'react'
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

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">DT</div>
          <div>
            <div className="app-logo-text">Dynasty Trade Machine</div>
            <div className="app-logo-sub">Fantasy Football Analytics</div>
          </div>
        </div>

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
      </header>

      <main className="app-main app-container">
        {activeTab === 'rankings' && <RankingsExplorer />}
        {activeTab === 'trade' && <TradeMachine />}
      </main>
    </>
  )
}
