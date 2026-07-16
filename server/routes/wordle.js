const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { allWords, wordSet, embeddableWords } = require('../data/wordleWords')

// ── In-memory storage ──
const rooms = new Map()
const boggleHistory = []
const boggleStats = new Map()

// Room cleanup: remove rooms older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  for (const [roomId, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(roomId)
  }
}, 30 * 60 * 1000)

// ── Grid Generation ──

const GRID_SIZE = 5
const DIRECTIONS = [
  [0, 1], [0, -1], [1, 0], [-1, 0],   // horizontal, vertical
  [1, 1], [1, -1], [-1, 1], [-1, -1],  // diagonals
]

// Common letters weighted for better word formation
const LETTER_POOL = 'EEEEAAAAIIIIOOOONNNNSSSSRRRRTTTTLLLLCCCCDDDDHHHHMMMMPPPPGGGGBBFFKKWWYYVV'.split('')

function randomLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)]
}

function generateGrid() {
  // Strategy: embed several words into the grid, fill gaps with weighted random letters
  let bestGrid = null
  let bestCount = 0

  for (let attempt = 0; attempt < 20; attempt++) {
    const grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => '')
    )

    // Try to embed 6-10 words
    const shuffled = [...embeddableWords].sort(() => Math.random() - 0.5)
    let embedded = 0

    for (const word of shuffled) {
      if (embedded >= 10) break
      if (tryEmbed(grid, word)) embedded++
    }

    // Fill empty cells with weighted random letters
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!grid[r][c]) grid[r][c] = randomLetter()
      }
    }

    // Solve and count findable words
    const solutions = solveGrid(grid)
    if (solutions.length > bestCount) {
      bestCount = solutions.length
      bestGrid = grid
    }

    // Good enough if we have 15+ words
    if (solutions.length >= 15) break
  }

  return bestGrid
}

function tryEmbed(grid, word) {
  const letters = word.split('')
  // Pick random start and direction
  const dirs = [...DIRECTIONS, [0, 1], [1, 0]].sort(() => Math.random() - 0.5) // bias toward H/V
  const starts = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      starts.push([r, c])
    }
  }
  starts.sort(() => Math.random() - 0.5)

  for (const [sr, sc] of starts) {
    for (const [dr, dc] of dirs) {
      // Check if word fits
      let fits = true
      const cells = []
      for (let i = 0; i < letters.length; i++) {
        const nr = sr + dr * i
        const nc = sc + dc * i
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) { fits = false; break }
        const existing = grid[nr][nc]
        if (existing && existing !== letters[i]) { fits = false; break }
        cells.push([nr, nc, letters[i]])
      }
      if (fits) {
        for (const [r, c, letter] of cells) {
          grid[r][c] = letter
        }
        return true
      }
    }
  }
  return false
}

// ── Boggle Solver — find all valid words via adjacency paths ──

function solveGrid(grid) {
  const found = new Map() // word -> path

  function dfs(r, c, path, prefix, visited) {
    const letter = grid[r][c]
    const current = prefix + letter

    // Prune: no word in dictionary starts with this prefix
    // (simple check: any word starts with current?)
    let hasPrefix = false
    for (const w of allWords) {
      if (w.startsWith(current)) { hasPrefix = true; break }
    }
    if (!hasPrefix) return

    if (current.length >= 3 && wordSet.has(current) && !found.has(current)) {
      found.set(current, [...path, [r, c]])
    }

    // Continue DFS to adjacent cells
    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        const key = nr * GRID_SIZE + nc
        if (!visited.has(key)) {
          visited.add(key)
          dfs(nr, nc, [...path, [r, c]], current, visited)
          visited.delete(key)
        }
      }
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const visited = new Set()
      visited.add(r * GRID_SIZE + c)
      dfs(r, c, [], '', visited)
    }
  }

  return [...found.entries()].map(([word, path]) => ({ word, path }))
}

// Optimize solver with a prefix trie
function buildTrie() {
  const root = {}
  for (const word of allWords) {
    let node = root
    for (const ch of word) {
      if (!node[ch]) node[ch] = {}
      node = node[ch]
    }
    node._end = true
  }
  return root
}

const TRIE = buildTrie()

