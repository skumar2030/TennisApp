import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

export default function WordleLobbyPage() {
  const { user } = useAuth0()
  const navigate = useNavigate()
  const [durations, setDurations] = useState([])
  const [activeRooms, setActiveRooms] = useState([])
  const [selectedDuration, setSelectedDuration] = useState(180)
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const userName = user?.name || user?.nickname || user?.email || 'Player'

  useEffect(() => {
    fetchConfig()
    const interval = setInterval(fetchConfig, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchConfig = async () => {
    try {
      const { data } = await axios.get('/api/wordle/config')
      setDurations(data.durations)
      setActiveRooms(data.activeRooms)
    } catch {
      setError('Failed to load game config')
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const { data } = await axios.post('/api/wordle/room', {
        duration: selectedDuration,
        userId: user.sub,
        userName,
      })
      navigate(`/play4fun/wordle/${data.roomId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room')
      setCreating(false)
    }
  }

  const handleJoin = async (roomId) => {
    setJoining(true)
    setError('')
    try {
      await axios.post(`/api/wordle/room/${roomId}/join`, {
        userId: user.sub,
        userName,
      })
      navigate(`/play4fun/wordle/${roomId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room')
      setJoining(false)
    }
  }

  const handleJoinByCode = () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    handleJoin(code)
  }

  const formatTime = (ms) => {
    const s = Math.ceil(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tennis Boggle</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Find tennis words on the grid — play with friends!</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">x</button>
        </div>
      )}

      {/* Quick Links */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/play4fun')}
          className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Play4Fun
        </button>
        <button
          onClick={() => navigate('/play4fun/wordle/leaderboard')}
          className="text-sm font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Leaderboard
        </button>
      </div>

      {/* How to Play */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-green-800 mb-2">How to Play</h3>
        <ul className="text-xs text-green-700 space-y-1">
          <li>- Drag across adjacent letters to form tennis words (3+ letters)</li>
          <li>- Connect horizontally, vertically, or diagonally</li>
          <li>- Each letter cell can only be used once per word</li>
          <li>- Longer words score more points — race against the clock!</li>
          <li>- Share the room code so friends can play the same grid</li>
        </ul>
      </div>

      {/* Create New Game */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Start a New Game</h2>

        {/* Duration selection */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose round duration:</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {durations.map(d => {
            const isSelected = selectedDuration === d.id
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDuration(d.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? 'border-green-600 bg-green-50 shadow-md ring-2 ring-green-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                }`}
              >
                <span className="text-2xl font-black text-gray-700 dark:text-gray-200">{d.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.description}</p>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Room'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">Share the room code with friends to play together</p>
      </div>

      {/* Join by Code */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Join by Room Code</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
            placeholder="Enter room code..."
            maxLength={8}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm font-mono uppercase tracking-widest text-center dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleJoinByCode}
            disabled={!joinCode.trim() || joining}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {joining ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>

      {/* Active Rooms */}
      {activeRooms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Active Games</h2>
          <div className="space-y-2">
            {activeRooms.map(room => (
              <div key={room.roomId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm bg-gray-200 px-2 py-1 rounded">{room.roomId}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">by {room.createdByName}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatTime(room.timeRemaining)} left</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{room.playerCount} player{room.playerCount !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => handleJoin(room.roomId)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
