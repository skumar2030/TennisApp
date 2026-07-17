import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const STEPS = ['Personal Info', 'Tennis Profile', 'Academic Info', 'Review & Submit']

const USTA_RATINGS = ['1.0','1.5','2.0','2.5','3.0','3.5','4.0','4.5','5.0','5.5','6.0','6.5','7.0']
const PLAY_STYLES = ['Baseline', 'Serve & Volley', 'All-Court', 'Counter-Puncher']
const DIVISIONS = ['D1', 'D2', 'D3', 'NAIA', 'JUCO']
const RECRUITING = ['uncommitted', 'committed', 'not_recruiting']
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => 2025 + i)

const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
const selectClass = inputClass

export default function RegisterPage({ onRegistered }) {
  const { user } = useAuth0()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    city: '',
    state: '',
    utrSingles: '',
    utrDoubles: '',
    ustaRating: '',
    dominantHand: '',
    playStyle: '',
    yearsPlaying: '',
    coachName: '',
    highSchool: '',
    graduationYear: '',
    gpa: '',
    satScore: '',
    actScore: '',
    intendedMajor: '',
    recruitingStatus: '',
    targetDivision: '',
    highlightVideoUrl: '',
  })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const canNext = () => {
    if (step === 0) return form.fullName.trim() && form.email.trim()
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await axios.post('/api/user-profiles/register', {
        auth0Id: user.sub,
        ...form,
      })
      if (onRegistered) onRegistered()
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < step ? 'bg-green-600 text-white' :
              i === step ? 'bg-green-700 text-white ring-4 ring-green-200 dark:ring-green-900' :
              'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {i < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i === step ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-1 ${i < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep0 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input className={inputClass} value={form.fullName} onChange={set('fullName')} placeholder="John Doe" />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input className={inputClass} value={form.email} onChange={set('email')} type="email" disabled
            title="Email is from your login account" />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="(555) 123-4567" />
        </div>
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input className={inputClass} value={form.dateOfBirth} onChange={set('dateOfBirth')} type="date" />
        </div>
        <div>
          <label className={labelClass}>Gender</label>
          <select className={selectClass} value={form.gender} onChange={set('gender')}>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} value={form.city} onChange={set('city')} placeholder="City" />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input className={inputClass} value={form.state} onChange={set('state')} placeholder="State" />
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Tennis Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>UTR Singles</label>
          <input className={inputClass} value={form.utrSingles} onChange={set('utrSingles')} placeholder="e.g. 8.5" />
        </div>
        <div>
          <label className={labelClass}>UTR Doubles</label>
          <input className={inputClass} value={form.utrDoubles} onChange={set('utrDoubles')} placeholder="e.g. 7.0" />
        </div>
        <div>
          <label className={labelClass}>USTA Rating</label>
          <select className={selectClass} value={form.ustaRating} onChange={set('ustaRating')}>
            <option value="">Select...</option>
            {USTA_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Dominant Hand</label>
          <select className={selectClass} value={form.dominantHand} onChange={set('dominantHand')}>
            <option value="">Select...</option>
            <option value="Right">Right</option>
            <option value="Left">Left</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Play Style</label>
          <select className={selectClass} value={form.playStyle} onChange={set('playStyle')}>
            <option value="">Select...</option>
            {PLAY_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Years Playing</label>
          <input className={inputClass} value={form.yearsPlaying} onChange={set('yearsPlaying')} type="number" min="0" placeholder="e.g. 5" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Current Coach Name</label>
          <input className={inputClass} value={form.coachName} onChange={set('coachName')} placeholder="Coach name" />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Academic & Recruiting Info</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>High School</label>
          <input className={inputClass} value={form.highSchool} onChange={set('highSchool')} placeholder="School name" />
        </div>
        <div>
          <label className={labelClass}>Graduation Year</label>
          <select className={selectClass} value={form.graduationYear} onChange={set('graduationYear')}>
            <option value="">Select...</option>
            {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>GPA</label>
          <input className={inputClass} value={form.gpa} onChange={set('gpa')} placeholder="e.g. 3.8" />
        </div>
        <div>
          <label className={labelClass}>SAT Score</label>
          <input className={inputClass} value={form.satScore} onChange={set('satScore')} type="number" min="400" max="1600" placeholder="e.g. 1350" />
        </div>
        <div>
          <label className={labelClass}>ACT Score</label>
          <input className={inputClass} value={form.actScore} onChange={set('actScore')} type="number" min="1" max="36" placeholder="e.g. 28" />
        </div>
        <div>
          <label className={labelClass}>Intended Major</label>
          <input className={inputClass} value={form.intendedMajor} onChange={set('intendedMajor')} placeholder="e.g. Computer Science" />
        </div>
        <div>
          <label className={labelClass}>Recruiting Status</label>
          <select className={selectClass} value={form.recruitingStatus} onChange={set('recruitingStatus')}>
            <option value="">Select...</option>
            {RECRUITING.map(r => (
              <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Target Division</label>
          <select className={selectClass} value={form.targetDivision} onChange={set('targetDivision')}>
            <option value="">Select...</option>
            {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Highlight Video URL</label>
          <input className={inputClass} value={form.highlightVideoUrl} onChange={set('highlightVideoUrl')} placeholder="https://youtube.com/..." />
        </div>
      </div>
    </div>
  )

  const ReviewField = ({ label, value }) => {
    if (!value) return null
    return (
      <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 text-right">{value}</span>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Review Your Information</h3>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Personal Info</p>
        <ReviewField label="Name" value={form.fullName} />
        <ReviewField label="Email" value={form.email} />
        <ReviewField label="Phone" value={form.phone} />
        <ReviewField label="Date of Birth" value={form.dateOfBirth} />
        <ReviewField label="Gender" value={form.gender} />
        <ReviewField label="Location" value={[form.city, form.state].filter(Boolean).join(', ')} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Tennis Profile</p>
        <ReviewField label="UTR Singles" value={form.utrSingles} />
        <ReviewField label="UTR Doubles" value={form.utrDoubles} />
        <ReviewField label="USTA Rating" value={form.ustaRating} />
        <ReviewField label="Dominant Hand" value={form.dominantHand} />
        <ReviewField label="Play Style" value={form.playStyle} />
        <ReviewField label="Years Playing" value={form.yearsPlaying} />
        <ReviewField label="Coach" value={form.coachName} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Academic & Recruiting</p>
        <ReviewField label="High School" value={form.highSchool} />
        <ReviewField label="Graduation Year" value={form.graduationYear} />
        <ReviewField label="GPA" value={form.gpa} />
        <ReviewField label="SAT" value={form.satScore} />
        <ReviewField label="ACT" value={form.actScore} />
        <ReviewField label="Intended Major" value={form.intendedMajor} />
        <ReviewField label="Recruiting Status" value={form.recruitingStatus?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} />
        <ReviewField label="Target Division" value={form.targetDivision} />
        <ReviewField label="Highlight Video" value={form.highlightVideoUrl} />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          After submitting, an admin will review your registration. You'll get access once approved.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">TennisApp</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Player Registration</p>
        </div>

        {renderStepIndicator()}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === 0
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-800 text-white transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
