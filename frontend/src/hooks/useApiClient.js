import { useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export default function useApiClient({ accessToken, refreshToken, onRefreshToken, onClearSession }) {
  const refreshAccess = useCallback(async () => {
    if (!refreshToken) return false

    const response = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      onClearSession()
      return false
    }

    const data = await response.json()
    onRefreshToken(data.access)
    localStorage.setItem('access_token', data.access)
    return true
  }, [onClearSession, onRefreshToken, refreshToken])

  const requestJson = useCallback(
    async (path, options = {}, retry = true) => {
      const headers = {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      }

      if (options.auth !== false && accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const response = await fetch(`${API_BASE}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
      })

      if (response.status === 401 && options.auth !== false && retry) {
        const refreshed = await refreshAccess()
        if (refreshed) {
          return requestJson(path, options, false)
        }
      }

      if (!response.ok) {
        const rawMessage = await response.text()

        try {
          const parsed = JSON.parse(rawMessage)
          throw new Error(parsed.detail || parsed.message || JSON.stringify(parsed))
        } catch {
          throw new Error(rawMessage || 'Request failed')
        }
      }

      if (response.status === 204) return null

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return response.json()
      }

      return response.text()
    },
    [accessToken, refreshAccess],
  )

  return { requestJson, refreshAccess }
}