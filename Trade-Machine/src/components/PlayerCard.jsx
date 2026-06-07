import './PlayerCard.css'

/**
 * Compact player card used in trade panels.
 * Shows name, position badge, team, age, value, and optional remove button.
 */
export default function PlayerCard({ player, onRemove, valueMode = 'composite' }) {
  const pos = player.position || 'PICK'
  const isPick = !player.position || player.position === 'PICK'

  const getValue = () => {
    if (valueMode === 'contender') return player.contender_value
    if (valueMode === 'rebuilder') return player.rebuilder_value
    return player.composite_value
  }

  const value = getValue()

  return (
    <div className={`player-card ${pos}`}>
      <span className={`pos-badge ${pos}`}>{pos}</span>
      <div className="player-card-info">
        <div className="player-card-name">{player.name}</div>
        <div className="player-card-meta">
          {!isPick && player.team && (
            <span className="player-card-team">{player.team}</span>
          )}
          {!isPick && player.age > 0 && (
            <span className="player-card-age">Age {player.age}</span>
          )}
        </div>
      </div>
      <div className="player-card-value">
        {value != null ? value.toLocaleString() : '—'}
      </div>
      {onRemove && (
        <button
          className="player-card-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(player.id); }}
          title="Remove"
          aria-label={`Remove ${player.name}`}
        >
          ✕
        </button>
      )}
    </div>
  )
}

/**
 * Detail panel for a selected player (used in Rankings view).
 */
export function PlayerDetailPanel({ player, onClose }) {
  if (!player) return null
  const pos = player.position || 'PICK'

  return (
    <div className="player-card-detail fade-in">
      <div className="player-card-detail-header">
        <div className={`player-card-detail-avatar ${pos}`}>
          {pos.slice(0, 2)}
        </div>
        <div>
          <div className="player-card-detail-name">{player.name}</div>
          <div className="player-card-detail-sub">
            {player.position && `${player.position} · `}
            {player.team && `${player.team} · `}
            {player.age > 0 && `Age ${player.age}`}
          </div>
        </div>
        {onClose && (
          <button
            className="player-card-remove"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
            aria-label="Close detail panel"
          >
            ✕
          </button>
        )}
      </div>

      <div className="player-card-detail-grid">
        <div className="detail-stat">
          <div className="detail-stat-label">Composite</div>
          <div className="detail-stat-value green">
            {player.composite_value?.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">KTC Value</div>
          <div className="detail-stat-value blue">
            {player.ktc_value?.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">ECR Value</div>
          <div className="detail-stat-value purple">
            {player.ecr_value?.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Contender</div>
          <div className="detail-stat-value">
            {player.contender_value?.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Rebuilder</div>
          <div className="detail-stat-value">
            {player.rebuilder_value?.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Rank</div>
          <div className="detail-stat-value">
            #{player.composite_rank ?? player.ktc_rank ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Tier</div>
          <div className="detail-stat-value">
            {player.ktc_tier ?? '—'}
          </div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Trend</div>
          <div className="detail-stat-value" style={{
            color: (player.ktc_trend ?? 0) > 0 ? 'var(--neon-green)' :
                   (player.ktc_trend ?? 0) < 0 ? 'var(--neon-red)' : 'var(--text-secondary)'
          }}>
            {(player.ktc_trend ?? 0) > 0 ? '▲' : (player.ktc_trend ?? 0) < 0 ? '▼' : '—'}
            {' '}{Math.abs(player.ktc_trend ?? 0)}
          </div>
        </div>
      </div>
    </div>
  )
}
