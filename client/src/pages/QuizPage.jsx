import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function QuizPage() {
  const { user } = useAuth0()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [difficulties, setDifficulties] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/quiz/categories`)
      .then(res => {
        setCategories(res.data.categories)
        setDifficulties(res.data.difficulties)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load quiz categories')
        setLoading(false)
      })
  }, [])

  const startQuiz = async () => {
    if (!selectedCategory || !selectedDifficulty) return
    setStarting(true)
    try {
      const res = await axios.post(`${API}/quiz/start`, {
        category: selectedCategory,
        difficulty: selectedDifficulty,
        userId: user.sub,
        userName: user.name || user.nickname || user.email,
      })
      navigate('/play4fun/game', {
        state: {
          sessionId: res.data.sessionId,
          questions: res.data.questions,
          totalQuestions: res.data.totalQuestions,
          category: selectedCategory,
          difficulty: selectedDifficulty,
          categoryName: categories.find(c => c.id === selectedCategory)?.name,
        }
      })
    } catch {
      setError('Failed to start quiz. Please try again.')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading quiz...</p>
      </div>
    )
  }

  const difficultyColors = { easy: 'green', medium: 'yellow', hard: 'red' }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Play4Fun</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Test your tennis knowledge with 20 questions!</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tennis Wordle Card */}
      <div
        onClick={() => navigate('/play4fun/wordle')}
        className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Tennis Boggle</h2>
            <p className="text-green-100 text-sm mt-1">Find tennis words on the grid — play with friends!</p>
          </div>
          <div className="flex gap-1">
            {['T', 'E', 'N', 'N', 'I', 'S'].map((l, i) => (
              <div key={i} className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded ${
                i < 2 ? 'bg-green-400' : i < 4 ? 'bg-yellow-400 text-gray-800 dark:text-gray-100' : 'bg-white dark:bg-gray-800/20'
              }`}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/play4fun/leaderboard')}
          className="text-sm font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Leaderboard
        </button>
        <button
          onClick={() => navigate('/play4fun/history')}
          className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          My History
        </button>
      </div>

      {/* Category Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Choose a Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedCategory === cat.id
                  ? 'border-green-600 bg-green-50 dark:bg-green-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-sm bg-white dark:bg-gray-800'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-2">{cat.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Choose Difficulty</h2>
        <div className="grid grid-cols-3 gap-3">
          {difficulties.map(diff => {
            const colors = {
              easy: { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20', dot: 'bg-green-500' },
              medium: { border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', dot: 'bg-yellow-500' },
              hard: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/30', dot: 'bg-red-500' },
            }
            const c = colors[diff.id]
            return (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedDifficulty === diff.id
                    ? `${c.border} ${c.bg} shadow-md`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-sm bg-white dark:bg-gray-800'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${c.dot} mx-auto mb-2`} />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{diff.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{diff.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={startQuiz}
          disabled={!selectedCategory || !selectedDifficulty || starting}
          className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
            selectedCategory && selectedDifficulty && !starting
              ? 'bg-green-700 hover:bg-green-800 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {starting ? 'Starting...' : 'Start Quiz (20 Questions)'}
        </button>
        {selectedCategory && selectedDifficulty && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {categories.find(c => c.id === selectedCategory)?.name} - {difficulties.find(d => d.id === selectedDifficulty)?.name} | 20 seconds per question
          </p>
        )}
      </div>
    </div>
  )
}
