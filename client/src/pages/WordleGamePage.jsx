import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const SCORE_MAP = { 3: 1, 4: 2, 5: 3, 6: 5, 7: 8 }
function scoreWord(len) { return SCORE_MAP[len] || (len >= 8 ? 11 : 0) }

export default function WordleGamePage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth0()

  const [room, setRoom] = useState(null)
  const [solutions, setSolutions] = useState(null)
  const [allPlayersWords, setAllPlayersWords] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Selection state
  const [selectedCells, setSelectedCells] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const gridRef = useRef(null)
  const cellRefs = useRef({})

  const userId = user?.sub
  const userName = user?.name || user?.nickname || user?.email || 'Player'

  // Join room on mount
  useEffect(() => {
    if (!userId) return
    axios.post(`/api/wordle/room/${roomId}/join`, { userId, userName })
      .then(({ data }) => setRoom(data.room))
      .catch(() => setError('Failed to join room'))
  }, [roomId, userId, userName])

  // Poll for updates
  const fetchRoom = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/wordle/room/${roomId}?userId=${userId}`)
      setRoom(data.room)
      if (data.solutions) setSolutions(data.solutions)
      if (data.allPlayersWords) setAllPlayersWords(data.allPlayersWords)
    } catch {}
  }, [roomId, userId])

  useEffect(() => {
    if (!userId) return
    const interval = setInterval(fetchRoom, 2000)
    return () => clearInterval(interval)
  }, [fetchRoom, userId])

  // Timer countdown
  const [timeLeft, setTimeLeft] = useState(null)
  useEffect(() => {
    if (!room) return
    const tick = () => {
      const elapsed = Date.now() - room.startedAt
      const remaining = Math.max(0, room.duration - elapsed)
      setTimeLeft(remaining)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [room?.startedAt, room?.duration])

  const isFinished = room?.status === 'finished' || (timeLeft !== null && timeLeft <= 0)
  const myPlayer = room?.players?.find(p => p.isYou)
  const otherPlayers = room?.players?.filter(p => !p.isYou) || []
  const myFoundWords = myPlayer?.foundWords || []
  const grid = room?.grid || []
  const gridSize = room?.gridSize || 5

  // Build the current word from selected cells
  const currentWord = selectedCells.map(([r, c]) => grid[r]?.[c] || '').join('')

  // Check if two cells are adjacent
  const isAdjacent = (a, b) => {
    const dr = Math.abs(a[0] - b[0])
    const dc = Math.abs(a[1] - b[1])
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0)
  }

  // Check if a cell is already selected
  const isCellSelected = (r, c) => selectedCells.some(([sr, sc]) => sr === r && sc === c)
  const getCellIndex = (r, c) => selectedCells.findIndex(([sr, sc]) => sr === r && sc === c)

  // Get cell from touch/mouse coordinates
  const getCellFromPoint = (x, y) => {
    for (const [key, el] of Object.entries(cellRefs.current)) {
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const [r, c] = key.split('-').map(Number)
        return [r, c]
      }
    }
    return null
  }

  const handleCellDown = (r, c) => {
    if (isFinished) return
    setIsDragging(true)
    setSelectedCells([[r, c]])
    setMessage('')
  }

  const handleCellEnter = (r, c) => {
    if (!isDragging || isFinished) return
    if (isCellSelected(r, c)) {
      // Allow backtracking: if re-entering the second-to-last cell, pop the last one
      const idx = getCellIndex(r, c)
      if (idx === selectedCells.length - 2) {
        setSelectedCells(prev => prev.slice(0, -1))
      }
      return
    }
    const last = selectedCells[selectedCells.length - 1]
    if (last && isAdjacent(last, [r, c])) {
      setSelectedCells(prev => [...prev, [r, c]])
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging || isFinished) return
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const y = e.touches ? e.touches[0].clientY : e.clientY
    const cell = getCellFromPoint(x, y)
    if (cell) handleCellEnter(cell[0], cell[1])
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (currentWord.length >= 3) {
      submitWord()
    } else if (currentWord.length > 0) {
      setMessage('Words must be at least 3 letters')
      setTimeout(() => setMessage(''), 2000)
    }
    setSelectedCells([])
  }

  const submitWord = async () => {
    if (!currentWord || currentWord.length < 3) return
    try {
      const { data } = await axios.post(`/api/wordle/room/${roomId}/submit`, {
        userId,
        word: currentWord,
        path: selectedCells,
      })
      if (data.valid) {
        setMessage(`+${data.points} pts — ${data.word}`)
        setRoom(data.room)
      } else {
        setMessage(data.message || 'Not a valid word')
      }
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit'
      setMessage(msg)
      setTimeout(() => setMessage(''), 2000)
    }
  }

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (ms) => {
    if (ms === null) return '--:--'
    const s = Math.ceil(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Lines between selected cells for visual path
  const getLinePath = () => {
    if (selectedCells.length < 2) return null
    const points = selectedCells.map(([r, c]) => {
      const el = cellRefs.current[`${r}-${c}`]
      if (!el) return null
      const gridEl = gridRef.current
      if (!gridEl) return null
      const gridRect = gridEl.getBoundingClientRect()
      const cellRect = el.getBoundingClientRect()
      return {
        x: cellRect.left - gridRect.left + cellRect.width / 2,
        y: cellRect.top - gridRect.top + cellRect.height / 2,
      }
    }).filter(Boolean)
    if (points.length < 2) return null
    return points.map(p => `${p.x},${p.y}`).join(' ')
  }

  if (!room) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400">Loading game...</div>
  }

  const linePath = getLinePath()

  return (
    <div className="max-w-lg mx-auto space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/play4fun/wordle')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
          ← Lobby
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Tennis Boggle</h1>
        </div>
        <button
          onClick={handleCopyRoomCode}
          className="text-xs font-mono bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
        >
          {copied ? 'Copied!' : roomId}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-2 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">x</button>
        </div>
      )}

      {/* Timer + Score Bar */}
      <div className="flex items-center justify-between bg-gray-800 text-white rounded-xl px-4 py-3">
        <div className="text-center">
          <p className="text-xs text-gray-400">Words</p>
          <p className="text-xl font-black">{myPlayer?.wordsFound || 0}</p>
        </div>
        <div className="text-center">
          <p className={`text-3xl font-black ${timeLeft < 30000 ? 'text-red-400 animate-pulse' : timeLeft < 60000 ? 'text-yellow-400' : 'text-green-400'}`}>
            {formatTime(timeLeft)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Score</p>
          <p className="text-xl font-black text-yellow-300">{myPlayer?.score || 0}</p>
        </div>
      </div>

      {/* Other Players */}
      {otherPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {otherPlayers.map(p => (
            <div key={p.userId} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              <span>{p.userName}</span>
              <span className="font-bold">{p.wordsFound} words · {p.score} pts</span>
            </div>
          ))}
        </div>
      )}

      {/* Current word being formed */}
      <div className="h-10 flex items-center justify-center">
        {currentWord ? (
          <div className={`text-xl font-black tracking-widest px-4 py-1 rounded-lg ${
            currentWord.length >= 3 ? 'text-green-700 bg-green-50' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900'
          }`}>
            {currentWord}
          </div>
        ) : message ? (
          <p className={`text-sm font-semibold ${message.startsWith('+') ? 'text-green-600' : 'text-orange-500'}`}>
            {message}
          </p>
        ) : !isFinished ? (
          <p className="text-xs text-gray-400">Drag across letters to form tennis words</p>
        ) : null}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative mx-auto"
        style={{ width: 'fit-content', touchAction: 'none' }}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* SVG lines connecting selected cells */}
        {linePath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
            <polyline
              points={linePath}
              fill="none"
              stroke="rgba(34, 197, 94, 0.5)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const selected = isCellSelected(r, c)
              const selIdx = getCellIndex(r, c)
              const isFirst = selIdx === 0
              const isLast = selIdx === selectedCells.length - 1 && selectedCells.length > 0
              const alreadyFound = myFoundWords.some(fw => fw.word && fw.word.includes(letter))

              return (
                <div
                  key={`${r}-${c}`}
                  ref={el => cellRefs.current[`${r}-${c}`] = el}
                  onMouseDown={(e) => { e.preventDefault(); handleCellDown(r, c) }}
                  onMouseEnter={() => handleCellEnter(r, c)}
                  onTouchStart={(e) => { e.preventDefault(); handleCellDown(r, c) }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-xl font-black rounded-xl cursor-pointer transition-all relative z-20
                    ${selected
                      ? isFirst
                        ? 'bg-green-600 text-white scale-110 shadow-lg ring-2 ring-green-400'
                        : isLast
                          ? 'bg-green-500 text-white scale-105 shadow-md'
                          : 'bg-green-400 text-white scale-105'
                      : isFinished
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-700'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 active:scale-95'
                    }
                  `}
                >
                  {letter}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Scoring guide */}
      {!isFinished && (
        <div className="flex justify-center gap-3 text-xs text-gray-400">
          <span>3L = 1pt</span>
          <span>4L = 2pt</span>
          <span>5L = 3pt</span>
          <span>6L = 5pt</span>
          <span>7L+ = 8pt</span>
        </div>
      )}

      {/* Found Words List */}
      {!isFinished && myFoundWords.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Your Words ({myFoundWords.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {myFoundWords.map((fw, i) => (
              <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                {fw.word} <span className="text-green-500">+{fw.points}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Game Over */}
      {isFinished && (
        <div className="space-y-4">
          {/* Results header */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-xl p-5 text-center">
            <p className="text-sm text-green-200">Time's Up!</p>
            <p className="text-3xl font-black mt-1">{myPlayer?.score || 0} points</p>
            <p className="text-sm text-green-200 mt-1">{myPlayer?.wordsFound || 0} words found{room?.totalWords ? ` out of ${room.totalWords}` : ''}</p>
          </div>

          {/* All players comparison */}
          {allPlayersWords && allPlayersWords.length > 1 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Final Standings</p>
              <div className="space-y-2">
                {[...allPlayersWords].sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.userId} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    i === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-400">{i === 0 ? '🏆' : `#${i + 1}`}</span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{p.userName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{p.score} pts</span>
                      <span className="text-xs text-gray-400 ml-2">{p.wordsFound.length} words</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My found words */}
          {myFoundWords.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Your Words ({myFoundWords.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {myFoundWords.map((fw, i) => (
                  <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {fw.word} +{fw.points}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missed words */}
          {solutions && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Words You Missed ({solutions.filter(s => !myFoundWords.some(f => f.word === s.word)).length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {solutions
                  .filter(s => !myFoundWords.some(f => f.word === s.word))
                  .sort((a, b) => b.word.length - a.word.length)
                  .map((s, i) => (
                    <span key={i} className="bg-red-50 dark:bg-red-900/30 text-red-500 px-2 py-0.5 rounded text-xs font-medium">
                      {s.word} ({s.points}pt)
                    </span>
                  ))
                }
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/play4fun/wordle')}
              className="flex-1 bg-green-700 text-white rounded-xl py-3 text-sm font-bold hover:bg-green-800"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate('/play4fun/wordle/leaderboard')}
              className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900"
            >
              Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
