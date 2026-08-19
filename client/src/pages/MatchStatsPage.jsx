import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

function StatBar({ label, val1, val2, suffix = '' }) {
  const total = (val1 || 0) + (val2 || 0)
  const pct1 = total > 0 ? (val1 / total) * 100 : 50
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-gray-800 dark:text-gray-100">{val1}{suffix}</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-100">{val2}{suffix}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="bg-green-500 transition-all" style={{ width: `${pct1}%` }} />
        <div className="bg-blue-500 transition-all" style={{ width: `${100 - pct1}%` }} />
      </div>
    </div>
  )
}

function ShotBreakdown({ title, data1, data2 }) {
  if (!data1 && !data2) return null
  const allKeys = [...new Set([...Object.keys(data1 || {}), ...Object.keys(data2 || {})])]
  if (allKeys.length === 0) return null

  const formatLabel = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-1">
        {allKeys.map(key => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-green-600 font-medium w-8 text-right">{data1?.[key] || 0}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">{formatLabel(key)}</span>
            <span className="text-blue-600 font-medium w-8">{data2?.[key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MatchStatsPage() {
  const { matchId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`/api/matches/${matchId}/stats`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load match stats.'))
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading match stats...</div>
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>
  if (!data?.match) return <div className="text-center py-20 text-gray-400">Match not found.</div>

  const { match, stats, comments } = data
  const team1 = match.matchPlayers.filter(p => p.team === 1)
  const team2 = match.matchPlayers.filter(p => p.team === 2)
  const team1Label = team1.map(p => p.player?.name || p.tbdName || 'TBD').join(' / ')
  const team2Label = team2.map(p => p.player?.name || p.tbdName || 'TBD').join(' / ')
  const dateStr = new Date(match.dateTime).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div>
      <Link to="/history" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 mb-4 inline-block">
        &larr; Back to Match History
      </Link>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
        <p className="text-xs text-gray-400 mb-3">{dateStr} &middot; {match.location} &middot; {match.matchType}</p>

        {/* Score header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 text-right">
            <p className={`text-lg font-bold ${match.winner === 'team1' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
              {team1Label}
            </p>
            {match.winner === 'team1' && <span className="text-xs font-bold text-green-600">Winner</span>}
          </div>
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">vs</p>
          </div>
          <div className="flex-1">
            <p className={`text-lg font-bold ${match.winner === 'team2' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
              {team2Label}
            </p>
            {match.winner === 'team2' && <span className="text-xs font-bold text-green-600">Winner</span>}
          </div>
        </div>

        {/* Set scores */}
        {match.scores && match.scores.length > 0 && (
          <div className="flex justify-center gap-6 mb-2">
            {match.scores.map(s => (
              <div key={s.setNumber} className="text-center">
                <p className="text-xs text-gray-400 mb-1">Set {s.setNumber}</p>
                <div className="flex gap-2 justify-center">
                  <span className={`text-lg font-bold ${s.team1Games > s.team2Games ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.team1Games}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">-</span>
                  <span className={`text-lg font-bold ${s.team2Games > s.team1Games ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.team2Games}
                  </span>
                </div>
                {s.tiebreak && <p className="text-xs text-gray-400">({s.tiebreak})</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats comparison */}
      {stats ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-green-600">{team1Label}</span>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Match Statistics</h3>
            <span className="text-sm font-bold text-blue-600">{team2Label}</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <StatBar label="Points Won" val1={stats.team1.totalPointsWon} val2={stats.team2.totalPointsWon} />
            <StatBar label="Aces" val1={stats.team1.aces} val2={stats.team2.aces} />
            <StatBar label="Double Faults" val1={stats.team1.doubleFaults} val2={stats.team2.doubleFaults} />
            <StatBar label="Winners" val1={stats.team1.winners} val2={stats.team2.winners} />
            <StatBar label="Unforced Errors" val1={stats.team1.unforcedErrors} val2={stats.team2.unforcedErrors} />
            <StatBar label="1st Serve %" val1={stats.team1.firstServePct} val2={stats.team2.firstServePct} suffix="%" />
            <StatBar
              label="Service Pts Won"
              val1={stats.team1.servicePointsWon}
              val2={stats.team2.servicePointsWon}
            />
            <StatBar
              label="Return Pts Won"
              val1={stats.team1.returnPointsWon}
              val2={stats.team2.returnPointsWon}
            />
            <StatBar label="Net Points Won" val1={stats.team1.netPointsWon} val2={stats.team2.netPointsWon} />
            <StatBar label="Break Pts Converted" val1={stats.team1.breakPointsConverted} val2={stats.team2.breakPointsConverted} />
          </div>

          {/* Shot type and direction breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <ShotBreakdown title="Winners by Shot" data1={stats.team1.winnersByShot} data2={stats.team2.winnersByShot} />
            <ShotBreakdown title="Winners by Direction" data1={stats.team1.winnersByDirection} data2={stats.team2.winnersByDirection} />
          </div>

          {/* Rally length */}
          {(stats.team1.avgRallyLength || stats.team2.avgRallyLength) && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Rally Length</h4>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-green-600 font-semibold">{stats.team1.avgRallyLength || '—'}</span>
                  <span className="text-gray-400 text-xs ml-1">avg</span>
                  <span className="text-green-600 font-semibold ml-3">{stats.team1.maxRally || '—'}</span>
                  <span className="text-gray-400 text-xs ml-1">max</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs mr-1">avg</span>
                  <span className="text-blue-600 font-semibold">{stats.team2.avgRallyLength || '—'}</span>
                  <span className="text-gray-400 text-xs ml-3 mr-1">max</span>
                  <span className="text-blue-600 font-semibold">{stats.team2.maxRally || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No point-by-point data recorded for this match.</p>
          <p className="text-gray-400 text-xs mt-1">Use Live Score during a match to capture detailed statistics.</p>
        </div>
      )}

      {/* Match comments */}
      {comments && comments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Match Notes</h3>
          <div className="space-y-2">
            {comments.map(c => (
              <div key={c.id} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-xs text-gray-400 mr-2">
                  {c.scope === 'match' ? 'Match' : c.scope === 'set' ? `Set ${c.setNumber}` : `Set ${c.setNumber} Game ${c.gameNumber}`}:
                </span>
                {c.comment}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
