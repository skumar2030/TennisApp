import { useState, useEffect, lazy, Suspense, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { ThemeProvider, useTheme } from './ThemeContext'
import AuthAxios from './auth/AuthAxios'
import axios from 'axios'

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PlayersPage = lazy(() => import('./pages/PlayersPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))
const ExpenseSummaryPage = lazy(() => import('./pages/ExpenseSummaryPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const LiveScorePage = lazy(() => import('./pages/LiveScorePage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const QuizGame = lazy(() => import('./pages/QuizGame'))
const QuizResults = lazy(() => import('./pages/QuizResults'))
const QuizHistoryPage = lazy(() => import('./pages/QuizHistoryPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const WordleLobbyPage = lazy(() => import('./pages/WordleLobbyPage'))
const WordleGamePage = lazy(() => import('./pages/WordleGamePage'))
const WordleLeaderboardPage = lazy(() => import('./pages/WordleLeaderboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

// Eagerly imported — used in Layout before routing, can't be lazy
import RegisterPage from './pages/RegisterPage'
import RegistrationStatusPage from './pages/RegistrationStatusPage'

// User profile context — shares profile state across the app
const UserProfileContext = createContext(null)
export function useUserProfile() { return useContext(UserProfileContext) }

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID
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

function UserProfileProvider({ children }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth0()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchProfile = async () => {
    if (!isAuthenticated || !user?.sub) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    try {
      const res = await axios.get(`/api/user-profiles/me/${encodeURIComponent(user.sub)}`)
      setProfile(res.data) // null if not registered
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) fetchProfile()
  }, [isAuthenticated, user?.sub, authLoading])

  const refreshProfile = () => {
    setProfileLoading(true)
    fetchProfile()
  }

  return (
    <UserProfileContext.Provider value={{ profile, profileLoading, refreshProfile }}>
      {children}
    </UserProfileContext.Provider>
  )
}

function ProtectedRoute({ children, requireApproved = true }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user, logout } = useAuth0()
  const { profile, profileLoading } = useUserProfile()

  if (isLoading || profileLoading) {
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

  // No profile yet — show registration
  if (!profile) {
    return <RegisterPage onRegistered={() => window.location.reload()} />
  }

  // Pending or rejected — show status page
  if (requireApproved && profile.status === 'pending') {
    return <RegistrationStatusPage status="pending" />
  }
  if (requireApproved && profile.status === 'rejected') {
    return <RegistrationStatusPage status="rejected" rejectionReason={profile.rejectionReason} />
  }

  return children
}

function AdminRoute({ children }) {
  const { profile, profileLoading } = useUserProfile()
  const { isLoading } = useAuth0()

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function MobileNavItem({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-l-3 border-green-600'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function Layout({ children }) {
  const { isAuthenticated, user } = useAuth0()
  const { profile, profileLoading, refreshProfile } = useUserProfile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isVerified = isAuthenticated && user?.email_verified
  const isApproved = isVerified && profile?.status === 'approved'
  const isAdmin = isApproved && profile?.role === 'admin'

  // If authenticated + verified but no profile yet → show registration
  if (isVerified && !profileLoading && !profile) {
    return <RegisterPage onRegistered={refreshProfile} />
  }
  // If profile exists but not approved → show status page
  if (isVerified && !profileLoading && profile && profile.status === 'pending') {
    return <RegistrationStatusPage status="pending" />
  }
  if (isVerified && !profileLoading && profile && profile.status === 'rejected') {
    return <RegistrationStatusPage status="rejected" rejectionReason={profile.rejectionReason} />
  }

  const closeMenu = () => setMobileMenuOpen(false)

  // Nav icons
  const icons = {
    dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    players: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    schedule: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    history: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    expenses: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    summary: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    news: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
    play4fun: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    leaderboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <NavLink to="/" onClick={closeMenu} className="text-xl font-bold text-green-700 dark:text-green-400 tracking-tight shrink-0">
            TennisApp
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-wrap gap-1">
            <NavItem to="/" label="Dashboard" />
            {isApproved && (
              <>
                <NavItem to="/players" label="Players" />
                <NavItem to="/schedule" label="Schedule" />
                <NavItem to="/history" label="Match History" />
                <NavItem to="/expenses" label="Expenses" />
                <NavItem to="/expenses/summary" label="Summary" />
              </>
            )}
            <NavItem to="/news" label="News" />
            {isApproved && (
              <NavItem to="/play4fun" label="Play4Fun" />
            )}
            <NavItem to="/play4fun/leaderboard" label="Leaderboard" />
            {isAdmin && (
              <NavItem to="/admin" label="Admin" />
            )}
          </nav>

          <AuthButtons />
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-h-[70vh] overflow-y-auto">
            <div className="py-2">
              <MobileNavItem to="/" label="Dashboard" icon={icons.dashboard} onClick={closeMenu} />
              {isApproved && (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Manage</p>
                  </div>
                  <MobileNavItem to="/players" label="Players" icon={icons.players} onClick={closeMenu} />
                  <MobileNavItem to="/schedule" label="Schedule" icon={icons.schedule} onClick={closeMenu} />
                  <MobileNavItem to="/history" label="Match History" icon={icons.history} onClick={closeMenu} />
                  <MobileNavItem to="/expenses" label="Expenses" icon={icons.expenses} onClick={closeMenu} />
                  <MobileNavItem to="/expenses/summary" label="Summary" icon={icons.summary} onClick={closeMenu} />
                </>
              )}
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explore</p>
              </div>
              <MobileNavItem to="/news" label="News" icon={icons.news} onClick={closeMenu} />
              {isApproved && (
                <MobileNavItem to="/play4fun" label="Play4Fun" icon={icons.play4fun} onClick={closeMenu} />
              )}
              <MobileNavItem to="/play4fun/leaderboard" label="Leaderboard" icon={icons.leaderboard} onClick={closeMenu} />
              {isAdmin && (
                <>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
                  </div>
                  <MobileNavItem to="/admin" label="Admin Dashboard" icon={icons.leaderboard} onClick={closeMenu} />
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

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
    <Suspense fallback={<Layout><PageLoader /></Layout>}>
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

      {/* Admin route */}
      <Route path="/admin" element={<Layout><ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute></Layout>} />
    </Routes>
    </Suspense>
  )
}

function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || '/')
  }

  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold text-lg">Configuration Error</p>
          <p className="text-sm text-gray-500 mt-2">Auth0 environment variables are not set. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID.</p>
        </div>
      </div>
    )
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
      <AuthAxios>
        <UserProfileProvider>{children}</UserProfileProvider>
      </AuthAxios>
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
