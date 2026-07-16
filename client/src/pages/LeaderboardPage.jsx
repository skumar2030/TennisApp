import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/quiz/leaderboard`)
      .then(res => {
        setLeaderboard(res.data.leaderboard)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const rankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', bg: 'bg-yellow-50', border: 'border-yellow-300' }
    if (rank === 2) return { icon: '🥈', bg: 'bg-gray-50 dark:bg-gray-900', border: 'border-gray-300' }
    if (rank === 3) return { icon: '🥉', bg: 'bg-orange-50', border: 'border-orange-300' }
    return { icon: null, bg: 'bg-white dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Leaderboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Global quiz rankings</p>
        </div>
        <button
          onClick={() => navigate('/play4fun')}
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          Play Quiz
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span className="text-4xl">🏆</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">No quiz results yet. Be the first to play!</p>
          <button
            onClick={() => navigate('/play4fun')}
            className="mt-4 px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Start a Quiz
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3 w-16">Rank</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Player</th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Avg Score</th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Best</th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Quizzes</th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-5 py-3">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaderboard.map(entry => {
                const rb = rankBadge(entry.rank)
                return (
                  <tr key={entry.userId} className={`${rb.bg} hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {rb.icon ? (
                          <span className="text-lg">{rb.icon}</span>
                        ) : (
                          <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{entry.userName}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-bold ${
                        entry.avgScore >= 80 ? 'text-green-600' :
                        entry.avgScore >= 60 ? 'text-blue-600' :
                        entry.avgScore >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {entry.avgScore}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{entry.bestScore}/20</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{entry.totalQuizzes}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-0.5">
                        {entry.badges.slice(0, 5).map(b => (
                          <span key={b.id} title={b.name} className="text-sm cursor-default">{b.icon}</span>
                        ))}
                        {entry.badges.length === 0 && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
