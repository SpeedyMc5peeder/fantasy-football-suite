import { useState, useEffect, useMemo, useCallback } from 'react'
import { API_BASE } from '../App'
import { PlayerDetailPanel } from './PlayerCard'
import './RankingsExplorer.css'

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'PICKS']

const COLUMNS = [
  { key: 'composite_rank', label: 'Rank', className: 'col-rank' },
  { key: 'name', label: 'Name', className: 'col-name' },
  { key: 'position', label: 'Pos', className: 'col-pos' },
  { key: 'team', label: 'Team', className: 'col-team' },
  { key: 'age', label: 'Age', className: 'col-age' },
  { key: 'composite_value', label: 'Composite', className: 'col-value' },
  { key: 'ktc_value', label: 'KTC', className: 'col-value ktc col-ktc' },
  { key: 'ecr_value', label: 'ECR', className: 'col-value ecr col-ecr' },
  { key: 'ktc_trend', label: 'Trend', className: 'col-trend' },
]

export default function RankingsExplorer() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState('composite_rank')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/rankings?limit=500`)
      if (!res.ok) throw new Error(`Failed to fetch rankings (${res.status})`)
      const data = await res.json()
      // Handle both array response and { players: [...] } shape
      const list = Array.isArray(data) ? data : (data.players || data.rankings || [])
      setPlayers(list)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // Default sort direction: Value and trend columns should default to 'desc' (highest first)
      // Rank, Age, and string columns should default to 'asc'
      const isDescDefault = ['composite_value', 'ktc_value', 'ecr_value', 'ktc_trend'].includes(key)
      setSortDir(isDescDefault ? 'desc' : 'asc')
    }
  }

  const filteredPlayers = useMemo(() => {
    let list = [...players]

    // Position filter
    if (posFilter !== 'ALL') {
      if (posFilter === 'PICKS') {
        list = list.filter((p) => !p.position || p.position === 'PICK')
      } else {
        list = list.filter((p) => p.position === posFilter)
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.team?.toLowerCase().includes(q) ||
          p.position?.toLowerCase().includes(q)
      )
    }

    // Sort
    list.sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]

      // Handle nulls
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

    return list
  }, [players, posFilter, search, sortKey, sortDir])

  const getTrendClass = (val) => {
    if (val == null || val === 0) return 'flat'
    return val > 0 ? 'up' : 'down'
  }

  const getTrendDisplay = (val) => {
    if (val == null || val === 0) return '—'
    return val > 0 ? `▲ ${val}` : `▼ ${Math.abs(val)}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading rankings…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-msg">{error}</div>
        <button className="error-retry" onClick={fetchPlayers}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="rankings">
      {/* Toolbar */}
      <div className="rankings-toolbar">
        <div className="rankings-search search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search players by name, team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rankings-filters">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              className={`filter-btn${posFilter === pos ? ' active' : ''}`}
              onClick={() => setPosFilter(pos)}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="rankings-count">
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content: Table + Detail */}
      <div className="rankings-content">
        <div className="rankings-table-wrap glass-panel">
          {filteredPlayers.length === 0 ? (
            <div className="rankings-empty">
              <div className="rankings-empty-icon">🔎</div>
              <div className="rankings-empty-text">No players found</div>
            </div>
          ) : (
            <table className="rankings-table">
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`${col.className}${sortKey === col.key ? ' sorted' : ''}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="sort-arrow">
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, index) => (
                  <tr
                    key={player.id || index}
                    className={selectedPlayer?.id === player.id ? 'selected' : ''}
                    onClick={() =>
                      setSelectedPlayer(
                        selectedPlayer?.id === player.id ? null : player
                      )
                    }
                  >
                    <td className="col-rank">
                      {player.composite_rank ?? '—'}
                    </td>
                    <td className="col-name">{player.name}</td>
                    <td className="col-pos">
                      <span className={`pos-badge ${player.position || 'PICK'}`}>
                        {player.position || 'PICK'}
                      </span>
                    </td>
                    <td className="col-team">{player.team || '—'}</td>
                    <td className="col-age">{player.age > 0 ? player.age : '—'}</td>
                    <td className="col-value">
                      {player.composite_value?.toLocaleString() ?? '—'}
                    </td>
                    <td className="col-value ktc col-ktc">
                      {player.ktc_value?.toLocaleString() ?? '—'}
                    </td>
                    <td className="col-value ecr col-ecr">
                      {player.ecr_value?.toLocaleString() ?? '—'}
                    </td>
                    <td className={`col-trend ${getTrendClass(player.ktc_trend)}`}>
                      {getTrendDisplay(player.ktc_trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedPlayer && (
          <div className="rankings-detail-wrap">
            <PlayerDetailPanel
              player={selectedPlayer}
              onClose={() => setSelectedPlayer(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
