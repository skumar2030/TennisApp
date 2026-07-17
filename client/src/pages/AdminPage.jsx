import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const FILTER_TABS = ['all', 'pending', 'approved', 'rejected']

export default function AdminPage() {
  const { user } = useAuth0()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [expandedId, setExpandedId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`/api/user-profiles/admin/all?adminAuth0Id=${encodeURIComponent(user.sub)}`)
      setProfiles(res.data)
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfiles() }, [])

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await axios.put(`/api/user-profiles/admin/${id}/approve`, { adminAuth0Id: user.sub })
      fetchProfiles()
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.error || err.message))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(id)
    try {
      await axios.put(`/api/user-profiles/admin/${id}/reject`, {
        adminAuth0Id: user.sub,
        reason: rejectReason,
      })
      setRejectingId(null)
      setRejectReason('')
      fetchProfiles()
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.error || err.message))
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = profiles.filter(p => filter === 'all' || p.status === filter)
  const counts = {
    all: profiles.length,
    pending: profiles.filter(p => p.status === 'pending').length,
    approved: profiles.filter(p => p.status === 'approved').length,
    rejected: profiles.filter(p => p.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage player registrations</p>
        </div>
        <button
          onClick={fetchProfiles}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', count: counts.all, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
          { label: 'Pending', count: counts.pending, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
          { label: 'Approved', count: counts.approved, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
          { label: 'Rejected', count: counts.rejected, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
        ].map(c => (
          <div key={c.label} className={`rounded-lg p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.count}</p>
            <p className="text-sm opacity-75">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === tab
                ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Profiles list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-400 dark:text-gray-500">No {filter === 'all' ? '' : filter} registrations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                      {p.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{p.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.utrSingles && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded hidden sm:inline">
                      UTR {p.utrSingles}
                    </span>
                  )}
                  {p.graduationYear && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded hidden sm:inline">
                      {p.graduationYear}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_COLORS[p.status]}`}>
                    {p.status}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === p.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Personal</p>
                      <Detail label="Phone" value={p.phone} />
                      <Detail label="DOB" value={p.dateOfBirth} />
                      <Detail label="Gender" value={p.gender} />
                      <Detail label="Location" value={[p.city, p.state].filter(Boolean).join(', ')} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Tennis</p>
                      <Detail label="UTR Singles" value={p.utrSingles} />
                      <Detail label="UTR Doubles" value={p.utrDoubles} />
                      <Detail label="USTA" value={p.ustaRating} />
                      <Detail label="Hand" value={p.dominantHand} />
                      <Detail label="Style" value={p.playStyle} />
                      <Detail label="Years" value={p.yearsPlaying} />
                      <Detail label="Coach" value={p.coachName} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Academic</p>
                      <Detail label="School" value={p.highSchool} />
                      <Detail label="Grad Year" value={p.graduationYear} />
                      <Detail label="GPA" value={p.gpa} />
                      <Detail label="SAT" value={p.satScore} />
                      <Detail label="ACT" value={p.actScore} />
                      <Detail label="Major" value={p.intendedMajor} />
                      <Detail label="Recruiting" value={p.recruitingStatus?.replace('_', ' ')} />
                      <Detail label="Division" value={p.targetDivision} />
                    </div>
                  </div>

                  {p.highlightVideoUrl && (
                    <div className="mt-3">
                      <a href={p.highlightVideoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        View Highlight Video
                      </a>
                    </div>
                  )}

                  {p.rejectionReason && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 rounded p-2">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        <span className="font-semibold">Rejection reason:</span> {p.rejectionReason}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Registered: {new Date(p.createdAt).toLocaleDateString()}
                  </p>

                  {/* Action buttons */}
                  {p.role !== 'admin' && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {p.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={actionLoading === p.id}
                          className="px-4 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === p.id ? 'Processing...' : 'Approve'}
                        </button>
                      )}
                      {p.status !== 'rejected' && rejectingId !== p.id && (
                        <button
                          onClick={() => setRejectingId(p.id)}
                          className="px-4 py-1.5 text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {rejectingId === p.id && (
                        <div className="flex gap-2 flex-1">
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            onClick={() => handleReject(p.id)}
                            disabled={actionLoading === p.id}
                            className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason('') }}
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-gray-700 dark:text-gray-200 capitalize">{value}</span>
    </div>
  )
}
