import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function ProfilePage() {
  const { user, isLoading } = useAuth0()
  const navigate = useNavigate()
  const [quizStats, setQuizStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!user?.sub) return
    axios.get(`${API}/quiz/profile/${encodeURIComponent(user.sub)}`)
      .then(res => {
        setQuizStats(res.data)
        setStatsLoading(false)
      })
      .catch(() => setStatsLoading(false))
  }, [user])

  if (isLoading) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">Loading profile...</p>
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile</h1>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name || 'Profile'}
              className="w-16 h-16 rounded-full border-2 border-green-200 object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div
            className="w-16 h-16 rounded-full bg-green-700 text-white items-center justify-center text-xl font-bold border-2 border-green-200"
            style={{ display: user.picture ? 'none' : 'flex' }}
          >
            {(user.name || user.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{user.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <DetailRow label="Email" value={user.email} />
          {user.email_verified !== undefined && (
            <DetailRow
              label="Email Verified"
              value={
                user.email_verified ? (
                  <span className="text-green-600 font-medium">Verified</span>
                ) : (
                  <span className="text-yellow-600 font-medium">Not verified</span>
                )
              }
            />
          )}
          {user.nickname && <DetailRow label="Nickname" value={user.nickname} />}
          {user.updated_at && (
            <DetailRow
              label="Last Updated"
              value={new Date(user.updated_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            />
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400">
            To change your password, use the "Forgot Password" link on the login page.
            Auth0 will send a password reset email to your registered address.
          </p>
        </div>
      </div>

      {/* Quiz Stats & Badges */}
      {!statsLoading && quizStats && (
        <>
          {/* Badges Section */}
          {quizStats.badges.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Badges Earned</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {quizStats.badges.map(badge => (
                  <div key={badge.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3 text-center">
                    <span className="text-3xl">{badge.icon}</span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">{badge.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Stats */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quiz Stats</h2>
              <button
                onClick={() => navigate('/play4fun')}
                className="text-sm font-medium text-green-700 hover:text-green-900"
              >
                Play Quiz
              </button>
            </div>

            {quizStats.totalQuizzes === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl">🎾</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No quizzes played yet</p>
                <button
                  onClick={() => navigate('/play4fun')}
                  className="mt-3 px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Start Playing
                </button>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <StatCard label="Quizzes Played" value={quizStats.totalQuizzes} />
                  <StatCard label="Avg Score" value={`${quizStats.avgScore}%`} />
                  <StatCard label="Best Score" value={`${quizStats.bestScore}/20`} />
                  <StatCard label="Perfect Quizzes" value={quizStats.perfectQuizzes} />
                  <StatCard label="Current Streak" value={`${quizStats.currentStreak} days`} />
                  <StatCard label="Best Streak" value={`${quizStats.maxStreak} days`} />
                  <StatCard label="Categories Played" value={quizStats.categoriesPlayed.length} />
                  <StatCard label="Fastest Avg" value={quizStats.fastestAvgTime ? `${quizStats.fastestAvgTime}s` : '-'} />
                </div>

                {/* Categories Played */}
                {quizStats.categoriesPlayed.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {quizStats.categoriesPlayed.map(cat => (
                        <span key={cat} className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent History */}
                {quizStats.recentHistory.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Quizzes</p>
                      <button
                        onClick={() => navigate('/play4fun/history')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {quizStats.recentHistory.slice(0, 5).map((entry, idx) => {
                        const date = new Date(entry.completedAt)
                        return (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                entry.percentage >= 80 ? 'bg-green-100 text-green-700' :
                                entry.percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                entry.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700 dark:text-red-400'
                              }`}>
                                {entry.percentage}%
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{entry.category}</p>
                                <p className="text-xs text-gray-400 capitalize">{entry.difficulty}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{entry.score}/{entry.totalQuestions}</p>
                              <p className="text-xs text-gray-400">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-100">{value}</span>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
