import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const OUTCOMES = [
  { value: 'ace', label: 'Ace', color: 'bg-green-600' },
  { value: 'winner', label: 'Winner', color: 'bg-blue-600' },
  { value: 'unforced_error', label: 'Unforced Error', color: 'bg-red-500' },
  { value: 'forced_error', label: 'Forced Error', color: 'bg-yellow-600' },
  { value: 'double_fault', label: 'Double Fault', color: 'bg-red-700' },
]

const ACE_DIRECTIONS = [
  { value: 'body', label: 'Body' },
  { value: 't', label: 'T' },
  { value: 'wide', label: 'Wide' },
]

const SHOT_SUBTYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'return', label: 'Return' },
  { value: 'passing', label: 'Passing' },
  { value: 'approach', label: 'Approach' },
  { value: 'slice', label: 'Slice' },
  { value: 'volley', label: 'Volley' },
  { value: 'dropshot', label: 'Dropshot' },
  { value: 'lob', label: 'Lob' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'swing_volley', label: 'Swing Volley' },
]

const FOREHAND_EXTRAS = [
  { value: 'inside_in', label: 'Inside-In' },
  { value: 'inside_out', label: 'Inside-Out' },
]

const FINAL_DIRECTIONS = [
  { value: 'cross_court', label: 'Cross Court' },
  { value: 'middle', label: 'Middle' },
  { value: 'down_the_line', label: 'Down the Line' },
]

const POINT_NAMES = ['0', '15', '30', '40']

// Flow steps: winner → outcome → (aceDir | hand → subtype → direction) → rally → save
const STEP = {
  PICK_WINNER: 'pick_winner',
  PICK_OUTCOME: 'pick_outcome',
  PICK_ACE_DIR: 'pick_ace_dir',
  PICK_HAND: 'pick_hand',
  PICK_SUBTYPE: 'pick_subtype',
  PICK_DIRECTION: 'pick_direction',
  RALLY_SAVE: 'rally_save',
}

function playerLabel(mp) {
  if (mp.player) return mp.player.name
  if (mp.tbdName) return mp.tbdName
  return 'TBD'
}

