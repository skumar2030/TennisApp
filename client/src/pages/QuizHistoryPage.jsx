import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function QuizHistoryPage() {
  const { user } = useAuth0()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.sub) return
    axios.get(`${API}/quiz/history/${encodeURIComponent(user.sub)}`)
      .then(res => {
        setHistory(res.data.history)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading history...</p>
      </div>
    )
  }

  const categoryNames = {
    grand_slams: 'Grand Slams',
    atp: 'ATP Tour',
    wta: 'WTA Tour',
    records: 'Records & Stats',
    rankings: 'World Rankings',
    legends: 'Legends & History',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quiz History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{history.length} quizzes completed</p>
        </div>
        <button
          onClick={() => navigate('/play4fun')}
          className="text-sm font-medium text-green-700 hover:text-green-900"
        >
          Play Again
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span className="text-4xl">📝</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">No quiz history yet. Play your first quiz!</p>
          <button
            onClick={() => navigate('/play4fun')}
            className="mt-4 px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Start a Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry, idx) => {
            const pct = entry.percentage
            const color = pct >= 80 ? 'green' : pct >= 60 ? 'blue' : pct >= 40 ? 'yellow' : 'red'
            const date = new Date(entry.completedAt)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  color === 'green' ? 'bg-green-100' :
                  color === 'blue' ? 'bg-blue-100' :
                  color === 'yellow' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    color === 'green' ? 'text-green-700' :
                    color === 'blue' ? 'text-blue-700' :
                    color === 'yellow' ? 'text-yellow-700' :
                    'text-red-700 dark:text-red-400'
                  }`}>
                    {pct}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {categoryNames[entry.category] || entry.category}
                    </span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${
                      entry.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      entry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700 dark:text-red-400'
                    }`}>
                      {entry.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {dateStr} at {timeStr}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{entry.score}/{entry.totalQuestions}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg: {entry.avgTime}s</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
