import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'

export default function LoginPage() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeWidth="2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" />
              <path strokeWidth="2" d="M2 12h20" />
              <path strokeWidth="2" d="M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10" />
              <path strokeWidth="2" d="M12 2c-2.5 3-4 6.5-4 10s1.5 7 4 10" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">TennisApp</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track matches, scores, and expenses</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">Welcome</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Sign in to access your matches, players, and expenses
          </p>

          <button
            onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
          >
            Log In
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-800 px-3 text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup', prompt: 'login' } })}
            className="w-full border border-green-700 text-green-700 hover:bg-green-50 font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
          >
            Create Account
          </button>

          <p className="text-xs text-gray-400 text-center mt-5">
            By continuing, you agree to TennisApp's terms of use.
          </p>
        </div>

        {/* Public access note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Dashboard and News are available without signing in.
        </p>
      </div>
    </div>
  )
}
