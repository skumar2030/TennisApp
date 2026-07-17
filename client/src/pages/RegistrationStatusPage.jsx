import { useAuth0 } from '@auth0/auth0-react'

export default function RegistrationStatusPage({ status, rejectionReason }) {
  const { logout } = useAuth0()

  const isPending = status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 ${
            isPending
              ? 'bg-yellow-100 dark:bg-yellow-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isPending ? (
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {isPending ? 'Registration Under Review' : 'Registration Not Approved'}
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isPending
              ? 'Your registration has been submitted successfully. An admin will review your application shortly.'
              : 'Unfortunately, your registration was not approved.'
            }
          </p>

          {!isPending && rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                <span className="font-semibold">Reason: </span>{rejectionReason}
              </p>
            </div>
          )}

          {isPending && (
            <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm text-green-700 dark:text-green-300">Awaiting admin approval</p>
            </div>
          )}

          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Log Out
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          TennisApp
        </p>
      </div>
    </div>
  )
}
