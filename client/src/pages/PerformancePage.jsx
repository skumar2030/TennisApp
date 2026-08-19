import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ label, value, max, color = 'green' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }
  return (
    <div className="py-1.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-800 dark:text-gray-100">{value}/{max} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-2 rounded-full ${colorClasses[color]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function H2HBar({ label, val1, val2, name1, name2 }) {
  const total = (val1 || 0) + (val2 || 0)
  const pct1 = total > 0 ? (val1 / total) * 100 : 50
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-green-600">{val1}</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
        <span className="font-semibold text-blue-600">{val2}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="bg-green-500 transition-all" style={{ width: `${pct1}%` }} />
        <div className="bg-blue-500 transition-all" style={{ width: `${100 - pct1}%` }} />
      </div>
    </div>
  )
}

function scoreLabel(scores) {
  if (!scores || scores.length === 0) return ''
  return scores.map(s => {
    const base = `${s.team1Games}-${s.team2Games}`
    return s.tiebreak ? `${base}(${s.tiebreak})` : base
  }).join(', ')
}

export default function PerformancePage() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [perfData, setPerfData] = useState(null)
  const [perfLoading, setPerfLoading] = useState(false)

  // Head-to-head
  const [h2hPlayer1, setH2hPlayer1] = useState('')
  const [h2hPlayer2, setH2hPlayer2] = useState('')
  const [h2hData, setH2hData] = useState(null)
  const [h2hLoading, setH2hLoading] = useState(false)

  const [tab, setTab] = useState('player')

  useEffect(() => {
    axios.get('/api/players').then(r => setPlayers(r.data)).catch(() => {})
  }, [])

  const fetchPerformance = (pid) => {
    if (!pid) { setPerfData(null); return }
    setPerfLoading(true)
    axios.get(`/api/performance/player/${pid}`)
      .then(r => setPerfData(r.data))
      .catch(() => setPerfData(null))
      .finally(() => setPerfLoading(false))
  }

  const fetchH2H = () => {
    if (!h2hPlayer1 || !h2hPlayer2 || h2hPlayer1 === h2hPlayer2) return
    setH2hLoading(true)
    axios.get(`/api/performance/head-to-head?player1=${h2hPlayer1}&player2=${h2hPlayer2}`)
      .then(r => setH2hData(r.data))
      .catch(() => setH2hData(null))
      .finally(() => setH2hLoading(false))
  }

  const handlePlayerSelect = (pid) => {
    setSelectedPlayer(pid)
    fetchPerformance(pid)
  }

  const playerName = (id) => {
    const p = players.find(p => String(p.id) === String(id))
    return p?.name || 'Unknown'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Performance Intelligence</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('player')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'player' ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          Player Stats
        </button>
        <button
          onClick={() => setTab('h2h')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'h2h' ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          Head-to-Head
        </button>
      </div>

      {/* Player Stats Tab */}
      {tab === 'player' && (
        <div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Select Player</label>
            <select
              value={selectedPlayer}
              onChange={e => handlePlayerSelect(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 w-full max-w-xs"
            >
              <option value="">Choose a player...</option>
              {players.filter(p => !String(p.id).startsWith('profile_')).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {perfLoading && <p className="text-sm text-gray-400">Loading performance data...</p>}

          {perfData && !perfLoading && (
            <div>
              {/* Overview cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Matches" value={perfData.totalMatches} />
                <StatCard label="Win Rate" value={`${perfData.winRate}%`} sub={`${perfData.wins}W - ${perfData.losses}L`} />
                <StatCard
                  label="Singles"
                  value={`${perfData.singlesRecord.wins}-${perfData.singlesRecord.losses}`}
                  sub={perfData.singlesRecord.wins + perfData.singlesRecord.losses > 0
                    ? `${Math.round((perfData.singlesRecord.wins / (perfData.singlesRecord.wins + perfData.singlesRecord.losses)) * 100)}%`
                    : '—'}
                />
                <StatCard
                  label="Doubles"
                  value={`${perfData.doublesRecord.wins}-${perfData.doublesRecord.losses}`}
                  sub={perfData.doublesRecord.wins + perfData.doublesRecord.losses > 0
                    ? `${Math.round((perfData.doublesRecord.wins / (perfData.doublesRecord.wins + perfData.doublesRecord.losses)) * 100)}%`
                    : '—'}
                />
              </div>

              {/* Detailed stats */}
              {perfData.stats && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Aggregated Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <ProgressBar label="Points Won" value={perfData.stats.totalPointsWon} max={perfData.stats.totalPointsPlayed} color="green" />
                    <ProgressBar label="1st Serve %" value={perfData.stats.firstServeIn} max={perfData.stats.firstServeTotal} color="blue" />
                    <ProgressBar label="Service Pts Won" value={perfData.stats.servicePointsWon} max={perfData.stats.servicePointsTotal} color="green" />
                    <ProgressBar label="Return Pts Won" value={perfData.stats.returnPointsWon} max={perfData.stats.returnPointsTotal} color="yellow" />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {[
                      ['Aces', perfData.stats.aces],
                      ['Winners', perfData.stats.winners],
                      ['Forced Err', perfData.stats.forcedErrors],
                      ['Unforced Err', perfData.stats.unforcedErrors],
                      ['Double Faults', perfData.stats.doubleFaults],
                      ['Net Points', perfData.stats.netPointsWon],
                    ].map(([label, val]) => (
                      <div key={label} className="text-center">
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{val}</p>
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent matches */}
              {perfData.recentMatches.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Matches</h3>
                  <div className="space-y-2">
                    {perfData.recentMatches.map(m => (
                      <Link key={m.id} to={`/history/${m.id}/stats`} className="block">
                        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.won ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {m.won ? 'W' : 'L'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                              {m.team1.join(' / ')} vs {m.team2.join(' / ')}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(m.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' '}&middot;{' '}{m.matchType}
                              {m.scores.length > 0 && ` — ${scoreLabel(m.scores)}`}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {perfData.totalMatches === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No completed matches found for this player.</p>
                  <p className="text-sm mt-1">Complete a match to see performance data.</p>
                </div>
              )}
            </div>
          )}

          {!selectedPlayer && !perfLoading && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg">Select a player to view performance stats</p>
              <p className="text-sm mt-1">Track wins, losses, serve percentages, and more.</p>
            </div>
          )}
        </div>
      )}

      {/* Head-to-Head Tab */}
      {tab === 'h2h' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Player 1</label>
              <select
                value={h2hPlayer1}
                onChange={e => { setH2hPlayer1(e.target.value); setH2hData(null) }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              >
                <option value="">Select player...</option>
                {players.filter(p => !String(p.id).startsWith('profile_')).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <span className="text-lg font-bold text-gray-300 dark:text-gray-600">vs</span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Player 2</label>
              <select
                value={h2hPlayer2}
                onChange={e => { setH2hPlayer2(e.target.value); setH2hData(null) }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              >
                <option value="">Select player...</option>
                {players.filter(p => !String(p.id).startsWith('profile_') && String(p.id) !== h2hPlayer1).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchH2H}
                disabled={!h2hPlayer1 || !h2hPlayer2 || h2hPlayer1 === h2hPlayer2}
                className="px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Compare
              </button>
            </div>
          </div>

          {h2hLoading && <p className="text-sm text-gray-400">Loading head-to-head data...</p>}

          {h2hData && !h2hLoading && (
            <div>
              {h2hData.totalMatches === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No head-to-head matches found.</p>
                  <p className="text-sm mt-1">{playerName(h2hPlayer1)} and {playerName(h2hPlayer2)} haven't played against each other yet.</p>
                </div>
              ) : (
                <>
                  {/* H2H Record */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <p className="text-3xl font-bold text-green-600">{h2hData.player1Wins}</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{playerName(h2hPlayer1)}</p>
                      </div>
                      <div className="px-4">
                        <p className="text-sm text-gray-400">{h2hData.totalMatches} matches</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-3xl font-bold text-blue-600">{h2hData.player2Wins}</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{playerName(h2hPlayer2)}</p>
                      </div>
                    </div>

                    {/* Win bar */}
                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <div className="bg-green-500 transition-all" style={{ width: `${(h2hData.player1Wins / h2hData.totalMatches) * 100}%` }} />
                      <div className="bg-blue-500 transition-all" style={{ width: `${(h2hData.player2Wins / h2hData.totalMatches) * 100}%` }} />
                    </div>
                  </div>

                  {/* H2H Stats */}
                  {h2hData.stats && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-green-600">{playerName(h2hPlayer1)}</span>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aggregate Stats</h3>
                        <span className="text-sm font-bold text-blue-600">{playerName(h2hPlayer2)}</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        <H2HBar label="Points Won" val1={h2hData.stats.player1.pointsWon} val2={h2hData.stats.player2.pointsWon} />
                        <H2HBar label="Aces" val1={h2hData.stats.player1.aces} val2={h2hData.stats.player2.aces} />
                        <H2HBar label="Winners" val1={h2hData.stats.player1.winners} val2={h2hData.stats.player2.winners} />
                        <H2HBar label="Unforced Errors" val1={h2hData.stats.player1.unforcedErrors} val2={h2hData.stats.player2.unforcedErrors} />
                        <H2HBar label="Double Faults" val1={h2hData.stats.player1.doubleFaults} val2={h2hData.stats.player2.doubleFaults} />
                      </div>
                    </div>
                  )}

                  {/* Match History */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Match History</h3>
                    <div className="space-y-2">
                      {h2hData.matches.map(m => (
                        <Link key={m.id} to={`/history/${m.id}/stats`} className="block">
                          <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              m.winner === 'player1'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {m.winner === 'player1' ? playerName(h2hPlayer1) : playerName(h2hPlayer2)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400">
                                {new Date(m.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' '}&middot;{' '}{m.matchType}
                                {m.scores.length > 0 && ` — ${scoreLabel(m.scores)}`}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!h2hData && !h2hLoading && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <p className="text-lg">Compare two players head-to-head</p>
              <p className="text-sm mt-1">Select two players and click Compare to see their rivalry stats.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
