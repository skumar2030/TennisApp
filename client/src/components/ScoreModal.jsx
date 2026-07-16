import { useState } from 'react'
import axios from 'axios'

const emptySet = { team1Games: '', team2Games: '', tiebreak: '' }

function playerLabel(mp) {
  if (mp.player) return mp.player.name
  if (mp.tbdName) return mp.tbdName
  return 'TBD'
}

export default function ScoreModal({ match, onClose, onSaved }) {
  const team1 = match.matchPlayers.filter(p => p.team === 1)
  const team2 = match.matchPlayers.filter(p => p.team === 2)
  const team1Label = team1.map(playerLabel).join(' / ')
  const team2Label = team2.map(playerLabel).join(' / ')

  const [sets, setSets] = useState([{ ...emptySet }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const updateSet = (i, field, value) => {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const addSet = () => {
    if (sets.length < 3) setSets(prev => [...prev, { ...emptySet }])
  }

  const removeSet = (i) => {
    setSets(prev => prev.filter((_, idx) => idx !== i))
  }

  // Compute live set tally
  const team1Sets = sets.filter(s => s.team1Games !== '' && s.team2Games !== '' && parseInt(s.team1Games) > parseInt(s.team2Games)).length
  const team2Sets = sets.filter(s => s.team1Games !== '' && s.team2Games !== '' && parseInt(s.team2Games) > parseInt(s.team1Games)).length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    for (let i = 0; i < sets.length; i++) {
      const s = sets[i]
      if (s.team1Games === '' || s.team2Games === '') {
        setError(`Set ${i + 1}: both game scores are required.`)
        return
      }
      if (isNaN(parseInt(s.team1Games)) || isNaN(parseInt(s.team2Games))) {
        setError(`Set ${i + 1}: scores must be numbers.`)
        return
      }
    }

    setSaving(true)
    try {
      await axios.post(`/api/matches/${match.id}/score`, { sets })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save score.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Record Score</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="font-medium text-gray-700 dark:text-gray-200">{team1Label}</span>
              <span className="mx-2 text-gray-400">vs</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{team2Label}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 text-xl leading-none mt-0.5">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Column headers */}
          <div className="grid grid-cols-[60px_1fr_1fr_80px_32px] gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <span>Set</span>
            <span className="truncate">{team1Label || 'Team 1'}</span>
            <span className="truncate">{team2Label || 'Team 2'}</span>
            <span>Tiebreak</span>
            <span></span>
          </div>

          {/* Set rows */}
          {sets.map((s, i) => (
            <div key={i} className="grid grid-cols-[60px_1fr_1fr_80px_32px] gap-2 items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Set {i + 1}</span>
              <input
                type="number"
                min="0"
                max="99"
                value={s.team1Games}
                onChange={e => updateSet(i, 'team1Games', e.target.value)}
                placeholder="0"
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                min="0"
                max="99"
                value={s.team2Games}
                onChange={e => updateSet(i, 'team2Games', e.target.value)}
                placeholder="0"
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={s.tiebreak}
                onChange={e => updateSet(i, 'tiebreak', e.target.value)}
                placeholder="e.g. 7-5"
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-xs dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {sets.length > 1 ? (
                <button type="button" onClick={() => removeSet(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
              ) : (
                <span />
              )}
            </div>
          ))}

          {sets.length < 3 && (
            <button
              type="button"
              onClick={addSet}
              className="text-sm text-green-700 hover:underline font-medium"
            >
              + Add Set {sets.length + 1}
            </button>
          )}

          {/* Live tally */}
          {sets.length > 0 && (team1Sets > 0 || team2Sets > 0) && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400">Sets won:</span>
              <span className={`font-bold ${team1Sets > team2Sets ? 'text-green-700' : 'text-gray-600 dark:text-gray-300'}`}>
                {team1Label || 'Team 1'}: {team1Sets}
              </span>
              <span className="text-gray-300">|</span>
              <span className={`font-bold ${team2Sets > team1Sets ? 'text-green-700' : 'text-gray-600 dark:text-gray-300'}`}>
                {team2Label || 'Team 2'}: {team2Sets}
              </span>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded"
            >
              {saving ? 'Saving…' : 'Save Score'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
