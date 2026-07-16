import { useEffect, useState } from 'react'
import axios from 'axios'

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' },
]

const CATEGORY_COLORS = {
  match_fee: 'bg-blue-100 text-blue-700',
  court_rental: 'bg-purple-100 text-purple-700',
  equipment: 'bg-yellow-100 text-yellow-700',
  strings: 'bg-orange-100 text-orange-700',
  footwear: 'bg-pink-100 text-pink-700',
  coaching: 'bg-teal-100 text-teal-700',
  apparel: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

export default function ExpenseSummaryPage() {
  const [summary, setSummary] = useState(null)
  const [period, setPeriod] = useState('monthly')
  const [playerId, setPlayerId] = useState('')
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/players').then(r => setPlayers(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (playerId) params.set('playerId', playerId)
    axios.get(`/api/expenses/summary?${params}`)
      .then(r => setSummary(r.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [period, playerId])

  const categoryEntries = summary ? Object.entries(summary.byCategory).sort((a, b) => b[1].total - a[1].total) : []
  const playerEntries = summary ? Object.entries(summary.byPlayer).sort((a, b) => b[1].total - a[1].total) : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Expense Summary</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={playerId}
          onChange={e => setPlayerId(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Players</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      ) : !summary || summary.count === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No expenses for this period.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total card */}
          <div className="bg-green-700 text-white rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">
                {PERIODS.find(p => p.value === period)?.label} Total
                {playerId && players.find(p => String(p.id) === playerId) && (
                  <span> — {players.find(p => String(p.id) === playerId).name}</span>
                )}
              </p>
              <p className="text-4xl font-bold mt-1">${summary.total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-sm">{summary.count} expense{summary.count !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Category */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">By Category</h2>
              <div className="space-y-3">
                {categoryEntries.map(([cat, data]) => {
                  const pct = summary.total > 0 ? (data.total / summary.total) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_COLORS[cat] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          {data.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">${data.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{data.count} expense{data.count !== 1 ? 's' : ''} · {pct.toFixed(1)}%</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* By Player */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">By Player</h2>
              {playerEntries.length === 0 ? (
                <p className="text-sm text-gray-400">No data.</p>
              ) : (
                <div className="space-y-3">
                  {playerEntries.map(([pid, data]) => {
                    const pct = summary.total > 0 ? (data.total / summary.total) * 100 : 0
                    return (
                      <div key={pid}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{data.name}</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">${data.total.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-400 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{data.count} expense{data.count !== 1 ? 's' : ''} · {pct.toFixed(1)}%</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
