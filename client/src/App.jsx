import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { ThemeProvider, useTheme } from './ThemeContext'
import DashboardPage from './pages/DashboardPage'
import PlayersPage from './pages/PlayersPage'
import SchedulePage from './pages/SchedulePage'
import ExpensesPage from './pages/ExpensesPage'
import ExpenseSummaryPage from './pages/ExpenseSummaryPage'
import HistoryPage from './pages/HistoryPage'
import LiveScorePage from './pages/LiveScorePage'
import NewsPage from './pages/NewsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import QuizPage from './pages/QuizPage'
import QuizGame from './pages/QuizGame'
import QuizResults from './pages/QuizResults'
import QuizHistoryPage from './pages/QuizHistoryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import WordleLobbyPage from './pages/WordleLobbyPage'
import WordleGamePage from './pages/WordleGamePage'
import WordleLeaderboardPage from './pages/WordleLeaderboardPage'
import AuthAxios from './auth/AuthAxios'

const AUTH0_DOMAIN = 'dev-y8cbnyejlrsean26.us.auth0.com'
const AUTH0_CLIENT_ID = 'uCqCn4CeOf0MckCs1YqAbLmcA0dOkizp'
const AUTH0_CALLBACK_URL = window.location.origin + '/login/callback'

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded font-medium text-sm transition-colors ${
          isActive
            ? 'bg-green-700 text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

function AuthButtons() {
  const { isAuthenticated, user, loginWithRedirect, logout, isLoading } = useAuth0()

  if (isLoading) return null

  if (!isAuthenticated || (user && !user.email_verified)) {
    return (
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })}
          className="text-sm font-medium px-4 py-2 rounded bg-green-700 hover:bg-green-800 text-white"
        >
          Log In
        </button>
      </div>
    )
  }

  const firstName = (user?.name || user?.email || '').split(' ')[0]
  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="ml-auto relative flex items-center gap-1">
      <ThemeToggle />
      <div className="group relative">
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
              className="w-8 h-8 rounded-full ring-2 ring-green-200 object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div
            className="w-8 h-8 rounded-full bg-green-700 text-white items-center justify-center text-xs font-bold ring-2 ring-green-200"
            style={{ display: user?.picture ? 'none' : 'flex' }}
          >
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{firstName}</span>
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
          <NavLink
            to="/profile"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </NavLink>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user, logout } = useAuth0()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    loginWithRedirect()
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting to login...</p>
      </div>
    )
  }

  if (user && !user.email_verified) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded-lg shadow-sm p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Verify Your Email</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            A verification link has been sent to:
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">{user.email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please check your inbox and click the verification link to access TennisApp.
          </p>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return children
}

function Layout({ children }) {
  const { isAuthenticated, user } = useAuth0()
  const isVerified = isAuthenticated && user?.email_verified

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <NavLink to="/" className="text-xl font-bold text-green-700 dark:text-green-400 tracking-tight shrink-0">
            TennisApp
          </NavLink>
          <nav className="flex flex-wrap gap-1">
            <NavItem to="/" label="Dashboard" />
            {isVerified && (
              <>
                <NavItem to="/players" label="Players" />
                <NavItem to="/schedule" label="Schedule" />
                <NavItem to="/history" label="Match History" />
                <NavItem to="/expenses" label="Expenses" />
                <NavItem to="/expenses/summary" label="Summary" />
              </>
            )}
            <NavItem to="/news" label="News" />
            {isVerified && (
              <NavItem to="/play4fun" label="Play4Fun" />
            )}
            <NavItem to="/play4fun/leaderboard" label="Leaderboard" />
          </nav>
          <AuthButtons />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

function LoginCallback() {
  const { isLoading, error } = useAuth0()

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-semibold">Login Error</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Completing login...</p>
      </div>
    )
  }

  return <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/news" element={<Layout><NewsPage /></Layout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/callback" element={<LoginCallback />} />

      {/* Protected routes */}
      <Route path="/players" element={<Layout><ProtectedRoute><PlayersPage /></ProtectedRoute></Layout>} />
      <Route path="/schedule" element={<Layout><ProtectedRoute><SchedulePage /></ProtectedRoute></Layout>} />
      <Route path="/history" element={<Layout><ProtectedRoute><HistoryPage /></ProtectedRoute></Layout>} />
      <Route path="/expenses" element={<Layout><ProtectedRoute><ExpensesPage /></ProtectedRoute></Layout>} />
      <Route path="/expenses/summary" element={<Layout><ProtectedRoute><ExpenseSummaryPage /></ProtectedRoute></Layout>} />
      <Route path="/live/:matchId" element={<Layout><ProtectedRoute><LiveScorePage /></ProtectedRoute></Layout>} />
      <Route path="/profile" element={<Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>} />

      {/* Quiz routes */}
      <Route path="/play4fun" element={<Layout><ProtectedRoute><QuizPage /></ProtectedRoute></Layout>} />
      <Route path="/play4fun/game" element={<Layout><ProtectedRoute><QuizGame /></ProtectedRoute></Layout>} />
      <Route path="/play4fun/results" element={<Layout><ProtectedRoute><QuizResults /></ProtectedRoute></Layout>} />
      <Route path="/play4fun/history" element={<Layout><ProtectedRoute><QuizHistoryPage /></ProtectedRoute></Layout>} />
      <Route path="/play4fun/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />

      {/* Wordle routes */}
      <Route path="/play4fun/wordle" element={<Layout><ProtectedRoute><WordleLobbyPage /></ProtectedRoute></Layout>} />
      <Route path="/play4fun/wordle/:roomId" element={<Layout><ProtectedRoute><WordleGamePage /></ProtectedRoute></Layout>} />
      <Route path="/play4fun/wordle/leaderboard" element={<Layout><WordleLeaderboardPage /></Layout>} />
    </Routes>
  )
}

function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || '/')
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: AUTH0_CALLBACK_URL,
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
    >
      <AuthAxios>{children}</AuthAxios>
    </Auth0Provider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <AppRoutes />
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </ThemeProvider>
  )
}
