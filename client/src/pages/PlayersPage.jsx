import { useEffect, useState } from 'react'
import axios from 'axios'

const emptyForm = { name: '', ustaRating: '', phone: '', notes: '' }

export default function PlayersPage() {
  const [players, setPlayers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchPlayers = async () => {
    try {
      const { data } = await axios.get('/api/players')
      setPlayers(data)
    } catch {
      setError('Failed to load players.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers() }, [])

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (player) => {
    setForm({
      name: player.name,
      ustaRating: player.ustaRating,
      phone: player.phone || '',
      notes: player.notes || '',
    })
    setEditingId(player.id)
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
    try {
      if (editingId) {
        await axios.put(`/api/players/${editingId}`, form)
      } else {
        await axios.post('/api/players', form)
      }
      setShowForm(false)
      setEditingId(null)
      fetchPlayers()
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError('Cannot reach the server. Make sure the backend is running on port 3001.')
      } else {
        setError(err.response?.data?.error || err.message || 'Something went wrong.')
      }
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete player "${name}"?`)) return
    try {
      await axios.delete(`/api/players/${id}`)
      fetchPlayers()
    } catch {
      setError('Failed to delete player.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Players</h1>
        {!showForm && (
          <button
            onClick={openAdd}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + Add Player
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editingId ? 'Edit Player' : 'Add New Player'}
          </h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                UTR Rating <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.ustaRating}
                onChange={(e) => setForm({ ...form, ustaRating: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 3.5, 4.0, 10.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 555-123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Optional notes"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2 rounded"
              >
                {editingId ? 'Save Changes' : 'Add Player'}
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

      {/* Player Table */}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      ) : players.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No players yet.</p>
          <p className="text-sm mt-1">Click "Add Player" to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">UTR Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                      {p.ustaRating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.notes || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-500 hover:underline text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