function solveGridFast(grid) {
  const found = new Map()

  function dfs(r, c, path, node, prefix, visited) {
    const letter = grid[r][c]
    const child = node[letter]
    if (!child) return

    const current = prefix + letter
    if (current.length >= 3 && child._end && !found.has(current)) {
      found.set(current, [...path, [r, c]])
    }

    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        const key = nr * GRID_SIZE + nc
        if (!visited.has(key)) {
          visited.add(key)
          dfs(nr, nc, [...path, [r, c]], child, current, visited)
          visited.delete(key)
        }
      }
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const visited = new Set()
      visited.add(r * GRID_SIZE + c)
      dfs(r, c, [], TRIE, '', visited)
    }
  }

  return [...found.entries()].map(([word, path]) => ({ word, path }))
}

// ── Scoring ──

function scoreWord(word) {
  const len = word.length
  if (len === 3) return 1
  if (len === 4) return 2
  if (len === 5) return 3
  if (len === 6) return 5
  if (len === 7) return 8
  return 11 // 8+ letters
}

// ── Helpers ──

function getOrCreateStats(userId) {
  if (!boggleStats.has(userId)) {
    boggleStats.set(userId, {
      userId,
      userName: '',
      totalGames: 0,
      totalWords: 0,
      totalScore: 0,
      bestScore: 0,
      bestWords: 0,
      longestWord: '',
    })
  }
  return boggleStats.get(userId)
}

function sanitizeRoom(room, requesterId) {
  const players = Object.entries(room.players).map(([uid, p]) => ({
    userId: uid,
    userName: p.userName,
    wordsFound: p.wordsFound.length,
    score: p.score,
    isYou: uid === requesterId,
    // Only show own found words
    foundWords: uid === requesterId ? p.wordsFound : undefined,
  }))

  // Time remaining
  const elapsed = room.startedAt ? Date.now() - room.startedAt : 0
  const remaining = room.startedAt ? Math.max(0, room.duration - elapsed) : room.duration

  return {
    roomId: room.roomId,
    grid: room.status === 'waiting' ? null : room.grid,
    gridSize: GRID_SIZE,
    duration: room.duration,
    timeRemaining: remaining,
    startedAt: room.startedAt,
    players,
    status: room.startedAt && remaining <= 0 ? 'finished' : room.status,
    totalWords: room.status === 'finished' || (room.startedAt && remaining <= 0) ? room.solutions.length : undefined,
    createdBy: room.createdBy,
    createdByName: room.createdByName,
    createdAt: room.createdAt,
  }
}

// ── Routes ──

// GET /api/wordle/config
router.get('/config', (req, res) => {
  const activeRooms = []
  for (const [, room] of rooms) {
    if (room.status === 'finished') continue
    const elapsed = room.startedAt ? Date.now() - room.startedAt : 0
    const remaining = room.startedAt ? room.duration - elapsed : room.duration
    if (room.status === 'waiting' || remaining > 0) {
      activeRooms.push({
        roomId: room.roomId,
        playerCount: Object.keys(room.players).length,
        duration: room.duration,
        timeRemaining: remaining,
        status: room.status,
        createdByName: room.createdByName,
        createdAt: room.createdAt,
      })
    }
  }
  res.json({
    durations: [
      { id: 120, label: '2 min', description: 'Quick round' },
      { id: 180, label: '3 min', description: 'Standard' },
      { id: 300, label: '5 min', description: 'Extended' },
    ],
    activeRooms,
  })
})

// POST /api/wordle/room — create a new room
router.post('/room', (req, res) => {
  const { duration, userId, userName } = req.body
  if (!userId || !userName) {
    return res.status(400).json({ error: 'userId and userName are required' })
  }

  const dur = parseInt(duration) || 180
  const grid = generateGrid()
  const solutions = solveGridFast(grid)
  const roomId = uuidv4().slice(0, 8).toUpperCase()

  const room = {
    roomId,
    grid,
    solutions,
    duration: dur * 1000,
    startedAt: null,
    players: {
      [userId]: {
        userName,
        wordsFound: [],
        score: 0,
        joinedAt: Date.now(),
      },
    },
    status: 'waiting',
    createdBy: userId,
    createdByName: userName,
    createdAt: Date.now(),
  }

  rooms.set(roomId, room)

  res.json({
    roomId,
    room: sanitizeRoom(room, userId),
    solutionCount: solutions.length,
  })
})

