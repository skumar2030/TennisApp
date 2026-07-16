import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const TIME_LIMIT = 20 // seconds per question

export default function QuizGame() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId, questions, totalQuestions, category, difficulty, categoryName } = location.state || {}

  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [fillAnswer, setFillAnswer] = useState('')
  const [feedback, setFeedback] = useState(null) // { isCorrect, correctAnswer, explanation }
  const [score, setScore] = useState(0)
  const [answering, setAnswering] = useState(false)
  const [results, setResults] = useState([]) // track all answers for review
  const timerRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  const currentQuestion = questions?.[currentIndex]

  // Redirect if no quiz data
  useEffect(() => {
    if (!sessionId || !questions) {
      navigate('/play4fun')
    }
  }, [sessionId, questions, navigate])

  const submitAnswer = useCallback(async (answer, timedOut = false) => {
    if (answering || feedback) return
    setAnswering(true)
    clearInterval(timerRef.current)

    const timeTaken = (Date.now() - startTimeRef.current) / 1000
    const userAnswer = timedOut ? '' : answer

    try {
      const res = await axios.post(`${API}/quiz/answer`, {
        sessionId,
        questionId: currentQuestion.id,
        userAnswer: userAnswer || '',
        timeTaken: Math.round(timeTaken * 10) / 10,
      })

      const result = {
        questionNumber: currentIndex + 1,
        question: currentQuestion.question,
        userAnswer: userAnswer || '(Time expired)',
        correctAnswer: res.data.correctAnswer,
        isCorrect: res.data.isCorrect,
        explanation: res.data.explanation,
        timedOut,
      }
      setResults(prev => [...prev, result])

      if (res.data.isCorrect) {
        setScore(prev => prev + 1)
      }

      setFeedback({
        isCorrect: res.data.isCorrect,
        correctAnswer: res.data.correctAnswer,
        explanation: res.data.explanation,
        timedOut,
      })
    } catch {
      setFeedback({
        isCorrect: false,
        correctAnswer: 'Error submitting answer',
        explanation: '',
        timedOut: false,
      })
    }
    setAnswering(false)
  }, [answering, feedback, sessionId, currentQuestion, currentIndex])

  // Timer
  useEffect(() => {
    if (!currentQuestion || feedback) return

    setTimeLeft(TIME_LIMIT)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          submitAnswer('', true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentIndex, currentQuestion, feedback, submitAnswer])

  const nextQuestion = async () => {
    if (currentIndex + 1 >= totalQuestions) {
      // Complete the quiz
      try {
        const res = await axios.post(`${API}/quiz/complete`, { sessionId })
        navigate('/play4fun/results', {
          state: {
            ...res.data,
            categoryName,
            results,
          }
        })
      } catch {
        navigate('/play4fun')
      }
      return
    }

    setCurrentIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setFillAnswer('')
    setFeedback(null)
  }

  if (!currentQuestion) return null

  const timerColor = timeLeft > 10 ? 'text-green-600' : timeLeft > 5 ? 'text-yellow-600' : 'text-red-600'
  const timerBg = timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
  const progressPercent = ((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{categoryName}</span>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{difficulty}</span>
        </div>
        <div className="text-sm font-semibold text-green-700">
          Score: {score}/{currentIndex + (feedback ? 1 : 0)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <div className={`flex items-center gap-2 ${timerColor}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-bold tabular-nums">{timeLeft}s</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`${timerBg} h-1.5 rounded-full transition-all duration-1000`}
            style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
          />
        </div>

        {/* Question Type Badge */}
        <div>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
            currentQuestion.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
            currentQuestion.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' :
             currentQuestion.type === 'true_false' ? 'True / False' :
             'Fill in the Blank'}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* Answer Options */}
        <div className="space-y-2">
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options.map((option, idx) => {
            let btnClass = 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900'
            if (feedback) {
              if (option === feedback.correctAnswer) {
                btnClass = 'border-green-500 bg-green-50 text-green-800'
              } else if (option === selectedAnswer && !feedback.isCorrect) {
                btnClass = 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800'
              } else {
                btnClass = 'border-gray-200 dark:border-gray-700 opacity-50'
              }
            } else if (selectedAnswer === option) {
              btnClass = 'border-green-600 bg-green-50'
            }

            return (
              <button
                key={idx}
                onClick={() => {
                  if (feedback) return
                  setSelectedAnswer(option)
                  submitAnswer(option)
                }}
                disabled={!!feedback}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${btnClass}`}
              >
                <span className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm font-medium">{option}</span>
                {feedback && option === feedback.correctAnswer && (
                  <svg className="w-5 h-5 text-green-600 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {feedback && option === selectedAnswer && !feedback.isCorrect && option !== feedback.correctAnswer && (
                  <svg className="w-5 h-5 text-red-600 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            )
          })}

          {currentQuestion.type === 'true_false' && ['True', 'False'].map(option => {
            let btnClass = 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900'
            if (feedback) {
              if (option === feedback.correctAnswer) {
                btnClass = 'border-green-500 bg-green-50 text-green-800'
              } else if (option === selectedAnswer && !feedback.isCorrect) {
                btnClass = 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800'
              } else {
                btnClass = 'border-gray-200 dark:border-gray-700 opacity-50'
              }
            } else if (selectedAnswer === option) {
              btnClass = 'border-green-600 bg-green-50'
            }

            return (
              <button
                key={option}
                onClick={() => {
                  if (feedback) return
                  setSelectedAnswer(option)
                  submitAnswer(option)
                }}
                disabled={!!feedback}
                className={`w-full p-3 rounded-lg border-2 text-center transition-all font-medium ${btnClass}`}
              >
                {option}
              </button>
            )
          })}

          {currentQuestion.type === 'fill_blank' && (
            <div className="space-y-3">
              <input
                type="text"
                value={fillAnswer}
                onChange={e => setFillAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && fillAnswer.trim() && !feedback) {
                    submitAnswer(fillAnswer.trim())
                  }
                }}
                disabled={!!feedback}
                placeholder="Type your answer..."
                className={`w-full p-3 rounded-lg border-2 text-sm font-medium outline-none transition-all ${
                  feedback
                    ? feedback.isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/30'
                    : 'border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 focus:border-green-600'
                }`}
              />
              {!feedback && (
                <button
                  onClick={() => {
                    if (fillAnswer.trim()) submitAnswer(fillAnswer.trim())
                  }}
                  disabled={!fillAnswer.trim() || answering}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                    fillAnswer.trim()
                      ? 'bg-green-700 hover:bg-green-800 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-lg ${
            feedback.timedOut ? 'bg-yellow-50 border border-yellow-200' :
            feedback.isCorrect ? 'bg-green-50 border border-green-200' :
            'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {feedback.timedOut ? (
                <span className="text-yellow-700 font-semibold text-sm">Time's Up!</span>
              ) : feedback.isCorrect ? (
                <span className="text-green-700 font-semibold text-sm">Correct!</span>
              ) : (
                <span className="text-red-700 dark:text-red-400 font-semibold text-sm">Incorrect</span>
              )}
            </div>
            {!feedback.isCorrect && (
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Correct answer: <span className="font-semibold">{feedback.correctAnswer}</span>
              </p>
            )}
            {feedback.explanation && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feedback.explanation}</p>
            )}
          </div>
        )}

        {/* Next Button */}
        {feedback && (
          <div className="text-right">
            <button
              onClick={nextQuestion}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors"
            >
              {currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>

      {/* Quit Button */}
      <div className="text-center">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to quit? Your progress will be lost.')) {
              navigate('/play4fun')
            }
          }}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Quit Quiz
        </button>
      </div>
    </div>
  )
}
