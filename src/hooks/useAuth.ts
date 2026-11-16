import { useCallback, useState } from 'react'

const AUTH_KEY = 'academia-session'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === 'active' || localStorage.getItem(AUTH_KEY) === 'active',
  )

  const login = useCallback((rememberMe = false) => {
    sessionStorage.setItem(AUTH_KEY, 'active')
    if (rememberMe) localStorage.setItem(AUTH_KEY, 'active')
    else localStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}
