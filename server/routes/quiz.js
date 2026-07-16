const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { categories, difficulties, badges, getQuestions } = require('../data/quizQuestions')

// In-memory storage
const quizSessions = new Map()   // sessionId -> session data
const quizHistory = []           // all completed quizzes
const userStats = new Map()      // userId -> stats object

// Helper: get or create user stats
function getUserStats(userId) {
  if (!userStats.has(userId)) {
    userStats.set(userId, {
      userId,
      userName: '',
      totalQuizzes: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      bestScore: 0,
      perfectQuizzes: 0,
      categoriesPlayed: [],
      maxStreak: 0,
      currentStreak: 0,
      lastPlayedDate: null,
      fastestAvgTime: Infinity,
      badges: [],
    })
  }
  return userStats.get(userId)
}

// Helper: calculate earned badges
function calculateBadges(stats) {
  const earned = []
  for (const badge of badges) {
    if (badge.condition(stats)) {
      earned.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
      })
    }
  }
  return earned
}

// Helper: update streak
function updateStreak(stats) {
  const today = new Date().toISOString().split('T')[0]
  if (stats.lastPlayedDate === today) return // already played today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (stats.lastPlayedDate === yesterday) {
    stats.currentStreak += 1
  } else {
    stats.currentStreak = 1
  }
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)
  stats.lastPlayedDate = today
}

// GET /api/quiz/categories - Get categories and difficulties
router.get('/categories', (req, res) => {
  res.json({ categories, difficulties })
})

// POST /api/quiz/start - Start a new quiz session
router.post('/start', (req, res) => {
  const { category, difficulty, userId, userName } = req.body

  if (!category || !difficulty || !userId) {
    return res.status(400).json({ error: 'category, difficulty, and userId are required' })
  }

  if (!categories.find(c => c.id === category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }
  if (!difficulties.find(d => d.id === difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty' })
  }

  const questions = getQuestions(category, difficulty, 20)
  const sessionId = uuidv4()

  // Store full session with answers on server
  quizSessions.set(sessionId, {
    sessionId,
    userId,
    userName: userName || 'Anonymous',
    category,
    difficulty,
    questions,
    answers: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
  })

  // Send questions to client WITHOUT answers
  const clientQuestions = questions.map(q => ({
    id: q.id,
    questionNumber: q.questionNumber,
    type: q.type,
    question: q.question,
    options: q.type === 'multiple_choice' ? q.options : undefined,
    category: q.category,
    difficulty: q.difficulty,
  }))

  res.json({ sessionId, questions: clientQuestions, totalQuestions: 20 })
})

// POST /api/quiz/answer - Submit answer for a question
router.post('/answer', (req, res) => {
  const { sessionId, questionId, userAnswer, timeTaken } = req.body

  const session = quizSessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ error: 'Quiz session not found' })
  }

  const question = session.questions.find(q => q.id === questionId)
  if (!question) {
    return res.status(404).json({ error: 'Question not found in this session' })
  }

  // Check if already answered
  if (session.answers.find(a => a.questionId === questionId)) {
    return res.status(400).json({ error: 'Question already answered' })
  }

  // Normalize answer for comparison
  const normalize = (s) => String(s).trim().toLowerCase()
  const isCorrect = normalize(userAnswer) === normalize(question.answer)

  const answerRecord = {
    questionId,
    userAnswer,
    correctAnswer: question.answer,
    isCorrect,
    timeTaken: timeTaken || 0,
    explanation: question.explanation,
  }

  session.answers.push(answerRecord)

  res.json({
    isCorrect,
    correctAnswer: question.answer,
    explanation: question.explanation,
    answeredCount: session.answers.length,
    totalQuestions: session.questions.length,
  })
})