// POST /api/wordle/room/:roomId/join
router.post('/room/:roomId/join', (req, res) => {
  const { roomId } = req.params
  const { userId, userName } = req.body
  if (!userId || !userName) {
    return res.status(400).json({ error: 'userId and userName are required' })
  }

  const room = rooms.get(roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  if (room.status === 'finished') {
    return res.status(400).json({ error: 'This game has already ended' })
  }

  if (room.status === 'playing') {
    const elapsed = Date.now() - room.startedAt
    if (elapsed >= room.duration) {
      return res.status(400).json({ error: 'This game has already ended' })
    }
  }

  if (!room.players[userId]) {
    room.players[userId] = {
      userName,
      wordsFound: [],
      score: 0,
      joinedAt: Date.now(),
    }
  }

  res.json({ room: sanitizeRoom(room, userId) })
})

// POST /api/wordle/room/:roomId/start — creator starts the game
router.post('/room/:roomId/start', (req, res) => {
  const { roomId } = req.params
  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const room = rooms.get(roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  if (room.createdBy !== userId) {
    return res.status(403).json({ error: 'Only the room creator can start the game' })
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Game has already started' })
  }

  room.status = 'playing'
  room.startedAt = Date.now()

  res.json({ room: sanitizeRoom(room, userId) })
})

// POST /api/wordle/room/:roomId/end — host ends the game early
router.post('/room/:roomId/end', (req, res) => {
  const { roomId } = req.params
  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const room = rooms.get(roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  if (room.createdBy !== userId) {
    return res.status(403).json({ error: 'Only the room creator can end the game' })
  }

  if (room.status === 'finished') {
    return res.status(400).json({ error: 'Game has already ended' })
  }

  // Force finish — set startedAt so elapsed >= duration
  if (!room.startedAt) room.startedAt = Date.now()
  room.duration = 0
  room.status = 'finished'

  // Record stats
  for (const [uid, p] of Object.entries(room.players)) {
    const stats = getOrCreateStats(uid)
    stats.userName = p.userName
    stats.totalGames++
    stats.totalWords += p.wordsFound.length
    stats.totalScore += p.score
    if (p.score > stats.bestScore) stats.bestScore = p.score
    if (p.wordsFound.length > stats.bestWords) stats.bestWords = p.wordsFound.length
    const longest = p.wordsFound.reduce((a, b) => b.word.length > a.length ? b.word : a, stats.longestWord)
    if (longest.length > stats.longestWord.length) stats.longestWord = longest

    boggleHistory.push({
      userId: uid,
      userName: p.userName,
      roomId,
      wordsFound: p.wordsFound.length,
      score: p.score,
      totalPossible: room.solutions.length,
      completedAt: new Date().toISOString(),
    })
  }

  res.json({
    room: sanitizeRoom(room, userId),
    solutions: room.solutions.map(s => ({ word: s.word, path: s.path, points: scoreWord(s.word) })),
    allPlayersWords: Object.entries(room.players).map(([uid, p]) => ({
      userId: uid, userName: p.userName, wordsFound: p.wordsFound, score: p.score,
    })),
  })
})

// POST /api/wordle/room/:roomId/submit — submit a found word
router.post('/room/:roomId/submit', (req, res) => {
  const { roomId } = req.params
  const { userId, word, path } = req.body
  if (!userId || !word) {
    return res.status(400).json({ error: 'userId and word are required' })
  }

  const room = rooms.get(roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  if (room.status === 'waiting') {
    return res.status(400).json({ error: 'Game has not started yet' })
  }

  // Check time
  const elapsed = Date.now() - room.startedAt
  if (elapsed >= room.duration) {
    return res.status(400).json({ error: 'Time is up!' })
  }

  const player = room.players[userId]
  if (!player) return res.status(403).json({ error: 'You are not in this room' })

  const normalized = word.toUpperCase().trim()

  // Already found this word?
  if (player.wordsFound.some(w => w.word === normalized)) {
    return res.status(400).json({ error: 'Already found this word' })
  }

  // Is it a valid solution?
  const solution = room.solutions.find(s => s.word === normalized)
  if (!solution) {
    return res.json({ valid: false, message: 'Not a valid word in this grid' })
  }

  // Validate the path if provided (each step must be adjacent)
  if (path && path.length > 0) {
    const pathValid = validatePath(room.grid, path, normalized)
    if (!pathValid) {
      return res.json({ valid: false, message: 'Invalid path — letters must be adjacent' })
    }
  }

  const points = scoreWord(normalized)
  player.wordsFound.push({ word: normalized, points, foundAt: Date.now() })
  player.score += points

  res.json({
    valid: true,
    word: normalized,
    points,
    totalScore: player.score,
    totalWords: player.wordsFound.length,
    room: sanitizeRoom(room, userId),
  })
})

function validatePath(grid, path, word) {
  if (path.length !== word.length) return false
  const visited = new Set()
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i]
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false
    if (grid[r][c] !== word[i]) return false
    const key = r * GRID_SIZE + c
    if (visited.has(key)) return false
    visited.add(key)
    // Check adjacency with previous cell
    if (i > 0) {
      const [pr, pc] = path[i - 1]
      const dr = Math.abs(r - pr)
      const dc = Math.abs(c - pc)
      if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) return false
    }
  }
  return true
}

// GET /api/wordle/room/:roomId — poll room state
router.get('/room/:roomId', (req, res) => {
  const { roomId } = req.params
  const userId = req.query.userId
  const room = rooms.get(roomId)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  const elapsed = room.startedAt ? Date.now() - room.startedAt : 0
  const isFinished = room.startedAt ? elapsed >= room.duration : false

  // If just finished, record stats
  if (isFinished && room.status !== 'finished') {
    room.status = 'finished'
    for (const [uid, p] of Object.entries(room.players)) {
      const stats = getOrCreateStats(uid)
      stats.userName = p.userName
      stats.totalGames++
      stats.totalWords += p.wordsFound.length
      stats.totalScore += p.score
      if (p.score > stats.bestScore) stats.bestScore = p.score
      if (p.wordsFound.length > stats.bestWords) stats.bestWords = p.wordsFound.length
      const longest = p.wordsFound.reduce((a, b) => b.word.length > a.length ? b.word : a, stats.longestWord)
      if (longest.length > stats.longestWord.length) stats.longestWord = longest

      boggleHistory.push({
        userId: uid,
        userName: p.userName,
        roomId,
        wordsFound: p.wordsFound.length,
        score: p.score,
        totalPossible: room.solutions.length,
        completedAt: new Date().toISOString(),
      })
    }
  }

  const data = {
    room: sanitizeRoom(room, userId),
  }

  // Include all solutions when game is over
  if (isFinished) {
    data.solutions = room.solutions.map(s => ({
      word: s.word,
      path: s.path,
      points: scoreWord(s.word),
    }))
    // Include all players' found words for comparison
    data.allPlayersWords = Object.entries(room.players).map(([uid, p]) => ({
      userId: uid,
      userName: p.userName,
      wordsFound: p.wordsFound,
      score: p.score,
    }))
  }

  res.json(data)
})

// GET /api/wordle/leaderboard
router.get('/leaderboard', (req, res) => {
  const entries = []
  for (const [, stats] of boggleStats) {
    if (stats.totalGames === 0) continue
    entries.push({
      userId: stats.userId,
      userName: stats.userName,
      totalGames: stats.totalGames,
      totalWords: stats.totalWords,
      totalScore: stats.totalScore,
      bestScore: stats.bestScore,
      bestWords: stats.bestWords,
      longestWord: stats.longestWord,
      avgScore: Math.round(stats.totalScore / stats.totalGames),
      avgWords: Math.round(stats.totalWords / stats.totalGames),
    })
  }

  entries.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore
    return b.totalGames - a.totalGames
  })

  res.json(entries.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1 })))
})

// GET /api/wordle/history/:userId
router.get('/history/:userId', (req, res) => {
  const { userId } = req.params
  const history = boggleHistory
    .filter(h => h.userId === userId)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 50)
  res.json(history)
})

module.exports = router
