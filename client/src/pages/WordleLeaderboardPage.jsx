import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function WordleLeaderboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/wordle/leaderboard')
      .then(({ data }) => setEntries(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/play4fun/wordle')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
          ← Back to Boggle
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Boggle Leaderboard</h1>
        <div />
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No games played yet. Be the first!</p>
          <button
            onClick={() => navigate('/play4fun/wordle')}
            className="mt-4 bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
          >
            Play Now
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="px-3 py-2 text-left w-12">#</th>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-3 py-2 text-center">Avg Score</th>
                <th className="px-3 py-2 text-center">Best</th>
                <th className="px-3 py-2 text-center">Avg Words</th>
                <th className="px-3 py-2 text-center">Games</th>
                <th className="px-3 py-2 text-center hidden sm:table-cell">Longest</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.userId} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900/50">
                  <td className="px-3 py-2.5 font-bold text-gray-400">
                    {medals[e.rank] || e.rank}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-100">{e.userName}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-bold text-green-600">{e.avgScore}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-yellow-600">{e.bestScore}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{e.avgWords}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{e.totalGames}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">{e.longestWord || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
