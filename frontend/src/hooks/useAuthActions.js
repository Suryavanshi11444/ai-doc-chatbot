export default function useAuthActions(requestJson, session) {
  async function handleAuthSubmit(event) {
    event.preventDefault()
    session.setAuthError('')
    session.setAuthMessage('')

    if (session.authMode === 'signup' && session.authForm.password !== session.authForm.confirmPassword) {
      session.setAuthError('Passwords do not match.')
      return
    }

    try {
      if (session.authMode === 'signup') {
        await requestJson(
          '/register/',
          {
            method: 'POST',
            auth: false,
            body: {
              username: session.authForm.username,
              password: session.authForm.password,
            },
          },
          false,
        )
      }

      const loginData = await requestJson(
        '/token/',
        {
          method: 'POST',
          auth: false,
          body: {
            username: session.authForm.username,
            password: session.authForm.password,
          },
        },
        false,
      )

      session.setSession(loginData.access, loginData.refresh)
      session.setAuthMessage(session.authMode === 'signup' ? 'Account created and signed in.' : 'Welcome back.')
    } catch (error) {
      session.setAuthError(error.message ? `Unable to authenticate: ${error.message}` : 'Unable to authenticate. Check your username and password.')
      session.setAuthMessage('')
    }
  }

  async function handleLogout() {
    session.clearSession()
    session.applyTheme(session.theme)
  }

  return {
    handleAuthSubmit,
    handleLogout,
  }
}