import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const DIVISIONS = ['D1', 'D2', 'D3', 'NAIA']

const APP_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'submitted', label: 'Submitted', color: 'bg-purple-100 text-purple-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'waitlisted', label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'committed', label: 'Committed', color: 'bg-emerald-200 text-emerald-800 font-bold' },
]

const INTERVIEW_OPTIONS = [
  { value: 'not_scheduled', label: 'Not Scheduled' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'follow_up', label: 'Follow-up Needed' },
]

const VISIT_OPTIONS = [
  { value: 'not_planned', label: 'Not Planned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
]

const EMPTY_FORM = {
  collegeName: '', division: 'D1', programRanking: '', acceptanceRate: '',
  requiredGPA: '', requiredSAT: '', requiredACT: '', utrRequirement: '',
  tuitionAnnual: '', scholarshipPct: '', choiceRank: '',
  applicationStatus: 'not_started', interviewStatus: 'not_scheduled',
  coachName: '', coachEmail: '', campusVisit: 'not_planned', visitDate: '',
  highlightVideo: '', transcriptReady: false, recsRequested: '', recsReceived: '', notes: '',
}

export default function MyColleges() {
  const { user } = useAuth0()
  const userId = user?.sub
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [sortBy, setSortBy] = useState('choiceRank')
  const [filterStatus, setFilterStatus] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    if (!userId) return
    fetchColleges()
  }, [userId])

  const fetchColleges = async () => {
    try {
      const { data } = await axios.get(`/api/colleges/${encodeURIComponent(userId)}`)
      setColleges(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, choiceRank: String(colleges.length + 1) })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditingId(c.id)
    setForm({
      collegeName: c.collegeName || '',
      division: c.division || 'D1',
      programRanking: c.programRanking ?? '',
      acceptanceRate: c.acceptanceRate ?? '',
      requiredGPA: c.requiredGPA ?? '',
      requiredSAT: c.requiredSAT ?? '',
      requiredACT: c.requiredACT ?? '',
      utrRequirement: c.utrRequirement || '',
      tuitionAnnual: c.tuitionAnnual ?? '',
      scholarshipPct: c.scholarshipPct ?? '',
      choiceRank: c.choiceRank ?? '',
      applicationStatus: c.applicationStatus || 'not_started',
      interviewStatus: c.interviewStatus || 'not_scheduled',
      coachName: c.coachName || '',
      coachEmail: c.coachEmail || '',
      campusVisit: c.campusVisit || 'not_planned',
      visitDate: c.visitDate ? c.visitDate.slice(0, 10) : '',
      highlightVideo: c.highlightVideo || '',
      transcriptReady: c.transcriptReady || false,
      recsRequested: c.recsRequested ?? '',
      recsReceived: c.recsReceived ?? '',
      notes: c.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.collegeName.trim() || !form.division) return
    setSaving(true)
    try {
      if (editingId) {
        await axios.put(`/api/colleges/${editingId}`, form)
      } else {
        await axios.post('/api/colleges', { ...form, userId })
      }
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchColleges()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/colleges/${id}`)
      fetchColleges()
    } catch {
      // silent
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('userId', userId)
      const { data } = await axios.post('/api/colleges/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(data)
      fetchColleges()
    } catch (err) {
      setImportResult({ error: err.response?.data?.error || 'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Quick status update without opening modal
  const quickUpdateStatus = async (college, field, value) => {
    try {
      await axios.put(`/api/colleges/${college.id}`, { ...college, [field]: value })
      fetchColleges()
    } catch {
      // silent
    }
  }

  // Sorting & filtering
  const sorted = [...colleges]
    .filter(c => !filterStatus || c.applicationStatus === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'choiceRank') return (a.choiceRank || 999) - (b.choiceRank || 999)
      if (sortBy === 'acceptanceRate') return (b.acceptanceRate || 0) - (a.acceptanceRate || 0)
      if (sortBy === 'gpa') return (b.requiredGPA || 0) - (a.requiredGPA || 0)
      if (sortBy === 'sat') return (b.requiredSAT || 0) - (a.requiredSAT || 0)
      if (sortBy === 'name') return a.collegeName.localeCompare(b.collegeName)
      return 0
    })

  // Summary stats
  const totalColleges = colleges.length
  const submitted = colleges.filter(c => ['submitted', 'accepted', 'rejected', 'waitlisted', 'committed'].includes(c.applicationStatus)).length
  const accepted = colleges.filter(c => c.applicationStatus === 'accepted' || c.applicationStatus === 'committed').length
  const committed = colleges.find(c => c.applicationStatus === 'committed')

  const getStatusBadge = (status) => {
    const opt = APP_STATUS_OPTIONS.find(o => o.value === status) || APP_STATUS_OPTIONS[0]
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${opt.color}`}>{opt.label}</span>
  }

  if (loading) {
    return <p className="text-center text-gray-400 py-12 text-sm">Loading your college list...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">My College List</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track your college applications, requirements, and status</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImportModal(true); setImportFile(null); setImportResult(null) }}
            className="border border-green-600 text-green-700 dark:text-green-400 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Excel
          </button>
          <button
            onClick={openAdd}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add College
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Colleges" value={totalColleges} />
        <SummaryCard label="Apps Submitted" value={submitted} />
        <SummaryCard label="Acceptances" value={accepted} color="text-green-600" />
        <SummaryCard label="Committed" value={committed ? committed.collegeName : '—'} color={committed ? 'text-emerald-700 font-bold' : ''} small={!!committed} />
      </div>

      {/* Progress Bar */}
      {totalColleges > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{submitted} of {totalColleges} applications submitted</span>
            <span>{Math.round((submitted / totalColleges) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${(submitted / totalColleges) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      {totalColleges > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="choiceRank">Sort: My Ranking</option>
            <option value="name">Sort: Name</option>
            <option value="acceptanceRate">Sort: Acceptance Rate</option>
            <option value="gpa">Sort: GPA</option>
            <option value="sat">Sort: SAT</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">All Statuses</option>
            {APP_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* College List */}
      {totalColleges === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-3xl mb-2">🎓</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No colleges added yet</p>
          <p className="text-gray-400 text-xs mt-1">Start building your college list to track applications</p>
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => { setShowImportModal(true); setImportFile(null); setImportResult(null) }}
              className="border border-green-600 text-green-700 dark:text-green-400 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Excel
            </button>
            <button
              onClick={openAdd}
              className="bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-800"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              {/* Main Row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-sm font-black shrink-0">
                  {c.choiceRank || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{c.collegeName}</h3>
                    <span className="text-xs text-gray-400 shrink-0">{c.division}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {c.acceptanceRate != null && <span>{c.acceptanceRate}% accept</span>}
                    {c.requiredGPA != null && <span>GPA {c.requiredGPA}</span>}
                    {c.requiredSAT != null && <span>SAT {c.requiredSAT}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(c.applicationStatus)}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === c.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                  {/* Quick Status Updates */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Application</label>
                      <select
                        value={c.applicationStatus}
                        onChange={e => quickUpdateStatus(c, 'applicationStatus', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs dark:bg-gray-700 dark:text-gray-100"
                      >
                        {APP_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Interview</label>
                      <select
                        value={c.interviewStatus}
                        onChange={e => quickUpdateStatus(c, 'interviewStatus', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs dark:bg-gray-700 dark:text-gray-100"
                      >
                        {INTERVIEW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Campus Visit</label>
                      <select
                        value={c.campusVisit}
                        onChange={e => quickUpdateStatus(c, 'campusVisit', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs dark:bg-gray-700 dark:text-gray-100"
                      >
                        {VISIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DetailItem label="Program Rank" value={c.programRanking ? `#${c.programRanking}` : '—'} />
                    <DetailItem label="Acceptance Rate" value={c.acceptanceRate != null ? `${c.acceptanceRate}%` : '—'} />
                    <DetailItem label="Required GPA" value={c.requiredGPA ?? '—'} />
                    <DetailItem label="Required SAT" value={c.requiredSAT ?? '—'} />
                    <DetailItem label="Required ACT" value={c.requiredACT ?? '—'} />
                    <DetailItem label="UTR Target" value={c.utrRequirement || '—'} />
                    <DetailItem label="Tuition/Year" value={c.tuitionAnnual ? `$${c.tuitionAnnual.toLocaleString()}` : '—'} />
                    <DetailItem label="Scholarship" value={c.scholarshipPct != null ? `${c.scholarshipPct}%` : '—'} />
                  </div>

                  {/* Coach & References */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Coach Contact</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{c.coachName || '—'}</p>
                      {c.coachEmail && <p className="text-xs text-blue-600">{c.coachEmail}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">References</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Transcript: {c.transcriptReady ? '✓ Ready' : '✗ Not ready'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-600 dark:text-gray-300">Recs: {c.recsReceived || 0}/{c.recsRequested || 0} received</span>
                      </div>
                    </div>
                  </div>

                  {c.highlightVideo && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Highlight Video</p>
                      <a href={c.highlightVideo} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                        {c.highlightVideo}
                      </a>
                    </div>
                  )}

                  {c.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{c.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Import College List</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Supported columns:</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  College Name, Division, Choice Rank, Program Ranking, Acceptance Rate %, Required GPA, Required SAT, Required ACT, UTR Requirement, Tuition Annual $, Scholarship %, Coach Name, Coach Email, Notes
                </p>
              </div>

              <a
                href="/api/colleges/template/download"
                className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 hover:text-green-800 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Template (.xlsx)
              </a>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={e => setImportFile(e.target.files[0])}
                  className="hidden"
                  id="college-import-file"
                />
                <label htmlFor="college-import-file" className="cursor-pointer">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {importFile ? (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{importFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Click to select file</p>
                      <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, or .csv</p>
                    </>
                  )}
                </label>
              </div>

              {importResult && (
                <div className={`rounded-lg p-3 text-sm ${
                  importResult.error
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                }`}>
                  {importResult.error ? (
                    <p>{importResult.error}</p>
                  ) : (
                    <>
                      <p className="font-medium">{importResult.message}</p>
                      {importResult.errors?.length > 0 && (
                        <ul className="mt-2 text-xs space-y-0.5 text-yellow-700 dark:text-yellow-400">
                          {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {importResult?.imported ? 'Done' : 'Cancel'}
              </button>
              {!importResult?.imported && (
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="px-6 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {editingId ? 'Edit College' : 'Add College'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">College Name *</label>
                  <input
                    value={form.collegeName}
                    onChange={e => updateField('collegeName', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    placeholder="e.g., Stanford University"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Division *</label>
                  <select
                    value={form.division}
                    onChange={e => updateField('division', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                  >
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">My Choice Rank</label>
                  <input
                    type="number" min="1"
                    value={form.choiceRank}
                    onChange={e => updateField('choiceRank', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    placeholder="1 = top choice"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Program Ranking</label>
                  <input
                    type="number" min="1"
                    value={form.programRanking}
                    onChange={e => updateField('programRanking', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    placeholder="National rank"
                  />
                </div>
              </div>

              {/* Academic Requirements */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Academic Requirements</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Acceptance %</label>
                    <input
                      type="number" step="0.1" min="0" max="100"
                      value={form.acceptanceRate}
                      onChange={e => updateField('acceptanceRate', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 4.3"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Required GPA</label>
                    <input
                      type="number" step="0.01" min="0" max="5"
                      value={form.requiredGPA}
                      onChange={e => updateField('requiredGPA', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 3.8"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">SAT Score</label>
                    <input
                      type="number" min="400" max="1600"
                      value={form.requiredSAT}
                      onChange={e => updateField('requiredSAT', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 1480"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">ACT Score</label>
                    <input
                      type="number" min="1" max="36"
                      value={form.requiredACT}
                      onChange={e => updateField('requiredACT', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 33"
                    />
                  </div>
                </div>
              </div>

              {/* Tennis & Financial */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tennis & Financial</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">UTR Target</label>
                    <input
                      value={form.utrRequirement}
                      onChange={e => updateField('utrRequirement', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 12-14"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Tuition/Year ($)</label>
                    <input
                      type="number" min="0"
                      value={form.tuitionAnnual}
                      onChange={e => updateField('tuitionAnnual', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 55000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Scholarship %</label>
                    <input
                      type="number" step="1" min="0" max="100"
                      value={form.scholarshipPct}
                      onChange={e => updateField('scholarshipPct', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Application Status</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Application</label>
                    <select
                      value={form.applicationStatus}
                      onChange={e => updateField('applicationStatus', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    >
                      {APP_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Interview</label>
                    <select
                      value={form.interviewStatus}
                      onChange={e => updateField('interviewStatus', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    >
                      {INTERVIEW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Campus Visit</label>
                    <select
                      value={form.campusVisit}
                      onChange={e => updateField('campusVisit', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    >
                      {VISIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                {(form.campusVisit === 'scheduled') && (
                  <div className="mt-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Visit Date</label>
                    <input
                      type="date"
                      value={form.visitDate}
                      onChange={e => updateField('visitDate', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>

              {/* Coach & References */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Coach & References</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Coach Name</label>
                    <input
                      value={form.coachName}
                      onChange={e => updateField('coachName', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Head coach name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Coach Email</label>
                    <input
                      type="email"
                      value={form.coachEmail}
                      onChange={e => updateField('coachEmail', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="coach@university.edu"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Highlight Video URL</label>
                    <input
                      value={form.highlightVideo}
                      onChange={e => updateField('highlightVideo', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                      placeholder="YouTube or Hudl link"
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.transcriptReady}
                        onChange={e => updateField('transcriptReady', e.target.checked)}
                        className="rounded"
                      />
                      Transcript Ready
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Recs Requested</label>
                    <input
                      type="number" min="0"
                      value={form.recsRequested}
                      onChange={e => updateField('recsRequested', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Recs Received</label>
                    <input
                      type="number" min="0"
                      value={form.recsReceived}
                      onChange={e => updateField('recsReceived', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => updateField('notes', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.collegeName.trim()}
                className="px-6 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add College'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color = '', small = false }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center shadow-sm">
      <p className={`${small ? 'text-sm' : 'text-xl'} font-bold ${color || 'text-gray-800 dark:text-gray-100'}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{value}</p>
    </div>
  )
}