// POST /api/quiz/complete - Complete the quiz session
router.post('/complete', (req, res) => {
  const { sessionId } = req.body

  const session = quizSessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ error: 'Quiz session not found' })
  }

  session.completedAt = new Date().toISOString()

  const score = session.answers.filter(a => a.isCorrect).length
  const totalQuestions = session.questions.length
  const avgTime = session.answers.length > 0
    ? session.answers.reduce((sum, a) => sum + a.timeTaken, 0) / session.answers.length
    : 0

  const result = {
    sessionId: session.sessionId,
    userId: session.userId,
    userName: session.userName,
    category: session.category,
    difficulty: session.difficulty,
    score,
    totalQuestions,
    percentage: Math.round((score / totalQuestions) * 100),
    avgTime: Math.round(avgTime * 10) / 10,
    answers: session.answers,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
  }

  // Save to history
  quizHistory.push(result)

  // Update user stats
  const stats = getUserStats(session.userId)
  stats.userName = session.userName
  stats.totalQuizzes += 1
  stats.totalCorrect += score
  stats.totalQuestions += totalQuestions
  stats.bestScore = Math.max(stats.bestScore, score)
  if (score === totalQuestions) stats.perfectQuizzes += 1
  if (!stats.categoriesPlayed.includes(session.category)) {
    stats.categoriesPlayed.push(session.category)
  }
  if (avgTime < stats.fastestAvgTime && avgTime > 0) {
    stats.fastestAvgTime = avgTime
  }
  updateStreak(stats)
  stats.badges = calculateBadges(stats)

  // Clean up session
  quizSessions.delete(sessionId)

  res.json(result)
})

// GET /api/quiz/leaderboard - Global leaderboard
router.get('/leaderboard', (req, res) => {
  // Group by user, get their best scores
  const userBests = new Map()

  for (const entry of quizHistory) {
    const key = entry.userId
    if (!userBests.has(key)) {
      userBests.set(key, {
        userId: entry.userId,
        userName: entry.userName,
        bestScore: entry.score,
        bestPercentage: entry.percentage,
        totalQuizzes: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        categories: new Set(),
        difficulties: new Set(),
      })
    }
    const user = userBests.get(key)
    user.totalQuizzes += 1
    user.totalCorrect += entry.score
    user.totalQuestions += entry.totalQuestions
    if (entry.score > user.bestScore) {
      user.bestScore = entry.score
      user.bestPercentage = entry.percentage
    }
    user.categories.add(entry.category)
    user.difficulties.add(entry.difficulty)
    // Keep latest name
    user.userName = entry.userName
  }

  const leaderboard = Array.from(userBests.values())
    .map(u => ({
      userId: u.userId,
      userName: u.userName,
      bestScore: u.bestScore,
      bestPercentage: u.bestPercentage,
      totalQuizzes: u.totalQuizzes,
      avgScore: u.totalQuestions > 0 ? Math.round((u.totalCorrect / u.totalQuestions) * 100) : 0,
      categoriesPlayed: u.categories.size,
      badges: getUserStats(u.userId).badges || [],
    }))
    .sort((a, b) => b.avgScore - a.avgScore || b.totalQuizzes - a.totalQuizzes)
    .slice(0, 50)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }))

  res.json({ leaderboard })
})

// GET /api/quiz/history/:userId - User quiz history
router.get('/history/:userId', (req, res) => {
  const { userId } = req.params
  const history = quizHistory
    .filter(h => h.userId === userId)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

  res.json({ history })
})

// GET /api/quiz/profile/:userId - User profile stats + badges
router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params
  const stats = getUserStats(userId)

  const categoryNames = categories.reduce((acc, c) => { acc[c.id] = c.name; return acc }, {})

  const recentHistory = quizHistory
    .filter(h => h.userId === userId)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 10)
    .map(h => ({
      category: categoryNames[h.category] || h.category,
      difficulty: h.difficulty,
      score: h.score,
      totalQuestions: h.totalQuestions,
      percentage: h.percentage,
      completedAt: h.completedAt,
    }))

  res.json({
    totalQuizzes: stats.totalQuizzes,
    totalCorrect: stats.totalCorrect,
    totalQuestions: stats.totalQuestions,
    avgScore: stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0,
    bestScore: stats.bestScore,
    perfectQuizzes: stats.perfectQuizzes,
    categoriesPlayed: stats.categoriesPlayed.map(c => categoryNames[c] || c),
    currentStreak: stats.currentStreak,
    maxStreak: stats.maxStreak,
    fastestAvgTime: stats.fastestAvgTime === Infinity ? null : stats.fastestAvgTime,
    badges: stats.badges,
    recentHistory,
  })
})

module.exports = router
