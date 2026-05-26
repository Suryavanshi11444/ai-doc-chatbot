import { useEffect, useState } from 'react'

const emptyAuthForm = {
  username: '',
  password: '',
  confirmPassword: '',
}

export default function useSessionController() {
  const [theme, setTheme] = useState('dark')
  const [booting, setBooting] = useState(true)
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [authMessage, setAuthMessage] = useState('')
  const [authError, setAuthError] = useState('')

  function applyTheme(nextTheme) {
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    localStorage.setItem('theme', nextTheme)
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function setSession(nextAccess, nextRefresh) {
    setAccessToken(nextAccess)
    setRefreshToken(nextRefresh)
    localStorage.setItem('access_token', nextAccess)
    localStorage.setItem('refresh_token', nextRefresh)
  }

  function clearSession() {
    setAccessToken('')
    setRefreshToken('')
    setUser(null)
    setAuthForm(emptyAuthForm)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    applyTheme(savedTheme)

    const savedAccess = localStorage.getItem('access_token') || ''
    const savedRefresh = localStorage.getItem('refresh_token') || ''

    if (savedAccess) {
      setAccessToken(savedAccess)
      setRefreshToken(savedRefresh)
      return
    }

    setBooting(false)
  }, [])

  return {
    theme,
    booting,
    accessToken,
    refreshToken,
    user,
    authMode,
    authForm,
    authMessage,
    authError,
    setBooting,
    setUser,
    setAuthMode,
    setAuthForm,
    setAuthMessage,
    setAuthError,
    setSession,
    clearSession,
    setAccessToken,
    setRefreshToken,
    toggleTheme,
    applyTheme,
  }
}