function computeMatchState(points, firstServer = 1) {
  if (points.length === 0) {
    return {
      sets: [], currentSet: { team1: 0, team2: 0 },
      currentGame: { team1: 0, team2: 0 },
      setNumber: 1, gameNumber: 1, pointNumber: 1,
      serverId: firstServer, matchOver: false, winner: null, isTiebreak: false,
    }
  }

  let sets = []
  let currentSetGames = { team1: 0, team2: 0 }
  let currentGamePoints = { team1: 0, team2: 0 }
  let setNum = 1, gameNum = 1, pointNum = 1
  let serverId = points[0]?.serverId || firstServer
  let matchOver = false, matchWinner = null
  let isTiebreak = false, tiebreakPointCount = 0

  for (const point of points) {
    if (matchOver) break
    const winner = point.winner

    if (isTiebreak) {
      currentGamePoints[winner === 1 ? 'team1' : 'team2']++
      tiebreakPointCount++
      pointNum++
      const p1 = currentGamePoints.team1, p2 = currentGamePoints.team2

      if ((p1 >= 7 || p2 >= 7) && Math.abs(p1 - p2) >= 2) {
        const tieWinner = p1 > p2 ? 'team1' : 'team2'
        currentSetGames[tieWinner]++
        sets.push({ team1: currentSetGames.team1, team2: currentSetGames.team2, tiebreak: true, tiebreakScore: `${p1}-${p2}` })
        const s1 = sets.filter(s => s.team1 > s.team2).length
        const s2 = sets.filter(s => s.team2 > s.team1).length
        if (s1 >= 2) { matchOver = true; matchWinner = 'team1' }
        else if (s2 >= 2) { matchOver = true; matchWinner = 'team2' }
        if (!matchOver) {
          setNum++; gameNum = 1; pointNum = 1
          currentSetGames = { team1: 0, team2: 0 }
          currentGamePoints = { team1: 0, team2: 0 }
          isTiebreak = false; tiebreakPointCount = 0
          serverId = serverId === 1 ? 2 : 1
        }
        continue
      }
      if (tiebreakPointCount === 1 || (tiebreakPointCount > 1 && (tiebreakPointCount - 1) % 2 === 0)) {
        serverId = serverId === 1 ? 2 : 1
      }
    } else {
      currentGamePoints[winner === 1 ? 'team1' : 'team2']++
      pointNum++
      const p1 = currentGamePoints.team1, p2 = currentGamePoints.team2
      let gameWon = false, gameWinner = null

      if (p1 >= 4 || p2 >= 4) {
        if (p1 >= 4 && p1 - p2 >= 2) { gameWon = true; gameWinner = 'team1' }
        else if (p2 >= 4 && p2 - p1 >= 2) { gameWon = true; gameWinner = 'team2' }
      }

      if (gameWon) {
        currentSetGames[gameWinner]++
        currentGamePoints = { team1: 0, team2: 0 }
        gameNum++; pointNum = 1
        serverId = serverId === 1 ? 2 : 1
        const g1 = currentSetGames.team1, g2 = currentSetGames.team2
        if (g1 === 6 && g2 === 6) { isTiebreak = true; tiebreakPointCount = 0 }
        else if ((g1 >= 6 || g2 >= 6) && Math.abs(g1 - g2) >= 2) {
          sets.push({ team1: g1, team2: g2, tiebreak: false })
          const s1 = sets.filter(s => s.team1 > s.team2).length
          const s2 = sets.filter(s => s.team2 > s.team1).length
          if (s1 >= 2) { matchOver = true; matchWinner = 'team1' }
          else if (s2 >= 2) { matchOver = true; matchWinner = 'team2' }
          if (!matchOver) {
            setNum++; gameNum = 1; pointNum = 1
            currentSetGames = { team1: 0, team2: 0 }; isTiebreak = false
          }
        }
      }
    }
  }

  return {
    sets, currentSet: currentSetGames, currentGame: currentGamePoints,
    setNumber: setNum, gameNumber: gameNum, pointNumber: pointNum,
    serverId, matchOver, winner: matchWinner, isTiebreak,
  }
}

function getGameScore(currentGame, isTiebreak) {
  if (isTiebreak) return { team1: String(currentGame.team1), team2: String(currentGame.team2) }
  const p1 = currentGame.team1, p2 = currentGame.team2
  if (p1 < 4 && p2 < 4) return { team1: POINT_NAMES[p1], team2: POINT_NAMES[p2] }
  if (p1 === p2) return { team1: '40', team2: '40' }
  if (p1 > p2) return { team1: 'AD', team2: '—' }
  return { team1: '—', team2: 'AD' }
}

function StepLabel({ text, onCancel }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{text}</p>
      <button onClick={onCancel} className="text-xs text-gray-400 hover:text-red-500 font-medium">Cancel</button>
    </div>
  )
}

