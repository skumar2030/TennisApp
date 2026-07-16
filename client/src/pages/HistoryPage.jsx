import { useEffect, useState } from 'react'
import axios from 'axios'

function formatDateTime(dt) {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function playerLabel(mp) {
  if (mp.player) return mp.player.name
  if (mp.tbdName) return mp.tbdName
  return 'TBD'
}

function scoreLabel(scores) {
  if (!scores || scores.length === 0) return null
  return scores.map(s => {
    const base = `${s.team1Games}-${s.team2Games}`
    return s.tiebreak ? `${base} (${s.tiebreak})` : base
  }).join(', ')
}

function WinLossBadge({ match, filterPlayerId, players }) {
  if (!match.winner) return null

  // If filtering by a specific player, show W/L relative to that player's team
  if (filterPlayerId) {
    const pid = parseInt(filterPlayerId)
    const playerSlot = match.matchPlayers.find(mp => mp.playerId === pid)
    if (playerSlot) {
      const playerTeam = `team${playerSlot.team}`
      const won = match.winner === playerTeam
      return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${won ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {won ? 'W' : 'L'}
        </span>
      )
    }
  }

  // Generic: show which team won
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
      {match.winner === 'team1' ? 'Team 1 won' : match.winner === 'team2' ? 'Team 2 won' : 'Tie'}
    </span>
  )
}

export default function HistoryPage() {
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ playerId: '', from: '', to: '' })

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/matches?status=past')
      setMatches(data)
    } catch {
      setError('Failed to load match history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    axios.get('/api/players').then(r => setPlayers(r.data)).catch(() => {})
  }, [])

  // Filter client-side (all past matches already fetched)
  const filtered = matches.filter(m => {
    if (filters.playerId) {
      const pid = parseInt(filters.playerId)
      const inMatch = m.matchPlayers.some(mp => mp.playerId === pid)
      if (!inMatch) return false
    }
    if (filters.from) {
      if (new Date(m.dateTime) < new Date(filters.from)) return false
    }
    if (filters.to) {
      const to = new Date(filters.to)
      to.setHours(23, 59, 59, 999)
      if (new Date(m.dateTime) > to) return false
    }
    return true
  })

  const clearFilters = () => setFilters({ playerId: '', from: '', to: '' })
  const hasFilters = filters.playerId || filters.from || filters.to

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Match History</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Player</label>
          <select
            value={filters.playerId}
            onChange={e => setFilters(f => ({ ...f, playerId: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Players</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 underline pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Stats bar */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(() => {
            let wins = 0, losses = 0
            if (filters.playerId) {
              const pid = parseInt(filters.playerId)
              filtered.forEach(m => {
                const slot = m.matchPlayers.find(mp => mp.playerId === pid)
                if (slot && m.winner) {
                  if (m.winner === `team${slot.team}`) wins++
                  else losses++
                }
              })
            }
            return (
              <>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{filtered.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Matches Played</p>
                </div>
                {filters.playerId && (
                  <>
                    <div className="bg-white dark:bg-gray-800 border border-green-200 rounded-lg p-4 text-center shadow-sm">
                      <p className="text-2xl font-bold text-green-600">{wins}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Wins</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center shadow-sm">
                      <p className="text-2xl font-bold text-red-500">{losses}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Losses</p>
                    </div>
                  </>
                )}
              </>
            )
          })()}
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{hasFilters ? 'No matches found for these filters.' : 'No completed matches yet.'}</p>
          <p className="text-sm mt-1">Record scores on the Schedule page to see history here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(m => {
            const team1 = m.matchPlayers.filter(p => p.team === 1)
            const team2 = m.matchPlayers.filter(p => p.team === 2)
            const team1Label = team1.map(playerLabel).join(' / ')
            const team2Label = team2.map(playerLabel).join(' / ')
            const score = scoreLabel(m.scores)
            const isTeam1Winner = m.winner === 'team1'
            const isTeam2Winner = m.winner === 'team2'

            return (
              <div key={m.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-2">{formatDateTime(m.dateTime)} · {m.location}</p>

                    {/* Score row */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${isTeam1Winner ? 'text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}>
                            {team1Label}
                          </span>
                          {isTeam1Winner && <span className="text-xs font-bold text-green-600">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-semibold text-sm ${isTeam2Winner ? 'text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}>
                            {team2Label}
                          </span>
                          {isTeam2Winner && <span className="text-xs font-bold text-green-600">✓</span>}
                        </div>
                      </div>

                      {/* Set scores column */}
                      {m.scores && m.scores.length > 0 && (
                        <div className="flex gap-2 shrink-0">
                          {m.scores.map(s => (
                            <div key={s.setNumber} className="text-center">
                              <p className="text-xs text-gray-400 mb-0.5">Set {s.setNumber}</p>
                              <div className={`text-sm font-bold ${s.team1Games > s.team2Games ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.team1Games}
                              </div>
                              <div className={`text-sm font-bold ${s.team2Games > s.team1Games ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.team2Games}
                              </div>
                              {s.tiebreak && <p className="text-xs text-gray-400">({s.tiebreak})</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {!score && (
                      <p className="text-xs text-gray-400 mt-1 italic">No score recorded</p>
                    )}
                  </div>

                  {/* Right side badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      m.matchType === 'doubles' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {m.matchType}
                    </span>
                    <WinLossBadge match={m} filterPlayerId={filters.playerId} players={players} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
