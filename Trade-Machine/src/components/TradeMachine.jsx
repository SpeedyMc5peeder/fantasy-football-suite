import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE } from '../App'
import PlayerCard from './PlayerCard'
import './TradeMachine.css'

const MODES = ['contender', 'neutral', 'rebuilder']

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Player search dropdown for adding players to a trade side.
 */
function PlayerSearch({ onAdd, excludeIds, side }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const debouncedQuery = useDebounce(query)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    let cancelled = false
    const doSearch = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${API_BASE}/api/rankings?search=${encodeURIComponent(debouncedQuery.trim())}&limit=20`
        )
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.players || data.rankings || [])
        if (!cancelled) {
          setResults(list.filter((p) => !excludeIds.has(p.id)))
          setOpen(true)
        }
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    doSearch()
    return () => { cancelled = true }
  }, [debouncedQuery, excludeIds])

  const handleSelect = (player) => {
    onAdd(player)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="trade-search-container" ref={wrapperRef}>
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search players or picks to add…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
        />
      </div>

      {open && (
        <div className="trade-search-results">
          {loading && results.length === 0 ? (
            <div className="trade-search-no-results">Searching…</div>
          ) : results.length === 0 ? (
            <div className="trade-search-no-results">No results found</div>
          ) : (
            results.map((player) => (
              <div
                key={player.id}
                className="trade-search-item"
                onClick={() => handleSelect(player)}
              >
                <span className={`pos-badge ${player.position || 'PICK'}`}>
                  {player.position || 'PICK'}
                </span>
                <span className="trade-search-item-name">{player.name}</span>
                <span className="trade-search-item-value">
                  {player.composite_value?.toLocaleString() ?? '—'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A single trade side panel with mode selector, search, and player cards.
 */
function TradePanel({ side, label, players, mode, onModeChange, onAddPlayer, onRemovePlayer, allPlayerIds }) {
  const totalValue = players.reduce((sum, p) => {
    if (mode === 'contender') return sum + (p.contender_value || 0)
    if (mode === 'rebuilder') return sum + (p.rebuilder_value || 0)
    return sum + (p.composite_value || 0)
  }, 0)

  const valueMode = mode === 'contender' ? 'contender' : mode === 'rebuilder' ? 'rebuilder' : 'composite'

  return (
    <div className={`trade-panel glass-panel side-${side}`}>
      <div className="trade-panel-header">
        <div className="trade-panel-title">
          <span className="side-indicator">{side.toUpperCase()}</span>
          {label}
        </div>
        <div className="mode-selector">
          {MODES.map((m) => (
            <button
              key={m}
              className={`mode-btn${mode === m ? ' active' : ''}`}
              onClick={() => onModeChange(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <PlayerSearch
        onAdd={onAddPlayer}
        excludeIds={allPlayerIds}
        side={side}
      />

      <div className="trade-players-list">
        {players.length === 0 ? (
          <div className="trade-players-empty">Add players or picks…</div>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onRemove={onRemovePlayer}
              valueMode={valueMode}
            />
          ))
        )}
      </div>

      {players.length > 0 && (
        <div className="trade-panel-total">
          <span className="trade-panel-total-label">Total Value</span>
          <span className="trade-panel-total-value">
            {totalValue.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Main Trade Machine component.
 */
export default function TradeMachine() {
  const [sideAPlayers, setSideAPlayers] = useState([])
  const [sideBPlayers, setSideBPlayers] = useState([])
  const [modeA, setModeA] = useState('neutral')
  const [modeB, setModeB] = useState('neutral')
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Collect all player IDs already used in the trade
  const allPlayerIds = new Set([
    ...sideAPlayers.map((p) => p.id),
    ...sideBPlayers.map((p) => p.id),
  ])

  const canEvaluate = sideAPlayers.length > 0 && sideBPlayers.length > 0

  const handleEvaluate = useCallback(async () => {
    if (!canEvaluate) return
    setEvaluating(true)
    setError(null)
    setResult(null)

    // Split players and picks
    const splitAssets = (list) => {
      const players = []
      const picks = []
      list.forEach((p) => {
        if (!p.position || p.position === 'PICK') {
          picks.push(p.id)
        } else {
          players.push(p.id)
        }
      })
      return { players, picks }
    }

    const sideA = splitAssets(sideAPlayers)
    const sideB = splitAssets(sideBPlayers)

    try {
      const res = await fetch(`${API_BASE}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sideA,
          sideB,
          settings: {
            team_1_mode: modeA,
            team_2_mode: modeB,
          },
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Evaluation failed (${res.status})`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setEvaluating(false)
    }
  }, [canEvaluate, sideAPlayers, sideBPlayers, modeA, modeB])

  const getVerdict = () => {
    if (!result) return null

    const sideAVal = result.side_a_value ?? result.sideA_value ?? 0
    const sideBVal = result.side_b_value ?? result.sideB_value ?? 0
    const diff = Math.abs(sideAVal - sideBVal)
    const total = sideAVal + sideBVal
    const ratio = total > 0 ? Math.max(sideAVal, sideBVal) / total : 0.5
    const pctA = total > 0 ? (sideAVal / total) * 100 : 50

    let verdictClass = 'fair'
    let verdictText = 'Fair Trade'
    if (diff > 0 && ratio > 0.52) {
      if (sideAVal > sideBVal) {
        verdictClass = 'win-a'
        verdictText = 'Side A Wins'
      } else {
        verdictClass = 'win-b'
        verdictText = 'Side B Wins'
      }
    }

    return {
      sideAVal,
      sideBVal,
      diff,
      pctA,
      verdictClass,
      verdictText,
      description: result.description || result.margin_description || '',
      fairness: result.fairness_ratio ?? result.fairness ?? (ratio * 100),
    }
  }

  const verdict = result ? getVerdict() : null

  return (
    <div className="trade-machine">
      {/* Two panels side by side */}
      <div className="trade-panels">
        <TradePanel
          side="a"
          label="Side A"
          players={sideAPlayers}
          mode={modeA}
          onModeChange={setModeA}
          onAddPlayer={(p) => setSideAPlayers((prev) => [...prev, p])}
          onRemovePlayer={(id) => setSideAPlayers((prev) => prev.filter((p) => p.id !== id))}
          allPlayerIds={allPlayerIds}
        />
        <TradePanel
          side="b"
          label="Side B"
          players={sideBPlayers}
          mode={modeB}
          onModeChange={setModeB}
          onAddPlayer={(p) => setSideBPlayers((prev) => [...prev, p])}
          onRemovePlayer={(id) => setSideBPlayers((prev) => prev.filter((p) => p.id !== id))}
          allPlayerIds={allPlayerIds}
        />
      </div>

      {/* Evaluate button */}
      <div className="trade-evaluate-section">
        <button
          className="evaluate-btn"
          onClick={handleEvaluate}
          disabled={!canEvaluate || evaluating}
        >
          {evaluating ? 'Evaluating…' : '⚡ Evaluate Trade'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-container fade-in">
          <div className="error-icon">⚠️</div>
          <div className="error-msg">{error}</div>
        </div>
      )}

      {/* Results */}
      {verdict && (
        <div className="trade-results glass-panel" style={{ padding: 24 }}>
          <div className="trade-results-header">
            <div className={`trade-results-verdict ${verdict.verdictClass}`}>
              {verdict.verdictText}
            </div>
            {verdict.description && (
              <div className="trade-results-desc">{verdict.description}</div>
            )}
          </div>

          {/* Fairness bar */}
          <div className="fairness-bar-container">
            <div className="fairness-bar-labels">
              <span className="fairness-bar-label-a">
                Side A — {verdict.sideAVal.toLocaleString()}
              </span>
              <span className="fairness-bar-label-b">
                Side B — {verdict.sideBVal.toLocaleString()}
              </span>
            </div>
            <div className="fairness-bar-track">
              <div
                className="fairness-bar-fill side-a"
                style={{ width: `${verdict.pctA}%` }}
              />
              <div className="fairness-bar-marker" />
            </div>
            <div className="fairness-ratio">
              {typeof verdict.fairness === 'number'
                ? `Fairness: ${verdict.fairness.toFixed(1)}%`
                : ''}
            </div>
          </div>

          {/* Stats grid */}
          <div className="trade-results-stats">
            <div className="result-stat">
              <div className="result-stat-label">Side A Total</div>
              <div className="result-stat-value green">
                {verdict.sideAVal.toLocaleString()}
              </div>
            </div>
            <div className="result-stat">
              <div className="result-stat-label">Side B Total</div>
              <div className="result-stat-value blue">
                {verdict.sideBVal.toLocaleString()}
              </div>
            </div>
            <div className="result-stat">
              <div className="result-stat-label">Difference</div>
              <div className="result-stat-value">
                {verdict.diff.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
