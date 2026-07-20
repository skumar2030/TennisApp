import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ScoreModal from '../components/ScoreModal'

const emptyForm = {
  dateTime: '',
  location: '',
  matchType: 'singles',
  notes: '',
  players: { team1p1: '', team1p2: '', team2p1: '', team2p2: '' },
  playerNames: { team1p1: '', team1p2: '', team2p1: '', team2p2: '' },
}

function formatDateTime(dt) {
  const d = new Date(dt)
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function playerLabel(mp) {
  if (mp.player) return mp.player.name
  if (mp.tbdName) return mp.tbdName
  return 'TBD'
}

function scoreLabel(scores) {
  if (!scores || scores.length === 0) return null
  return scores.map(s => {
    const base = `${s.team1Games}-${s.team2Games}`
    return s.tiebreak ? `${base} (${s.tiebreak})` : base
  }).join(', ')
}

function MatchCard({ match, onEdit, onCancel, onRecordScore, onLiveTrack }) {
  const team1 = match.matchPlayers.filter(p => p.team === 1)
  const team2 = match.matchPlayers.filter(p => p.team === 2)

  const team1Label = team1.map(playerLabel).join(' / ')
  const team2Label = team2.map(playerLabel).join(' / ')
  const isCompleted = match.status === 'completed'
  const score = scoreLabel(match.scores)

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm flex flex-col gap-2 ${isCompleted ? 'border-green-200' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(match.dateTime)}</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
            {team1Label} <span className="text-gray-400 font-normal">vs</span> {team2Label}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{match.location}</p>
          {isCompleted && score && (
            <p className="text-sm font-semibold text-green-700 mt-1">{score}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            match.matchType === 'doubles' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
          }`}>
            {match.matchType}
          </span>
          {isCompleted && (
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-600 text-white">
              Scored
            </span>
          )}
        </div>
      </div>
      {match.notes && (
        <p className="text-xs text-gray-400 italic">{match.notes}</p>
      )}
      <div className="flex gap-3 pt-1">
        {match.matchType === 'singles' && !isCompleted && match.status !== 'cancelled' && (
          <button onClick={() => onLiveTrack(match.id)} className="text-xs font-medium text-purple-700 hover:underline">
            Live Track
          </button>
        )}
        {!isCompleted && match.status !== 'cancelled' && (
          <button onClick={() => onRecordScore(match)} className="text-xs font-medium text-green-700 hover:underline">
            Record Score
          </button>
        )}
        {isCompleted && (
          <button onClick={() => onRecordScore(match)} className="text-xs font-medium text-green-700 hover:underline">
            Edit Score
          </button>
        )}
        {!isCompleted && match.status !== 'cancelled' && (
          <button onClick={() => onEdit(match)} className="text-xs font-medium text-blue-600 hover:underline">
            Edit
          </button>
        )}
        {!isCompleted && match.status !== 'cancelled' && (
          <button onClick={() => onCancel(match.id)} className="text-xs font-medium text-red-500 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [scoreMatch, setScoreMatch] = useState(null)
  const navigate = useNavigate()

  const fetchMatches = async () => {
    try {
      const { data } = await axios.get('/api/matches?status=upcoming')
      setMatches(data)
    } catch {
      setError('Failed to load matches.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const { data } = await axios.get('/api/players')
      setPlayers(data)
    } catch {}
  }

  useEffect(() => {
    fetchMatches()
    fetchPlayers()
  }, [])

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (match) => {
    const mp = match.matchPlayers
    const getPlayer = (team, role) => {
      const p = mp.find(x => x.team === team && x.role === role)
      if (p?.playerId) return String(p.playerId)
      if (p?.tbdName) return '__custom__'
      return ''
    }
    const getPlayerName = (team, role) => {
      const p = mp.find(x => x.team === team && x.role === role)
      return p?.tbdName || ''
    }
    setForm({
      dateTime: new Date(match.dateTime).toISOString().slice(0, 16),
      location: match.location,
      matchType: match.matchType,
      notes: match.notes || '',
      players: {
        team1p1: getPlayer(1, 'player1'),
        team1p2: getPlayer(1, 'player2'),
        team2p1: getPlayer(2, 'player1'),
        team2p2: getPlayer(2, 'player2'),
      },
      playerNames: {
        team1p1: getPlayerName(1, 'player1'),
        team1p2: getPlayerName(1, 'player2'),
        team2p1: getPlayerName(2, 'player1'),
        team2p2: getPlayerName(2, 'player2'),
      },
    })
    setEditingId(match.id)
    setError('')
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const buildPlayerVal = (key) => {
      const val = form.players[key]
      if (!val || val === '') return null
      if (val === '__custom__') return null
      if (String(val).startsWith('profile_')) return val
      return parseInt(val)
    }
    const buildPlayerName = (key) => {
      if (form.players[key] === '__custom__') return form.playerNames[key] || null
      return null
    }
    const payload = {
      ...form,
      players: {
        team1p1: buildPlayerVal('team1p1'),
        team1p2: buildPlayerVal('team1p2'),
        team2p1: buildPlayerVal('team2p1'),
        team2p2: buildPlayerVal('team2p2'),
        team1p1Name: buildPlayerName('team1p1'),
        team1p2Name: buildPlayerName('team1p2'),
        team2p1Name: buildPlayerName('team2p1'),
        team2p2Name: buildPlayerName('team2p2'),
      },
    }
    delete payload.playerNames
    try {
      if (editingId) {
        await axios.put(`/api/matches/${editingId}`, payload)
      } else {
        await axios.post('/api/matches', payload)
      }
      setShowForm(false)
      setEditingId(null)
      fetchMatches()
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Make sure the backend is running on port 3001.')
      } else {
        setError(err.response?.data?.error || err.message || 'Something went wrong.')
      }
    }
  }

  const handleCancelMatch = async (id) => {
    if (!window.confirm('Cancel this match?')) return
    try {
      await axios.patch(`/api/matches/${id}/cancel`)
      fetchMatches()
    } catch {
      setError('Failed to cancel match.')
    }
  }

  const setPlayer = (key, value) => {
    if (value === '__custom__') {
      setForm(f => ({
        ...f,
        players: { ...f.players, [key]: '__custom__' },
        playerNames: { ...f.playerNames, [key]: '' },
      }))
    } else {
      setForm(f => ({
        ...f,
        players: { ...f.players, [key]: value },
        playerNames: { ...f.playerNames, [key]: '' },
      }))
    }
  }

  const setPlayerName = (key, name) =>
    setForm(f => ({ ...f, playerNames: { ...f.playerNames, [key]: name } }))

  const PlayerSelect = ({ label, fieldKey, required }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={form.players[fieldKey]}
        onChange={e => setPlayer(fieldKey, e.target.value)}
        required={required}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">— TBD —</option>
        {players.filter(p => p.isRegistered).length > 0 && (
          <optgroup label="Registered Players">
            {players.filter(p => p.isRegistered).map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.ustaRating})</option>
            ))}
          </optgroup>
        )}
        {players.filter(p => !p.isRegistered).length > 0 && (
          <optgroup label="Other Players">
            {players.filter(p => !p.isRegistered).map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.ustaRating})</option>
            ))}
          </optgroup>
        )}
        <option value="__custom__">+ Add Unregistered Player</option>
      </select>
      {form.players[fieldKey] === '__custom__' && (
        <input
          type="text"
          value={form.playerNames[fieldKey]}
          onChange={e => setPlayerName(fieldKey, e.target.value)}
          placeholder="Enter player name..."
          className="w-full mt-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Schedule</h1>
        {!showForm && (
          <button
            onClick={openAdd}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + Add Match
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editingId ? 'Edit Match' : 'Schedule New Match'}
          </h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Date / Location / Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={e => setForm({ ...form, dateTime: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  required
                  placeholder="e.g. Riverside Tennis Club"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Match Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.matchType}
                  onChange={e => setForm({ ...form, matchType: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                </select>
              </div>
            </div>

            {/* Players */}
            <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Players</p>
              {form.matchType === 'singles' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PlayerSelect label="Your Side" fieldKey="team1p1" required={false} />
                  <PlayerSelect label="Opponent" fieldKey="team2p1" required={false} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team 1</p>
                    <PlayerSelect label="Player 1" fieldKey="team1p1" required={false} />
                    <PlayerSelect label="Player 2" fieldKey="team1p2" required={false} />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team 2</p>
                    <PlayerSelect label="Player 1" fieldKey="team2p1" required={false} />
                    <PlayerSelect label="Player 2" fieldKey="team2p2" required={false} />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2 rounded"
              >
                {editingId ? 'Save Changes' : 'Schedule Match'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-sm font-medium px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Match List */}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No upcoming matches.</p>
          <p className="text-sm mt-1">Click "Add Match" to schedule one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onEdit={openEdit}
              onCancel={handleCancelMatch}
              onRecordScore={setScoreMatch}
              onLiveTrack={(id) => navigate(`/live/${id}`)}
            />
          ))}
        </div>
      )}

      {scoreMatch && (
        <ScoreModal
          match={scoreMatch}
          onClose={() => setScoreMatch(null)}
          onSaved={() => { setScoreMatch(null); fetchMatches() }}
        />
      )}
    </div>
  )
}
