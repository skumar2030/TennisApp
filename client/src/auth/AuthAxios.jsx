import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function AuthAxios({ children }) {
  const { isAuthenticated, getIdTokenClaims } = useAuth0()

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      // Prepend API base URL for relative /api/ paths
      if (config.url?.startsWith('/api/') || config.url?.startsWith('/api?')) {
        config.url = API_BASE + config.url.slice(4)
      }
      if (isAuthenticated) {
        try {
          const claims = await getIdTokenClaims()
          if (claims?.__raw) {
            config.headers.Authorization = `Bearer ${claims.__raw}`
          }
        } catch {
          // Token fetch failed — proceed without auth header
        }
      }
      return config
    })

    return () => {
      axios.interceptors.request.eject(interceptor)
    }
  }, [isAuthenticated, getIdTokenClaims])

  return children
}
