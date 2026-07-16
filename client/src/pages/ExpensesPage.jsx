import { useEffect, useState } from 'react'
import axios from 'axios'

const CATEGORIES = [
  { value: 'match_fee', label: 'Match Fee' },
  { value: 'court_rental', label: 'Court Rental' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'strings', label: 'Strings & Maintenance' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS = {
  match_fee: 'bg-blue-100 text-blue-700',
  court_rental: 'bg-purple-100 text-purple-700',
  equipment: 'bg-yellow-100 text-yellow-700',
  strings: 'bg-orange-100 text-orange-700',
  footwear: 'bg-pink-100 text-pink-700',
  coaching: 'bg-teal-100 text-teal-700',
  apparel: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  category: 'match_fee',
  amount: '',
  paidById: '',
  matchId: '',
  notes: '',
  splits: [],
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ playerId: '', category: '', from: '', to: '' })

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.playerId) params.set('playerId', filters.playerId)
      if (filters.category) params.set('category', filters.category)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      const { data } = await axios.get(`/api/expenses?${params}`)
      setExpenses(data)
    } catch {
      setError('Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    axios.get('/api/players').then(r => setPlayers(r.data)).catch(() => {})
    axios.get('/api/matches').then(r => setMatches(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetchExpenses() }, [filters])

  const openAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (expense) => {
    setForm({
      date: new Date(expense.date).toISOString().slice(0, 10),
      category: expense.category,
      amount: String(expense.amount),
      paidById: String(expense.paidById),
      matchId: expense.matchId ? String(expense.matchId) : '',
      notes: expense.notes || '',
      splits: expense.splits.map(s => ({
        playerId: String(s.player.id),
        shareAmount: String(s.shareAmount),
      })),
    })
    setEditingId(expense.id)
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
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      paidById: parseInt(form.paidById),
      matchId: form.matchId ? parseInt(form.matchId) : null,
      splits: form.splits
        .filter(s => s.playerId && s.shareAmount)
        .map(s => ({ playerId: parseInt(s.playerId), shareAmount: parseFloat(s.shareAmount) })),
    }
    try {
      if (editingId) {
        await axios.put(`/api/expenses/${editingId}`, payload)
      } else {
        await axios.post('/api/expenses', payload)
      }
      setShowForm(false)
      setEditingId(null)
      fetchExpenses()
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Make sure the backend is running.')
      } else {
        setError(err.response?.data?.error || err.message || 'Something went wrong.')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await axios.delete(`/api/expenses/${id}`)
      fetchExpenses()
    } catch {
      setError('Failed to delete expense.')
    }
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (filters.playerId) params.set('playerId', filters.playerId)
    if (filters.category) params.set('category', filters.category)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    try {
      const { data } = await axios.get(`/api/expenses/export?${params}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tennis-expenses.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export expenses.')
    }
  }

  const addSplit = () => setForm(f => ({ ...f, splits: [...f.splits, { playerId: '', shareAmount: '' }] }))
  const removeSplit = (i) => setForm(f => ({ ...f, splits: f.splits.filter((_, idx) => idx !== i) }))
  const updateSplit = (i, field, value) =>
    setForm(f => ({ ...f, splits: f.splits.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }))

  const splitTotal = form.splits.reduce((sum, s) => sum + (parseFloat(s.shareAmount) || 0), 0)
  const totalAmount = parseFloat(form.amount) || 0

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Expenses</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 text-gray-600 dark:text-gray-300 text-sm font-medium px-4 py-2 rounded"
          >
            Export CSV
          </button>
          {!showForm && (
            <button
              onClick={openAdd}
              className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded"
            >
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select
          value={filters.playerId}
          onChange={e => setFilters(f => ({ ...f, playerId: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Players</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="To"
        />
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {editingId ? 'Edit Expense' : 'Add Expense'}
          </h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Amount (USD) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Paid By <span className="text-red-500">*</span></label>
                <select
                  value={form.paidById}
                  onChange={e => setForm({ ...form, paidById: e.target.value })}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— Select player —</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Linked Match (optional)</label>
                <select
                  value={form.matchId}
                  onChange={e => setForm({ ...form, matchId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— None —</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>
                      {new Date(m.dateTime).toLocaleDateString('en-US')} — {m.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional description"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Split section */}
            <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Split Between Players</p>
                <button
                  type="button"
                  onClick={addSplit}
                  className="text-xs font-medium text-green-700 hover:underline"
                >
                  + Add Split
                </button>
              </div>
              {form.splits.length === 0 ? (
                <p className="text-xs text-gray-400">No splits — full amount is on the payer.</p>
              ) : (
                <div className="space-y-2">
                  {form.splits.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                      <select
                        value={s.playerId}
                        onChange={e => updateSplit(i, 'playerId', e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">— Player —</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={s.shareAmount}
                        onChange={e => updateSplit(i, 'shareAmount', e.target.value)}
                        placeholder="$0.00"
                        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button type="button" onClick={() => removeSplit(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                  ))}
                  <div className={`text-xs mt-2 font-medium ${Math.abs(splitTotal - totalAmount) > 0.01 && totalAmount > 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    Split total: ${splitTotal.toFixed(2)}
                    {totalAmount > 0 && Math.abs(splitTotal - totalAmount) > 0.01 && (
                      <span className="ml-2">(does not match amount ${totalAmount.toFixed(2)})</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2 rounded">
                {editingId ? 'Save Changes' : 'Add Expense'}
              </button>
              <button type="button" onClick={handleCancel} className="text-sm font-medium px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Total bar */}
      {!loading && expenses.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-green-800 font-medium">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
          <span className="text-lg font-bold text-green-700">${grandTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No expenses yet.</p>
          <p className="text-sm mt-1">Click "Add Expense" to log one.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Paid By</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Splits</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_COLORS[e.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {CATEGORIES.find(c => c.value === e.category)?.label || e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{e.paidBy.name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">${e.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {e.splits.length > 0
                      ? e.splits.map(s => `${s.player.name}: $${s.shareAmount.toFixed(2)}`).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{e.notes || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openEdit(e)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
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