function TapButton({ label, color, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl py-3 px-3 text-center hover:opacity-90 transition-all active:scale-95 shadow-sm text-sm font-semibold ${className}`}
    >
      {label}
    </button>
  )
}

export default function LiveScorePage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // First server selection
  const [firstServer, setFirstServer] = useState(null)

  // Multi-step point entry
  const [step, setStep] = useState(STEP.PICK_WINNER)
  const [ptWinner, setPtWinner] = useState(null)
  const [ptOutcome, setPtOutcome] = useState(null)
  const [ptAceDir, setPtAceDir] = useState(null)
  const [ptHand, setPtHand] = useState(null)       // forehand | backhand
  const [ptSubtype, setPtSubtype] = useState(null)
  const [ptDirection, setPtDirection] = useState(null)
  const [ptRally, setPtRally] = useState(0)
  const [serveType, setServeType] = useState('first')

  // Comments
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentScope, setCommentScope] = useState('match')

  // Stats
  const [stats, setStats] = useState(null)
  const [bottomTab, setBottomTab] = useState('log')

  const fetchData = useCallback(async () => {
    try {
      const [matchRes, pointsRes, commentsRes] = await Promise.all([
        axios.get(`/api/matches/${matchId}`),
        axios.get(`/api/matches/${matchId}/points`),
        axios.get(`/api/matches/${matchId}/comments`),
      ])
      setMatch(matchRes.data)
      setPoints(pointsRes.data)
      setComments(commentsRes.data)
      // Auto-detect first server from existing points
      if (pointsRes.data.length > 0) {
        setFirstServer(pointsRes.data[0].serverId)
      }
    } catch {
      setError('Failed to load match data.')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`/api/matches/${matchId}/stats`)
      setStats(data.stats)
    } catch {}
  }

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (bottomTab === 'stats') fetchStats() }, [bottomTab])

  const matchState = computeMatchState(points, firstServer || 1)

  const team1Players = match?.matchPlayers?.filter(p => p.team === 1) || []
  const team2Players = match?.matchPlayers?.filter(p => p.team === 2) || []
  const team1Name = team1Players.map(playerLabel).join(' / ') || 'Team 1'
  const team2Name = team2Players.map(playerLabel).join(' / ') || 'Team 2'

  const resetFlow = () => {
    setStep(STEP.PICK_WINNER)
    setPtWinner(null)
    setPtOutcome(null)
    setPtAceDir(null)
    setPtHand(null)
    setPtSubtype(null)
    setPtDirection(null)
    setPtRally(0)
  }

  // Build shotType string from hand + subtype
  const buildShotType = (hand, subtype) => {
    if (!hand) return subtype || null
    if (!subtype || subtype === 'regular') return hand
    return `${hand}_${subtype}`
  }

  // Build direction string
  const buildDirection = (outcome, aceDir, dir) => {
    if (outcome === 'ace') return aceDir || null
    return dir || null
  }

  const submitPoint = async (overrides = {}) => {
    if (matchState.matchOver) return

    const outcome = overrides.outcome || ptOutcome
    const winner = overrides.winner || ptWinner
    const direction = buildDirection(outcome, overrides.aceDir || ptAceDir, overrides.direction || ptDirection)
    const shotType = outcome === 'ace' ? 'serve' : (outcome === 'double_fault' ? 'serve' : buildShotType(overrides.hand || ptHand, overrides.subtype || ptSubtype))
    const rally = overrides.rally != null ? overrides.rally : ptRally

    try {
      const payload = {
        setNumber: matchState.setNumber,
        gameNumber: matchState.gameNumber,
        pointNumber: matchState.pointNumber,
        serverId: matchState.serverId,
        winner,
        outcome,
        shotType,
        direction,
        serveType,
        serveIn: outcome === 'double_fault' ? false : (outcome === 'ace' ? true : null),
        rallyCount: rally > 0 ? rally : null,
        comment: null,
      }
      const { data } = await axios.post(`/api/matches/${matchId}/points`, payload)
      setPoints(prev => [...prev, data])
      resetFlow()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record point')
    }
  }

  // Step handlers
  const handlePickWinner = (team) => {
    setPtWinner(team)
    setStep(STEP.PICK_OUTCOME)
  }

  const handlePickOutcome = (outcome) => {
    setPtOutcome(outcome)
    if (outcome === 'double_fault') {
      // Auto: server loses, save immediately
      const loser = matchState.serverId
      submitPoint({ outcome, winner: loser === 1 ? 2 : 1 })
    } else if (outcome === 'ace') {
      // Auto: server wins, ask for ace direction
      setPtWinner(matchState.serverId)
      setStep(STEP.PICK_ACE_DIR)
    } else {
      // winner / unforced_error / forced_error → ask forehand or backhand
      setStep(STEP.PICK_HAND)
    }
  }

  const handlePickAceDir = (dir) => {
    setPtAceDir(dir)
    setStep(STEP.RALLY_SAVE)
  }

  const handlePickHand = (hand) => {
    setPtHand(hand)
    setStep(STEP.PICK_SUBTYPE)
  }

  const handlePickSubtype = (sub) => {
    setPtSubtype(sub)
    setStep(STEP.PICK_DIRECTION)
  }

  const handlePickDirection = (dir) => {
    setPtDirection(dir)
    setStep(STEP.RALLY_SAVE)
  }

  const handleSavePoint = () => {
    submitPoint()
  }

  const handleUndo = async () => {
    if (points.length === 0) return
    const lastPoint = points[points.length - 1]
    try {
      await axios.delete(`/api/matches/${matchId}/points/${lastPoint.id}`)
      setPoints(prev => prev.slice(0, -1))
      resetFlow()
    } catch {
      setError('Failed to undo point')
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      const { data } = await axios.post(`/api/matches/${matchId}/comments`, {
        scope: commentScope,
        setNumber: commentScope !== 'match' ? matchState.setNumber : null,
        gameNumber: commentScope === 'game' ? matchState.gameNumber : null,
        comment: commentText,
      })
      setComments(prev => [...prev, data])
      setCommentText('')
    } catch {
      setError('Failed to add comment')
    }
  }

  const handleFinishMatch = async () => {
    if (!matchState.matchOver) {
      if (!window.confirm('Match is not complete. Save scores recorded so far?')) return
    }
    const allSets = [...matchState.sets]
    if (!matchState.matchOver && (matchState.currentSet.team1 > 0 || matchState.currentSet.team2 > 0)) {
      allSets.push({ team1: matchState.currentSet.team1, team2: matchState.currentSet.team2 })
    }
    const sets = allSets.map((s, i) => ({
      setNumber: i + 1, team1Games: s.team1, team2Games: s.team2,
      tiebreak: s.tiebreakScore || null,
    }))
    try {
      await axios.post(`/api/matches/${matchId}/score`, { sets })
      navigate('/schedule')
    } catch {
      setError('Failed to save final score')
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-500 dark:text-gray-400">Loading match...</div>
  if (!match) return <div className="text-center py-16 text-red-500">Match not found</div>

  const gameScore = getGameScore(matchState.currentGame, matchState.isTiebreak)

  // Breadcrumb showing current selections
  const breadcrumb = [
    ptWinner && (ptWinner === 1 ? team1Name : team2Name),
    ptOutcome && OUTCOMES.find(o => o.value === ptOutcome)?.label,
    ptAceDir && ACE_DIRECTIONS.find(d => d.value === ptAceDir)?.label,
    ptHand && (ptHand === 'forehand' ? 'Forehand' : 'Backhand'),
    ptSubtype && (SHOT_SUBTYPES.find(s => s.value === ptSubtype)?.label || FOREHAND_EXTRAS.find(s => s.value === ptSubtype)?.label),
    ptDirection && FINAL_DIRECTIONS.find(d => d.value === ptDirection)?.label,
  ].filter(Boolean)

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Scoreboard */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 mb-4 text-white shadow-lg">
        <div className="text-center mb-3">
          <p className="text-xs text-gray-400">{match.location}</p>
          {matchState.matchOver && (
            <p className="text-sm font-bold text-green-400 mt-1">
              Match Over — {matchState.winner === 'team1' ? team1Name : team2Name} wins!
            </p>
          )}
        </div>

        <div className="bg-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-center">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="text-left px-3 py-2 w-1/3">Player</th>
                {matchState.sets.map((_, i) => (
                  <th key={i} className="px-2 py-2 w-10">S{i + 1}</th>
                ))}
                {!matchState.matchOver && <th className="px-2 py-2 w-10">S{matchState.setNumber}</th>}
                <th className="px-3 py-2 w-14 bg-gray-600/50">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-t border-gray-600 ${matchState.serverId === 1 ? 'bg-green-900/20' : ''}`}>
                <td className="text-left px-3 py-3 text-sm font-semibold flex items-center gap-2">
                  {matchState.serverId === 1 && <span className="text-green-400 text-xs">●</span>}
                  <span className="truncate">{team1Name}</span>
                </td>
                {matchState.sets.map((s, i) => (
                  <td key={i} className={`px-2 py-3 text-sm font-bold ${s.team1 > s.team2 ? 'text-green-400' : 'text-gray-400'}`}>{s.team1}</td>
                ))}
                {!matchState.matchOver && (
                  <td className="px-2 py-3 text-sm font-bold text-white">{matchState.currentSet.team1}</td>
                )}
                <td className="px-3 py-3 text-lg font-black text-yellow-300 bg-gray-600/50">{gameScore.team1}</td>
              </tr>
              <tr className={`border-t border-gray-600 ${matchState.serverId === 2 ? 'bg-green-900/20' : ''}`}>
                <td className="text-left px-3 py-3 text-sm font-semibold flex items-center gap-2">
                  {matchState.serverId === 2 && <span className="text-green-400 text-xs">●</span>}
                  <span className="truncate">{team2Name}</span>
                </td>
                {matchState.sets.map((s, i) => (
                  <td key={i} className={`px-2 py-3 text-sm font-bold ${s.team2 > s.team1 ? 'text-green-400' : 'text-gray-400'}`}>{s.team2}</td>
                ))}
                {!matchState.matchOver && (
                  <td className="px-2 py-3 text-sm font-bold text-white">{matchState.currentSet.team2}</td>
                )}
                <td className="px-3 py-3 text-lg font-black text-yellow-300 bg-gray-600/50">{gameScore.team2}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {!matchState.matchOver && (
          <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
            <span>Set {matchState.setNumber} · Game {matchState.gameNumber} {matchState.isTiebreak ? '(Tiebreak)' : ''}</span>
            <span>{matchState.serverId === 1 ? team1Name : team2Name} serving</span>
          </div>
        )}
      </div>

      {/* First Server Selection */}
      {!matchState.matchOver && points.length === 0 && !firstServer && (
        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 rounded-2xl p-6 mb-4 shadow-sm">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 text-center mb-4">Who serves first?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFirstServer(1)}
              className="bg-blue-600 text-white rounded-xl py-5 px-4 text-center hover:bg-blue-700 transition-all active:scale-95 shadow-md"
            >
              <span className="font-bold text-base block">{team1Name}</span>
            </button>
            <button
              onClick={() => setFirstServer(2)}
              className="bg-red-500 text-white rounded-xl py-5 px-4 text-center hover:bg-red-600 transition-all active:scale-95 shadow-md"
            >
              <span className="font-bold text-base block">{team2Name}</span>
            </button>
          </div>
        </div>
      )}

      {/* Serve Toggle Slider */}
      {!matchState.matchOver && (firstServer || points.length > 0) && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className={`text-xs font-semibold ${serveType === 'first' ? 'text-green-700' : 'text-gray-400'}`}>1st Serve</span>
          <button
            onClick={() => setServeType(serveType === 'first' ? 'second' : 'first')}
            className={`relative w-12 h-6 rounded-full transition-colors ${serveType === 'first' ? 'bg-green-500' : 'bg-orange-500'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow transition-transform ${serveType === 'first' ? 'left-0.5' : 'left-6'}`} />
          </button>
          <span className={`text-xs font-semibold ${serveType === 'second' ? 'text-orange-600' : 'text-gray-400'}`}>2nd Serve</span>
        </div>
      )}

      {/* Point Entry Flow */}
      {!matchState.matchOver && (firstServer || points.length > 0) && (
        <div className="mb-4">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300 text-xs">›</span>}
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">{b}</span>
                </span>
              ))}
            </div>
          )}

          {/* Step 1: Pick who won the point */}
          {step === STEP.PICK_WINNER && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Who won the point?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePickWinner(1)}
                  className="bg-blue-600 text-white rounded-xl py-5 px-4 text-center hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                >
                  <span className="font-bold text-base block">{team1Name}</span>
                  {matchState.serverId === 1 && <span className="text-blue-200 text-xs mt-1 block">Serving</span>}
                </button>
                <button
                  onClick={() => handlePickWinner(2)}
                  className="bg-red-500 text-white rounded-xl py-5 px-4 text-center hover:bg-red-600 transition-all active:scale-95 shadow-md"
                >
                  <span className="font-bold text-base block">{team2Name}</span>
                  {matchState.serverId === 2 && <span className="text-red-200 text-xs mt-1 block">Serving</span>}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: How did they win? */}
          {step === STEP.PICK_OUTCOME && (
            <div>
              <StepLabel text={`How did ${ptWinner === 1 ? team1Name : team2Name} win?`} onCancel={resetFlow} />
              <div className="grid grid-cols-3 gap-2">
                {OUTCOMES.map(o => (
                  <TapButton key={o.value} label={o.label} color={o.color} onClick={() => handlePickOutcome(o.value)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3a: Ace direction */}
          {step === STEP.PICK_ACE_DIR && (
            <div>
              <StepLabel text="Ace — where?" onCancel={resetFlow} />
              <div className="grid grid-cols-3 gap-2">
                {ACE_DIRECTIONS.map(d => (
                  <TapButton key={d.value} label={d.label} color="bg-green-600" onClick={() => handlePickAceDir(d.value)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3b: Forehand or Backhand */}
          {step === STEP.PICK_HAND && (
            <div>
              <StepLabel text="Forehand or Backhand?" onCancel={resetFlow} />
              <div className="grid grid-cols-2 gap-3">
                <TapButton label="Forehand" color="bg-purple-600" onClick={() => handlePickHand('forehand')} className="py-5" />
                <TapButton label="Backhand" color="bg-indigo-600" onClick={() => handlePickHand('backhand')} className="py-5" />
              </div>
            </div>
          )}

          {/* Step 4: Shot subtype */}
          {step === STEP.PICK_SUBTYPE && (
            <div>
              <StepLabel text={`${ptHand === 'forehand' ? 'Forehand' : 'Backhand'} — what type?`} onCancel={resetFlow} />
              <div className="grid grid-cols-4 gap-2">
                {SHOT_SUBTYPES.map(s => (
                  <TapButton key={s.value} label={s.label} color="bg-gray-600" onClick={() => handlePickSubtype(s.value)} className="py-2.5 text-xs" />
                ))}
                {ptHand === 'forehand' && FOREHAND_EXTRAS.map(s => (
                  <TapButton key={s.value} label={s.label} color="bg-teal-600" onClick={() => handlePickSubtype(s.value)} className="py-2.5 text-xs" />
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Direction */}
          {step === STEP.PICK_DIRECTION && (
            <div>
              <StepLabel text="Direction?" onCancel={resetFlow} />
              <div className="grid grid-cols-3 gap-2">
                {FINAL_DIRECTIONS.map(d => (
                  <TapButton key={d.value} label={d.label} color="bg-sky-600" onClick={() => handlePickDirection(d.value)} className="py-4" />
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Rally count + Save */}
          {step === STEP.RALLY_SAVE && (
            <div>
              <StepLabel text="Rally length & save" onCancel={resetFlow} />
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                {/* Rally slider */}
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">Rally:</p>
                  <button
                    onClick={() => setPtRally(Math.max(0, ptRally - 1))}
                    className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 dark:text-gray-200 font-bold text-lg hover:bg-gray-300 active:scale-95 flex items-center justify-center"
                  >
                    −
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={ptRally}
                      onChange={e => setPtRally(parseInt(e.target.value))}
                      className="w-full accent-green-600"
                    />
                  </div>
                  <button
                    onClick={() => setPtRally(ptRally + 1)}
                    className="w-9 h-9 rounded-full bg-green-600 text-white font-bold text-lg hover:bg-green-700 active:scale-95 flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-lg font-black text-green-700 w-8 text-center">{ptRally}</span>
                </div>

                <button
                  onClick={handleSavePoint}
                  className="w-full bg-green-700 text-white rounded-xl py-3 text-sm font-bold hover:bg-green-800 active:scale-[0.98] shadow-md"
                >
                  Save Point
                </button>
              </div>
            </div>
          )}

          {/* Undo + Finish row */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleUndo}
              disabled={points.length === 0}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ↶ Undo Last Point
            </button>
            <button
              onClick={handleFinishMatch}
              className="text-xs font-medium bg-gray-800 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700"
            >
              Finish Match
            </button>
          </div>
        </div>
      )}

      {matchState.matchOver && (
        <div className="flex gap-3 mb-4">
          <button onClick={handleFinishMatch} className="flex-1 bg-green-700 text-white rounded-xl py-3 text-sm font-bold hover:bg-green-800">
            Save Final Score
          </button>
          <button onClick={() => navigate('/schedule')} className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
            Back to Schedule
          </button>
        </div>
      )}

      {/* Bottom tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-4">
        {[
          { id: 'log', label: `Point Log (${points.length})` },
          { id: 'comments', label: `Comments (${comments.length})` },
          { id: 'stats', label: 'Stats' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setBottomTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              bottomTab === tab.id ? 'bg-white dark:bg-gray-800 text-green-700 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Point Log */}
      {bottomTab === 'log' && (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {points.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No points recorded yet. Tap a player above to start!</p>
          ) : (
            [...points].reverse().map((p, i) => {
              const outcomeInfo = OUTCOMES.find(o => o.value === p.outcome)
              return (
                <div key={p.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-xs">
                  <span className="text-gray-400 w-6 text-right shrink-0">{points.length - i}</span>
                  <span className={`px-1.5 py-0.5 rounded text-white text-xs font-bold shrink-0 ${outcomeInfo?.color || 'bg-gray-500'}`}>
                    {outcomeInfo?.label?.[0] || '?'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{p.winner === 1 ? team1Name : team2Name}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-500 dark:text-gray-400">{outcomeInfo?.label}</span>
                    {p.shotType && <span className="text-gray-400 ml-1">({p.shotType.replace(/_/g, ' ')})</span>}
                    {p.direction && <span className="text-gray-400 ml-1">{p.direction.replace(/_/g, ' ')}</span>}
                    {p.rallyCount > 0 && <span className="text-gray-400 ml-1">· {p.rallyCount} rally</span>}
                  </div>
                  <span className="text-gray-300 shrink-0">S{p.setNumber}G{p.gameNumber}</span>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Comments */}
      {bottomTab === 'comments' && (
        <div>
          <div className="flex gap-2 mb-3">
            <select value={commentScope} onChange={e => setCommentScope(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs dark:bg-gray-700 dark:text-gray-100">
              <option value="match">Match</option>
              <option value="set">Set {matchState.setNumber}</option>
              <option value="game">Game {matchState.gameNumber}</option>
            </select>
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..." className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100" />
            <button onClick={handleAddComment} disabled={!commentText.trim()}
              className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-800 disabled:opacity-30">
              Add
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No comments yet.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                      c.scope === 'match' ? 'bg-purple-100 text-purple-700' :
                      c.scope === 'set' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {c.scope === 'match' ? 'Match' : c.scope === 'set' ? `Set ${c.setNumber}` : `S${c.setNumber} G${c.gameNumber}`}
                    </span>
                    <span className="text-gray-300">
                      {new Date(c.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">{c.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {bottomTab === 'stats' && (
        <div>
          {!stats ? (
            <div className="text-center py-8">
              <button onClick={fetchStats} className="text-sm text-green-700 font-semibold hover:underline">Load Stats</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">Stat</th>
                      <th className="px-3 py-2 font-semibold text-blue-600 text-center">{team1Name}</th>
                      <th className="px-3 py-2 font-semibold text-red-500 text-center">{team2Name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Total Points Won', stats.team1.totalPointsWon, stats.team2.totalPointsWon],
                      ['Aces', stats.team1.aces, stats.team2.aces],
                      ['Double Faults', stats.team1.doubleFaults, stats.team2.doubleFaults],
                      ['Winners', stats.team1.winners, stats.team2.winners],
                      ['Unforced Errors', stats.team1.unforcedErrors, stats.team2.unforcedErrors],
                      ['1st Serve %', `${stats.team1.firstServePct}% (${stats.team1.firstServeIn}/${stats.team1.firstServeTotal})`, `${stats.team2.firstServePct}% (${stats.team2.firstServeIn}/${stats.team2.firstServeTotal})`],
                      ['2nd Serve %', `${stats.team1.secondServePct}% (${stats.team1.secondServeIn}/${stats.team1.secondServeTotal})`, `${stats.team2.secondServePct}% (${stats.team2.secondServeIn}/${stats.team2.secondServeTotal})`],
                      ['Service Points Won', `${stats.team1.servicePointsWon}/${stats.team1.servicePointsTotal}`, `${stats.team2.servicePointsWon}/${stats.team2.servicePointsTotal}`],
                      ['Return Points Won', `${stats.team1.returnPointsWon}/${stats.team1.returnPointsTotal}`, `${stats.team2.returnPointsWon}/${stats.team2.returnPointsTotal}`],
                      ['Net Points Won', stats.team1.netPointsWon, stats.team2.netPointsWon],
                      ['Break Points Converted', stats.team1.breakPointsConverted, stats.team2.breakPointsConverted],
                      ['Avg Rally Length', stats.team1.avgRallyLength || '—', stats.team2.avgRallyLength || '—'],
                      ['Max Rally', stats.team1.maxRally || '—', stats.team2.maxRally || '—'],
                    ].map(([label, v1, v2], i) => (
                      <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">{label}</td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-800 dark:text-gray-100">{v1}</td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-800 dark:text-gray-100">{v2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['team1', 'team2'].map(teamKey => (
                  <div key={teamKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <h4 className={`text-xs font-bold mb-2 ${teamKey === 'team1' ? 'text-blue-600' : 'text-red-500'}`}>
                      {teamKey === 'team1' ? team1Name : team2Name} — Winners by Shot
                    </h4>
                    {Object.keys(stats[teamKey].winnersByShot || {}).length === 0 ? (
                      <p className="text-xs text-gray-400">No data</p>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(stats[teamKey].winnersByShot).map(([shot, count]) => (
                          <div key={shot} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{shot.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['team1', 'team2'].map(teamKey => (
                  <div key={teamKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <h4 className={`text-xs font-bold mb-2 ${teamKey === 'team1' ? 'text-blue-600' : 'text-red-500'}`}>
                      {teamKey === 'team1' ? team1Name : team2Name} — Winners by Direction
                    </h4>
                    {Object.keys(stats[teamKey].winnersByDirection || {}).length === 0 ? (
                      <p className="text-xs text-gray-400">No data</p>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(stats[teamKey].winnersByDirection).map(([dir, count]) => (
                          <div key={dir} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{dir.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={fetchStats} className="w-full text-xs text-green-700 font-semibold hover:underline py-2">
                Refresh Stats
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
