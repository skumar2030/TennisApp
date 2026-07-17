import { useLocation, useNavigate } from 'react-router-dom'

export default function QuizResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  if (!data) {
    navigate('/play4fun')
    return null
  }

  const { score, totalQuestions, percentage, avgTime, categoryName, difficulty, answers, results } = data

  const grade = percentage === 100 ? { label: 'Perfect!', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: '🏆' }
    : percentage >= 80 ? { label: 'Excellent!', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: '🌟' }
    : percentage >= 60 ? { label: 'Good Job!', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '👍' }
    : percentage >= 40 ? { label: 'Not Bad', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: '📚' }
    : { label: 'Keep Trying!', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30', icon: '💪' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score Card */}
      <div className={`${grade.bg} rounded-xl border p-8 text-center`}>
        <span className="text-5xl">{grade.icon}</span>
        <h1 className={`text-2xl font-bold ${grade.color} mt-3`}>{grade.label}</h1>
        <div className="mt-4">
          <span className="text-5xl font-bold text-gray-800 dark:text-gray-100">{score}</span>
          <span className="text-2xl text-gray-400">/{totalQuestions}</span>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">{percentage}% correct</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">{categoryName}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Difficulty</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1 capitalize">{difficulty}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Time</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">{avgTime}s</p>
        </div>
      </div>

      {/* Answer Review */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Answer Review</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {answers.map((ans, idx) => (
            <div key={idx} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  ans.isCorrect ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {ans.isCorrect ? (
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                    Q{idx + 1}: {results?.[idx]?.question || `Question ${idx + 1}`}
                  </p>
                  {!ans.isCorrect && (
                    <div className="mt-1 space-y-0.5">
                      {ans.userAnswer && (
                        <p className="text-xs text-red-600">Your answer: {ans.userAnswer}</p>
                      )}
                      <p className="text-xs text-green-700">Correct: {ans.correctAnswer}</p>
                    </div>
                  )}
                  {ans.explanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ans.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/play4fun')}
          className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate('/play4fun/leaderboard')}
          className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
        >
          Leaderboard
        </button>
        <button
          onClick={() => navigate('/play4fun/history')}
          className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
        >
          My History
        </button>
      </div>
    </div>
  )
}
