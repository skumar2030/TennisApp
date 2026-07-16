import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

export default function AuthAxios({ children }) {
  const { isAuthenticated, getIdTokenClaims } = useAuth0()

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
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
